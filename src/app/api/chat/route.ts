import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { healthHandoff, runDemo } from "@/lib/demo";
import {
  complete,
  configuredProviders,
  readPhoto,
  visionProvider,
  type LlmMessage,
  type Provider,
} from "@/lib/llm";
import { rateLimit } from "@/lib/ratelimit";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { TOOLS, newUi, runTool, toResponse } from "@/lib/tools";
import type { ChatMessage, ChatResponse } from "@/lib/types";

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1000),
      }),
    )
    .min(1)
    .max(20),
  cart: z
    .array(z.object({ productId: z.number().int(), quantity: z.number().int().min(1).max(20) }))
    .max(40)
    .default([]),
  shownProductIds: z.array(z.number().int()).max(12).default([]),
  // Foto da mensagem atual, já reduzida no navegador. Não é guardada nem registrada em log.
  image: z
    .string()
    .max(1_500_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/)
    .optional(),
});

const PHOTO_CHIPS = ["Quero um whey protein", "Protetor solar para pele oleosa"];

/**
 * Lê a foto antes do loop de ferramentas. Devolve uma resposta pronta (receita, foto
 * sem produto, sem IA de visão) ou a descrição da embalagem para juntar à mensagem.
 */
async function handlePhoto(image: string): Promise<{ reply: ChatResponse } | { note: string }> {
  const ui = newUi();
  const vision = visionProvider();
  if (!vision) {
    ui.suggested = PHOTO_CHIPS;
    return {
      reply: toResponse(
        "demo",
        "A leitura de fotos precisa da IA com visão ativa, e ela não está ligada agora. Me conta o nome ou o tipo do produto que eu procuro para você.",
        ui,
      ),
    };
  }
  try {
    const photo = await readPhoto(vision, image);
    if (photo.kind === "receita") {
      ui.handoff = "Foto de receita médica.";
      return {
        reply: toResponse(
          "ai",
          "Isso parece uma receita médica. Por segurança, eu não leio receitas: quem confere a prescrição é um farmacêutico da Pague Menos. Se quiser, posso ajudar com dermocosméticos e suplementos.",
          ui,
        ),
      };
    }
    if (photo.kind === "outro" || !photo.searchTerms) {
      ui.suggested = PHOTO_CHIPS;
      return {
        reply: toResponse(
          "ai",
          "Não consegui identificar a embalagem de um produto nessa foto. Tente uma foto mais próxima do rótulo, ou me diga o nome do produto.",
          ui,
        ),
      };
    }
    const brand = photo.brand ? ` da marca ${photo.brand}` : "";
    return {
      note: `[Foto enviada pelo cliente: embalagem de ${photo.product || "produto"}${brand}. Procure esse produto ou similares no catálogo com os termos: ${photo.searchTerms}. Diga ao cliente o que você identificou na foto.]`,
    };
  } catch (err) {
    console.error("[intua] falha na leitura da foto:", err instanceof Error ? err.message : "erro desconhecido");
    ui.suggested = PHOTO_CHIPS;
    return {
      reply: toResponse("ai", "Não consegui ler a foto agora. Me diga o nome do produto que eu procuro para você.", ui),
    };
  }
}

const MAX_TOOL_ROUNDS = 6;

/**
 * O chat mostra texto cru. Mesmo com a regra no prompt, alguns modelos devolvem
 * markdown; aqui tiramos negrito, títulos e marcadores de lista para não aparecer "**".
 */
function plainText(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*•]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type Cart = { productId: number; quantity: number }[];

/** Roda o loop de ferramentas em um provedor. Lança erro se a API falhar. */
async function runWithProvider(p: Provider, history: ChatMessage[], cart: Cart, shownProductIds: number[]) {
  const ctx = { cart: new Map(cart.map((c) => [c.productId, c.quantity])), ui: newUi() };
  const messages: LlmMessage[] = [
    { role: "system", content: buildSystemPrompt(shownProductIds, cart) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  let text = "";
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await complete(p, messages, TOOLS);
    if (res.toolCalls.length === 0) {
      text = plainText(res.content);
      break;
    }
    messages.push({ role: "assistant", content: res.content || null, tool_calls: res.toolCalls });
    for (const call of res.toolCalls) {
      let args: unknown = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
      } catch {
        args = null;
      }
      const result = args === null ? { erro: "Argumentos não são JSON válido." } : runTool(call.function.name, args, ctx);
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  // Rede de segurança: tema de saúde sempre mostra o botão do farmacêutico,
  // mesmo que o modelo tenha respondido só em texto.
  if (!ctx.ui.handoff) {
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
    ctx.ui.handoff = healthHandoff(lastUser);
  }

  if (!text) {
    text = ctx.ui.recommended.length
      ? "Separei algumas opções na vitrine para você."
      : "Posso ajudar com dermocosméticos e suplementos. O que você está procurando?";
  }
  return toResponse("ai", text, ctx.ui);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Muitas mensagens em pouco tempo. Aguarde um instante e tente de novo." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // Sanitiza e prepara o histórico: começa em "user" e termina em "user".
  const history: ChatMessage[] = parsed.data.messages
    .map((m) => ({ role: m.role, content: m.content.replace(CONTROL_CHARS, "").trim() }))
    .filter((m) => m.content.length > 0)
    .slice(-12);
  while (history.length && history[0].role !== "user") history.shift();
  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const { cart, shownProductIds, image } = parsed.data;

  if (image) {
    const photo = await handlePhoto(image);
    if ("reply" in photo) return NextResponse.json(photo.reply);
    const last = history[history.length - 1];
    history[history.length - 1] = { ...last, content: `${last.content}\n${photo.note}` };
  }

  // Gemini -> Groq -> modo demonstração. Sem chave nenhuma, vai direto para o demo.
  for (const provider of configuredProviders()) {
    try {
      return NextResponse.json(await runWithProvider(provider, history, cart, shownProductIds));
    } catch (err) {
      // Log sem dados do cliente.
      console.error(`[intua] falha em ${provider.name}:`, err instanceof Error ? err.message : "erro desconhecido");
    }
  }
  return NextResponse.json(runDemo({ messages: history, cart, shownProductIds }));
}
