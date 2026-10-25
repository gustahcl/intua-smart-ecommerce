"use client";

import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { CATALOG, normalize } from "@/lib/catalog";
import type { Cart } from "@/lib/cart";
import { cx } from "@/lib/cx";
import type { Category } from "@/lib/types";
import { CompareTable } from "./CompareTable";
import { ProductCard } from "./ProductCard";

export type CategoryFilter = Category | "todos";

interface Props {
  cart: Cart;
  recommended: { id: number; reason: string }[];
  compareIds: number[];
  query: string;
  category: CategoryFilter;
  onCategory: (c: CategoryFilter) => void;
  onAdd: (id: number) => void;
  onSetQty: (id: number, qty: number) => void;
  onExplain: (id: number) => void;
  onCloseCompare: () => void;
  /** Pedido do cliente que gerou as recomendações atuais. */
  intent?: string;
  /** Envia um pedido em linguagem natural para a INTUA. */
  onAsk: (text: string) => void;
}

const INTENT_EXAMPLES = [
  "Protetor solar para pele oleosa até R$ 80",
  "Whey para ganhar massa até R$ 120",
  "Kit skin care pele oleosa até R$ 180",
];

/** Barra de intenção: a loja aceita o pedido em linguagem natural, sem abrir um chat antes. */
function IntentBar({ onAsk }: { onAsk: (text: string) => void }) {
  const [text, setText] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAsk(text);
    setText("");
  };
  return (
    <section className="mx-3 mt-4 rounded-2xl bg-navy p-4 text-white sm:mx-5 sm:p-6">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ai">
        <Sparkles className="h-3.5 w-3.5" /> Busca inteligente INTUA
      </p>
      <h2 className="mt-1 text-lg font-bold sm:text-2xl">Diga o que você precisa, sem nomes técnicos</h2>
      <p className="mt-1 text-sm text-white/70">A vitrine se reorganiza com as melhores opções para o seu caso e o seu orçamento.</p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label className="sr-only" htmlFor="intent-input">
          O que você procura?
        </label>
        <input
          id="intent-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          autoComplete="off"
          placeholder="Ex.: algo para manchas de acne que não deixe a pele oleosa"
          className="min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-ai"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="flex shrink-0 items-center gap-1 rounded-full bg-brand px-4 text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
        >
          <span className="hidden sm:inline">Encontrar</span> <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {INTENT_EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onAsk(ex)}
            className="rounded-full border border-ai/50 px-3 py-1 text-xs text-ai hover:bg-ai/10"
          >
            {ex}
          </button>
        ))}
      </div>
    </section>
  );
}

const FILTERS: { key: CategoryFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "dermocosmetico", label: "Dermo e Beleza" },
  { key: "suplemento", label: "Vida Saudável" },
];

export function Showcase({
  cart,
  recommended,
  compareIds,
  query,
  category,
  onCategory,
  onAdd,
  onSetQty,
  onExplain,
  onCloseCompare,
  intent,
  onAsk,
}: Props) {
  const q = normalize(query).trim();
  const searching = q.length > 0;
  const recIds = new Set(recommended.map((r) => r.id));
  const reasonOf = new Map(recommended.map((r) => [r.id, r.reason]));

  const matchesQuery = (text: string) => q.split(/\s+/).every((t) => text.includes(t));
  const pool = CATALOG.filter((p) => category === "todos" || p.category === category);
  const results = searching
    ? pool.filter((p) => matchesQuery(normalize([p.name, p.brand, p.subcategory, ...p.tags, ...p.actives].join(" "))))
    : [];
  const others = pool.filter((p) => !recIds.has(p.id));
  const recProducts = recommended.flatMap((r) => {
    const p = CATALOG.find((x) => x.id === r.id);
    return p ? [p] : [];
  });

  const card = (p: (typeof CATALOG)[number], highlighted = false) => (
    <ProductCard
      key={p.id}
      product={p}
      quantity={cart[p.id] ?? 0}
      reason={reasonOf.get(p.id)}
      highlighted={highlighted}
      onAdd={onAdd}
      onSetQty={onSetQty}
      onExplain={onExplain}
    />
  );

  // Grade responsiva e compacta: 2 colunas no mobile, 3 no sm, 4 no md, 5 no lg e 6 no xl/2xl
  const grid = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

  return (
    <div className="mx-auto max-w-[1600px] pb-12">
      <CompareTable ids={compareIds} onClose={onCloseCompare} onAdd={onAdd} />

      {searching ? (
        <section className="px-3 pt-4 sm:px-5">
          <h2 className="mb-3 text-lg font-bold text-[#565656] sm:text-xl">
            Resultados para &ldquo;{query.trim()}&rdquo;
          </h2>
          {results.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg bg-white p-4 text-sm text-slate-500">
              <Search className="h-4 w-4" /> Nenhum produto encontrado. Experimente pedir à INTUA.
            </p>
          ) : (
            <div className={grid}>{results.map((p) => card(p, recIds.has(p.id)))}</div>
          )}
        </section>
      ) : (
        <>
          {recProducts.length === 0 && <IntentBar onAsk={onAsk} />}

          {recProducts.length > 0 && (
            // A key muda a cada nova recomendação: a seção reaparece animada e fica claro que a loja reagiu.
            <section key={recProducts.map((p) => p.id).join("-")} className="intua-in px-3 pt-4 sm:px-5">
              <p className="flex items-center gap-1 text-xs font-medium text-promo">
                <Sparkles className="h-3.5 w-3.5" /> A vitrine foi reorganizada pela INTUA
              </p>
              <h2 className="mb-3 flex flex-wrap items-baseline gap-x-2 border-b border-slate-200 pb-2 text-lg font-bold text-[#565656] sm:text-xl">
                Escolhas da INTUA
                {intent && (
                  <span className="text-sm font-normal text-slate-500">
                    para &ldquo;{intent.length > 70 ? intent.slice(0, 70) + "…" : intent}&rdquo; ·{" "}
                    {recProducts.length} {recProducts.length === 1 ? "opção" : "opções"}
                  </span>
                )}
              </h2>
              <div className={grid}>{recProducts.map((p) => card(p, true))}</div>
            </section>
          )}

          <section className="px-3 pt-5 sm:px-5">
            <p className="text-xs font-medium text-promo">Aproveite!</p>
            <h2 className="border-b border-slate-200 pb-2 text-lg font-bold text-[#565656] sm:text-xl">
              {recProducts.length > 0 ? "Mais produtos" : "Ofertas em Dermo e Vida Saudável"}
            </h2>
            <div className="my-3 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => onCategory(f.key)}
                  className={cx(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    category === f.key
                      ? "border-price bg-price text-white"
                      : "border-slate-300 bg-white text-slate-600 hover:border-price",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className={grid}>{others.map((p) => card(p))}</div>
          </section>
        </>
      )}
    </div>
  );
}
