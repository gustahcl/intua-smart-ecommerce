"use client";

import { ArrowRight, Send, Sparkles, Stethoscope, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";

export interface UiMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  productIds?: number[];
}

interface Props {
  messages: UiMessage[];
  loading: boolean;
  suggested: string[];
  handoff: string | null;
  mode: "ai" | "demo" | null;
  onSend: (text: string) => void;
  onViewShop: () => void;
  onClose?: () => void;
}

const STATUS = ["Entendendo o que você precisa…", "Consultando o catálogo…", "Preparando recomendações…"];

export const INITIAL_CHIPS = [
  "Quero um whey protein",
  "Protetor solar para pele oleosa",
  "Kit skin care pele oleosa até R$ 180",
  "Suplemento sem lactose",
];

function Avatar({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/brand/mascote-avatar.jpg"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full ring-2 ring-ai/70"
      style={{ width: size, height: size }}
    />
  );
}

/** Indicador de "pensando": só existe enquanto carrega, então o contador reinicia sozinho. */
function Thinking() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, STATUS.length - 1)), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Avatar />
      <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-xs text-white/70">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="intua-dot h-1.5 w-1.5 rounded-full bg-ai"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        <span role="status">{STATUS[idx]}</span>
      </div>
    </div>
  );
}

/** Renderizado com key={handoff}: cada novo encaminhamento começa com a nota fechada. */
function HandoffCard() {
  const [note, setNote] = useState(false);
  return (
    <div className="intua-in rounded-xl border border-amber-300/40 bg-amber-300/10 p-3 text-sm">
      <p className="flex items-start gap-2 text-amber-100">
        <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        Para a sua segurança, esse caso merece a orientação de um farmacêutico.
      </p>
      <button
        type="button"
        onClick={() => setNote(true)}
        className="mt-2 rounded-full bg-amber-300 px-4 py-1.5 text-xs font-bold text-navy hover:bg-amber-200"
      >
        Falar com farmacêutico
      </button>
      {note && (
        <p className="mt-2 text-xs text-amber-100/80">
          Na versão final, este botão abre o atendimento com um farmacêutico da loja (chat ou WhatsApp).
        </p>
      )}
    </div>
  );
}

export function Chat({ messages, loading, suggested, handoff, mode, onSend, onViewShop, onClose }: Props) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, handoff]);

  const chips = suggested.length > 0 ? suggested : messages.length <= 1 ? INITIAL_CHIPS : [];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || loading) return;
    onSend(draft);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-navy text-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <Avatar size={40} />
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-1.5 text-base font-bold leading-tight">
            INTUA <Sparkles className="h-4 w-4 text-ai" />
          </h1>
          <p className="truncate text-xs text-white/60">sua assistente de compras inteligente</p>
        </div>
        {mode && (
          <span
            title={
              mode === "demo"
                ? "Sem chave da API: respostas por roteiro de regras, não por IA."
                : "Respostas geradas por IA (Groq ou Gemini) com ferramentas do catálogo."
            }
            className={cx(
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              mode === "demo" ? "bg-amber-400/20 text-amber-300" : "bg-ai/20 text-ai",
            )}
          >
            {mode === "demo" ? "Modo demo" : "IA ativa"}
          </span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar assistente"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="intua-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length <= 1 && (
          <div className="intua-in flex items-center gap-4 rounded-2xl bg-white/5 p-3">
            <Image
              src="/brand/mascote-480.jpg"
              alt="Mascote da INTUA, um robô vermelho com a cruz da Pague Menos no peito, acenando"
              width={96}
              height={96}
              className="h-24 w-24 shrink-0 rounded-xl"
            />
            <p className="text-sm leading-snug text-white/80">
              Eu encontro, comparo e ajudo você a escolher. Conte o que precisa, sem se preocupar com nomes técnicos.
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="intua-in flex items-start gap-2">
              <Avatar />
              <div className="max-w-[85%]">
                <p className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed">
                  {m.content}
                </p>
                {m.productIds && m.productIds.length > 0 && (
                  <button
                    type="button"
                    onClick={onViewShop}
                    className="mt-1.5 flex items-center gap-1 text-xs font-medium text-ai hover:underline"
                  >
                    Ver {m.productIds.length} {m.productIds.length === 1 ? "produto" : "produtos"} na vitrine
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="intua-in flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand px-3.5 py-2.5 text-sm leading-relaxed">
                {m.content}
              </p>
            </div>
          ),
        )}

        {loading && <Thinking />}

        {handoff && !loading && <HandoffCard key={handoff} />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 px-4 pb-3 pt-3">
        {chips.length > 0 && !loading && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onSend(c)}
                className="rounded-full border border-ai/50 px-3 py-1.5 text-xs font-medium text-ai transition-colors hover:bg-ai/10"
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex items-center gap-2">
          <label className="sr-only" htmlFor="intua-input">
            Mensagem para a INTUA
          </label>
          <input
            id="intua-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder="Conte o que você procura…"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-ai"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            aria-label="Enviar mensagem"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[10px] text-white/40">
          A INTUA não substitui a orientação de um farmacêutico ou médico.
        </p>
      </div>
    </div>
  );
}
