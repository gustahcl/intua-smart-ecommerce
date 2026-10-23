"use client";

import { Minus, Plus, ShoppingCart, Sparkles, Star } from "lucide-react";
import { brl, discountPct, formatMetric, valueMetric } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import type { CatalogProduct } from "@/lib/types";
import { ProductVisual } from "./ProductVisual";

interface Props {
  product: CatalogProduct;
  quantity: number;
  reason?: string;
  highlighted?: boolean;
  onAdd: (id: number) => void;
  onSetQty: (id: number, qty: number) => void;
  onExplain: (id: number) => void;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`Avaliação ${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cx("h-3 w-3", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300")}
        />
      ))}
    </span>
  );
}

export function ProductCard({ product: p, quantity, reason, highlighted, onAdd, onSetQty, onExplain }: Props) {
  const discount = discountPct(p);
  const promo = discount > 0;

  return (
    <article
      className={cx(
        "intua-in relative flex flex-col rounded-xl border bg-white p-3 pt-6 transition-shadow hover:shadow-md",
        highlighted ? "border-ai ring-2 ring-ai/40" : "border-slate-200",
      )}
    >
      <div className="absolute left-3 top-0 flex gap-1 whitespace-nowrap">
        {highlighted && (
          <span className="flex items-center gap-1 rounded-b bg-navy px-1.5 py-0.5 text-[10px] font-medium text-ai sm:px-2 sm:text-[11px]">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>
              <span className="hidden sm:inline">Escolha da </span>INTUA
            </span>
          </span>
        )}
        {promo && (
          <span className="rounded-b bg-tag px-1.5 py-0.5 text-[10px] font-medium text-promo sm:px-2 sm:text-[11px]">
            {discount}% OFF
          </span>
        )}
      </div>

      <ProductVisual product={p} className="h-28 w-full" />

      <h3 className="mt-3 line-clamp-2 min-h-[36px] text-[15px] font-medium leading-[18px] text-[#4f4f4f]">
        {p.name}
      </h3>

      <div className="mt-1.5 flex items-center gap-1.5">
        <Stars rating={p.rating} />
        <span className="text-[11px] text-slate-500">({p.reviews.toLocaleString("pt-BR")})</span>
      </div>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-xs font-bold uppercase text-[#212121]">{p.brand}</span>
        <span className="text-[11px] text-slate-500">{p.size}</span>
      </div>

      <div className="mt-2">
        {promo && <div className="text-xs text-[#757575] line-through">{brl(p.originalPrice!)}</div>}
        <div className={cx("font-bold leading-none", promo ? "text-[22px] text-promo" : "text-2xl text-price")}>
          {brl(p.price)}
        </div>
        <div className="mt-1 text-[11px] text-slate-500">{formatMetric(valueMetric(p))}</div>
      </div>

      {reason && (
        <div className="mt-2 rounded-lg bg-ai/10 p-2">
          <p className="line-clamp-3 text-xs leading-snug text-navy-800">{reason}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => onExplain(p.id)}
        className="mt-2 flex items-start gap-1 self-start text-left text-xs font-medium text-ai-700 hover:underline"
      >
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {reason ? "Por que a INTUA recomendou?" : "Perguntar à INTUA"}
      </button>

      <div className="mt-3">
        {quantity === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(p.id)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-2 text-sm font-bold text-white transition-colors hover:bg-brand-700 active:scale-[0.98]"
          >
            <ShoppingCart className="h-4 w-4" /> Adicionar
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-full border-2 border-brand px-1 py-0.5">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              onClick={() => onSetQty(p.id, quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-brand hover:bg-tag"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-brand">{quantity}</span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              onClick={() => onSetQty(p.id, quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-brand hover:bg-tag"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
