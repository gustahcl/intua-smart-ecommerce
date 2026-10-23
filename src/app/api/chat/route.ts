import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runDemo } from "@/lib/demo";
import { rateLimit } from "@/lib/ratelimit";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { TOOLS, newUi, runTool, toResponse } from "@/lib/tools";
import type { ChatMessage } from "@/lib/types";

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
});

const MAX_TOOL_ROUNDS = 6;

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

  const { cart, shownProductIds } = parsed.data;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(runDemo({ messages: history, cart, shownProductIds }));
  }

  try {
    const client = new Anthropic({ apiKey });
    const model = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
    const system = buildSystemPrompt(shownProductIds, cart);
    const ctx = { cart: new Map(cart.map((c) => [c.productId, c.quantity])), ui: newUi() };

    const messages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let text = "";
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const res = await client.messages.create({
        model,
        max_tokens: 1024,
        system,
        tools: TOOLS,
        messages,
      });

      if (res.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: res.content });
        const results: Anthropic.ToolResultBlockParam[] = [];
        for (const block of res.content) {
          if (block.type === "tool_use") {
            results.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(runTool(block.name, block.input, ctx)),
            });
          }
        }
        messages.push({ role: "user", content: results });
        continue;
      }

      text = res.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join("\n")
        .trim();
      break;
    }

    if (!text) {
      text = ctx.ui.recommended.length
        ? "Separei algumas opções na vitrine para você."
        : "Posso ajudar com dermocosméticos e suplementos. O que você está procurando?";
    }
    return NextResponse.json(toResponse("ai", text, ctx.ui));
  } catch (err) {
    // Log sem dados do cliente. Se a API falhar, cai para o modo demonstração.
    console.error("[intua] falha na API do modelo:", err instanceof Error ? err.message : "erro desconhecido");
    return NextResponse.json(runDemo({ messages: history, cart, shownProductIds }));
  }
}
