"use client";

import { Search, Sparkles } from "lucide-react";
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
          {recProducts.length > 0 && (
            <section className="px-3 pt-4 sm:px-5">
              <p className="flex items-center gap-1 text-xs font-medium text-promo">
                <Sparkles className="h-3.5 w-3.5" /> Selecionados para você
              </p>
              <h2 className="mb-3 border-b border-slate-200 pb-2 text-lg font-bold text-[#565656] sm:text-xl">
                Escolhas da INTUA
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
