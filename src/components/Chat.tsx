"use client";

import {
  ArrowRight,
  Camera,
  Minus,
  Paperclip,
  Plus,
  Send,
  ShoppingCart,
  Sparkles,
  Star,
  Stethoscope,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { brl, discountPct, getProduct } from "@/lib/catalog";
import type { Cart } from "@/lib/cart";
import { cx } from "@/lib/cx";
import { ProductVisual } from "./ProductVisual";

export interface UiMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  image?: string;
  productIds?: number[];
}

interface Props {
  messages: UiMessage[];
  loading: boolean;
  suggested: string[];
  handoff: string | null;
  mode: "ai" | "demo" | null;
  onSend: (text: string, image?: string) => void;
  onViewShop: () => void;
  onClose?: () => void;
  onAdd?: (id: number) => void;
  onSetQty?: (id: number, qty: number) => void;
  cart?: Cart;
}

const STATUS = [
  "Entendendo o que você precisa…",
  "Processando foto e consultando ativos…",
  "Consultando o catálogo da Pague Menos…",
  "Preparando recomendações…",
];

export const INITIAL_CHIPS = [
  "📸 Foto de receita médica",
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

function MiniStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Avaliação ${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cx("h-2 w-2", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300")}
        />
      ))}
    </span>
  );
}

