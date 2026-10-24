/**
 * Cliente mínimo para APIs no formato "chat completions" da OpenAI.
 * Groq e Google Gemini expõem esse formato com plano gratuito, então um único
 * loop de ferramentas atende os dois, sem SDK extra.
 */
import type { ToolDef } from "./tools";

export interface Provider {
  name: "groq" | "gemini";
  url: string;
  apiKey: string;
  model: string;
}

/** Provedores configurados, na ordem de tentativa: Groq, depois Gemini. */
export function configuredProviders(): Provider[] {
  const list: Provider[] = [];
  if (process.env.GROQ_API_KEY) {
    list.push({
      name: "groq",
      url: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });
  }
  if (process.env.GEMINI_API_KEY) {
    list.push({
      name: "gemini",
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });
  }
  return list;
}

export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export type LlmMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

interface Completion {
  choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] }; finish_reason?: string }[];
}

const TIMEOUT_MS = 15_000;

export async function complete(p: Provider, messages: LlmMessage[], tools: ToolDef[]) {
  const res = await fetch(p.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${p.apiKey}` },
    body: JSON.stringify({
      model: p.model,
      messages,
      tools: tools.map((t) => ({ type: "function", function: t })),
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    // Só o status vai para o log: o corpo pode ecoar trechos da conversa.
    throw new Error(`${p.name} respondeu HTTP ${res.status}`);
  }
  const data = (await res.json()) as Completion;
  const msg = data.choices?.[0]?.message;
  if (!msg) throw new Error(`${p.name} devolveu resposta vazia`);
  return { content: msg.content ?? "", toolCalls: msg.tool_calls ?? [] };
}
