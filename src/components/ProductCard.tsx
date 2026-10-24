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
          className={cx("h-2.5 w-2.5 sm:h-3 sm:w-3", i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300")}
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
        "intua-in relative flex h-full flex-col rounded-xl border bg-white p-2.5 pt-5 sm:p-3 sm:pt-5 transition-shadow hover:shadow-md",
        highlighted ? "border-ai ring-2 ring-ai/40" : "border-slate-200",
      )}
    >
      {/* Badges de destaque/promoção */}
      <div className="absolute left-2.5 top-0 sm:left-3 flex h-4.5 gap-1 whitespace-nowrap">
        {highlighted && (
          <span className="flex items-center gap-1 rounded-b bg-navy px-1.5 py-0.5 text-[9px] font-medium text-ai sm:text-[10px]">
            <Sparkles className="h-2.5 w-2.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">Escolha da </span>INTUA
            </span>
          </span>
        )}
        {promo && (
          <span className="rounded-b bg-tag px-1.5 py-0.5 text-[9px] font-medium text-promo sm:text-[10px]">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Imagem do produto em proporção 1:1 compacta e perfeitamente ajustada */}
      <ProductVisual product={p} className="aspect-square w-full" />

      {/* Nome do produto com altura uniforme para 2 linhas */}
      <h3 className="mt-2 line-clamp-2 h-[32px] sm:h-[34px] text-[12.5px] sm:text-[13.5px] font-medium leading-[16px] sm:leading-[17px] text-[#4f4f4f]">
        {p.name}
      </h3>

      {/* Avaliação em estrelas com altura fixa */}
      <div className="mt-1 flex h-3.5 items-center gap-1">
        <Stars rating={p.rating} />
        <span className="text-[10px] text-slate-500">({p.reviews.toLocaleString("pt-BR")})</span>
      </div>

      {/* Marca e tamanho com altura fixa */}
      <div className="mt-0.5 flex h-3.5 items-baseline gap-1.5 truncate">
        <span className="text-[10.5px] sm:text-[11px] font-bold uppercase text-[#212121]">{p.brand}</span>
        <span className="text-[10px] text-slate-500">{p.size}</span>
      </div>

      {/* Bloco de preços com alinhamento vertical rigoroso */}
      <div className="mt-1.5">
        <div className="h-3.5 text-[10.5px] leading-none">
          {promo ? (
            <span className="text-[#757575] line-through">{brl(p.originalPrice!)}</span>
          ) : (
            <span className="invisible select-none" aria-hidden="true">
              &nbsp;
            </span>
          )}
        </div>
        <div className={cx("mt-0.5 font-bold leading-tight", promo ? "text-[18px] sm:text-[19px] text-promo" : "text-[19px] sm:text-[20px] text-price")}>
          {brl(p.price)}
        </div>
        <div className="mt-0.5 h-3 truncate text-[10px] text-slate-500">
          {formatMetric(valueMetric(p))}
        </div>
      </div>

      {/* Seção inferior ancorada com mt-auto */}
      <div className="mt-auto flex flex-col pt-2 sm:pt-2.5">
        {reason && (
          <div className="mb-2 rounded-lg bg-ai/10 p-1.5">
            <p className="line-clamp-2 text-[10.5px] leading-snug text-navy-800">{reason}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => onExplain(p.id)}
          className="flex h-4.5 items-center gap-1 self-start text-left text-[11px] font-medium text-ai-700 hover:underline"
        >
          <Sparkles className="h-3 w-3 shrink-0" />
          <span className="truncate">{reason ? "Por que a INTUA recomendou?" : "Perguntar à INTUA"}</span>
        </button>

        <div className="mt-2">
          {quantity === 0 ? (
            <button
              type="button"
              onClick={() => onAdd(p.id)}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full bg-brand text-xs font-bold text-white transition-colors hover:bg-brand-700 active:scale-[0.98]"
            >
              <ShoppingCart className="h-3.5 w-3.5" /> Adicionar
            </button>
          ) : (
            <div className="flex h-8 items-center justify-between rounded-full border-2 border-brand px-1">
              <button
                type="button"
                aria-label="Diminuir quantidade"
                onClick={() => onSetQty(p.id, quantity - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-brand hover:bg-tag"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-bold text-brand">{quantity}</span>
              <button
                type="button"
                aria-label="Aumentar quantidade"
                onClick={() => onSetQty(p.id, quantity + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-brand hover:bg-tag"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