/** Card de produto compacto renderizado diretamente dentro da conversa */
function ChatProductCard({
  productId,
  qty,
  onAdd,
  onSetQty,
}: {
  productId: number;
  qty: number;
  onAdd?: (id: number) => void;
  onSetQty?: (id: number, qty: number) => void;
}) {
  const p = getProduct(productId);
  if (!p) return null;

  const discount = discountPct(p);
  const promo = discount > 0;

  return (
    <div className="flex w-[128px] shrink-0 snap-start flex-col rounded-xl border border-white/10 bg-white p-2 text-slate-800 shadow-sm">
      {/* Imagem do produto com badge de desconto */}
      <div className="relative overflow-hidden rounded-lg bg-slate-50">
        <ProductVisual product={p} className="aspect-square w-full" />
        {promo && (
          <span className="absolute left-1 top-1 rounded bg-tag px-1 py-0.2 text-[8.5px] font-bold text-promo">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Título do produto */}
      <h4 className="mt-1.5 line-clamp-2 h-[26px] text-[10px] font-medium leading-[13px] text-slate-800">
        {p.name}
      </h4>

      {/* Avaliação e Marca */}
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[9px] font-bold uppercase text-slate-500">{p.brand}</span>
        <div className="flex items-center gap-0.5">
          <MiniStars rating={p.rating} />
        </div>
      </div>

      {/* Preço */}
      <div className="mt-1">
        <div className="h-2.5 text-[9px] leading-none">
          {promo ? (
            <span className="text-slate-400 line-through">{brl(p.originalPrice!)}</span>
          ) : (
            <span className="invisible select-none" aria-hidden="true">&nbsp;</span>
          )}
        </div>
        <div className={cx("font-bold leading-tight", promo ? "text-[13px] text-promo" : "text-[13px] text-price")}>
          {brl(p.price)}
        </div>
      </div>

      {/* Botão de Adicionar / Contador de Quantidade */}
      <div className="mt-1.5 pt-0.5">
        {qty === 0 ? (
          <button
            type="button"
            onClick={() => onAdd?.(p.id)}
            className="flex h-6 w-full items-center justify-center gap-1 rounded-full bg-brand text-[10px] font-bold text-white transition-colors hover:bg-brand-700 active:scale-95 shadow-sm"
          >
            <ShoppingCart className="h-2.5 w-2.5" /> Adicionar
          </button>
        ) : (
          <div className="flex h-6 items-center justify-between rounded-full border border-brand px-1">
            <button
              type="button"
              aria-label="Diminuir"
              onClick={() => onSetQty?.(p.id, qty - 1)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-brand hover:bg-tag"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="text-[11px] font-bold text-brand">{qty}</span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() => onSetQty?.(p.id, qty + 1)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-brand hover:bg-tag"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Indicador de "pensando": só existe enquanto carrega, então o contador reinicia sozinho. */
function Thinking() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => Math.min(i + 1, STATUS.length - 1)), 1300);
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

export function Chat({
  messages,
  loading,
  suggested,
  handoff,
  mode,
  onSend,
  onViewShop,
  onClose,
  onAdd,
  onSetQty,
  cart,
}: Props) {
  const [draft, setDraft] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, handoff]);

  const chips = suggested.length > 0 ? suggested : messages.length <= 1 ? INITIAL_CHIPS : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleChipClick = (c: string) => {
    if (c.includes("Foto de receita")) {
      onSend(
        "Tenho esta foto de receita médica prescrevendo protetor solar facial toque seco FPS 60 e sérum de vitamina C. Você tem no catálogo?",
        "/brand/mascote-480.jpg",
      );
    } else {
      onSend(c);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!draft.trim() && !attachedImage) || loading) return;
    onSend(draft || "Analise esta imagem enviada:", attachedImage ?? undefined);
    setDraft("");
    setAttachedImage(null);
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
              Eu encontro, comparo e ajudo você a escolher. Conte o que precisa ou envie a foto de uma receita ou produto.
            </p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "assistant" ? (
            <div key={m.id} className="intua-in flex items-start gap-2">
              <Avatar />
              <div className="min-w-0 max-w-[88%] flex-1">
                {/* Balão de texto da IA */}
                <p className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-sm leading-relaxed">
                  {m.content}
                </p>

                {/* Cards dos produtos sugeridos renderizados diretamente no chat */}
                {m.productIds && m.productIds.length > 0 && (
                  <div className="mt-2.5">
                    <div className="intua-scroll flex gap-2.5 overflow-x-auto pb-2 pt-1 snap-x -mx-1 px-1">
                      {m.productIds.map((id) => (
                        <ChatProductCard
                          key={id}
                          productId={id}
                          qty={cart?.[id] ?? 0}
                          onAdd={onAdd}
                          onSetQty={onSetQty}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onViewShop}
                      className="mt-1 flex items-center gap-1 text-xs font-medium text-ai hover:underline"
                    >
                      Ver {m.productIds.length} {m.productIds.length === 1 ? "produto" : "produtos"} na vitrine
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div key={m.id} className="intua-in flex justify-end">
              <div className="max-w-[85%] flex flex-col items-end">
                {m.image && (
                  <div className="relative mb-1.5 h-32 w-44 overflow-hidden rounded-xl border border-white/20 shadow-md">
                    <Image
                      src={m.image}
                      alt="Anexo do usuário"
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  </div>
                )}
                {m.content && (
                  <p className="whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand px-3.5 py-2.5 text-sm leading-relaxed text-white">
                    {m.content}
                  </p>
                )}
              </div>
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
                onClick={() => handleChipClick(c)}
                className="rounded-full border border-ai/50 px-3 py-1.5 text-xs font-medium text-ai transition-colors hover:bg-ai/10"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Pré-visualização da imagem anexada antes do envio */}
        {attachedImage && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/10 p-2">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-white/20">
              <Image src={attachedImage} alt="Anexo" fill className="object-cover" />
            </div>
            <span className="flex-1 text-xs text-white/80 truncate">Foto anexada para análise</span>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={submit} className="flex items-center gap-2">
          {/* Input oculto de upload de imagem */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Botão de câmera/anexo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Enviar foto de receita médica ou embalagem"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
          >
            <Camera className="h-4.5 w-4.5 text-ai" />
          </button>

          <label className="sr-only" htmlFor="intua-input">
            Mensagem para a INTUA
          </label>
          <input
            id="intua-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder={attachedImage ? "Adicione uma mensagem ou envie…" : "Escreva ou envie uma foto…"}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-ai"
          />
          <button
            type="submit"
            disabled={loading || (!draft.trim() && !attachedImage)}
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
