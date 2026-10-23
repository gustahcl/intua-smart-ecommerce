"use client";

import { ChevronDown, Minus, Plus, ShoppingCart, Trash2, Truck } from "lucide-react";
import { brl, getProduct } from "@/lib/catalog";
import { cartCount, cartTotal, type Cart } from "@/lib/cart";
import { cx } from "@/lib/cx";
import { ProductVisual } from "./ProductVisual";

// Regra de frete grátis exibida no site da Pague Menos (mock: sem as condições reais).
const FREE_SHIPPING_FROM = 150;

interface Props {
  cart: Cart;
  open: boolean;
  checkoutNote: boolean;
  onToggle: () => void;
  onSetQty: (id: number, qty: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartBar({ cart, open, checkoutNote, onToggle, onSetQty, onClear, onCheckout }: Props) {
  const count = cartCount(cart);
  const total = cartTotal(cart);
  const missing = Math.max(0, FREE_SHIPPING_FROM - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_FROM) * 100);
  const entries = Object.entries(cart).flatMap(([id, qty]) => {
    const p = getProduct(Number(id));
    return p ? [{ p, qty }] : [];
  });

  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
          <ShoppingCart className="h-4.5 w-4.5" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-navy px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-slate-800">Seu carrinho</span>
          <span className="block text-xs text-slate-500">
            {count === 0 ? "Vazio. Peça para a INTUA adicionar produtos." : `${count} ${count === 1 ? "item" : "itens"}`}
          </span>
        </span>
        <span className="text-lg font-bold text-price">{brl(total)}</span>
        <ChevronDown className={cx("h-5 w-5 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          {entries.length === 0 ? (
            <p className="py-2 text-sm text-slate-500">Nenhum item ainda.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {entries.map(({ p, qty }) => (
                <li key={p.id} className="flex items-center gap-3 py-2">
                  <ProductVisual product={p} small className="h-12 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {brl(p.price)} cada
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 px-1">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      onClick={() => onSetQty(p.id, qty - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{qty}</span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      onClick={() => onSetQty(p.id, qty + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="w-20 text-right text-sm font-bold text-slate-800">{brl(p.price * qty)}</span>
                  <button
                    type="button"
                    aria-label={`Remover ${p.name}`}
                    onClick={() => onSetQty(p.id, 0)}
                    className="text-slate-400 hover:text-brand"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {entries.length > 0 && (
            <>
              <div className="mt-3 rounded-lg bg-surface p-3">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Truck className="h-4 w-4 text-price" />
                  {missing === 0
                    ? "Você ganhou frete grátis*"
                    : `Faltam ${brl(missing)} para frete grátis*`}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-price transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Esvaziar
                </button>
                <button
                  type="button"
                  onClick={onCheckout}
                  className="flex-1 rounded-full bg-brand py-2 text-sm font-bold text-white hover:bg-brand-700"
                >
                  Finalizar compra · {brl(total)}
                </button>
              </div>
              {checkoutNote && (
                <p className="mt-2 text-xs text-slate-500">
                  O checkout está fora do escopo do MVP: o próximo passo é integrar ao carrinho real da Pague Menos.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
