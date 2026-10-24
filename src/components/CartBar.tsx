"use client";

import { Minus, Plus, Trash2, Truck, X } from "lucide-react";
import { useEffect } from "react";
import { brl, getProduct } from "@/lib/catalog";
import { cartCount, cartTotal, type Cart } from "@/lib/cart";
import { ProductVisual } from "./ProductVisual";

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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onToggle();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onToggle]);

  if (!open) return null;

  const count = cartCount(cart);
  const total = cartTotal(cart);
  const missing = Math.max(0, FREE_SHIPPING_FROM - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_FROM) * 100);
  const entries = Object.entries(cart).flatMap(([id, qty]) => {
    const p = getProduct(Number(id));
    return p ? [{ p, qty }] : [];
  });

  return (
    <>
      {/* Clique fora para fechar - sem desfoque (fundo sutil transparente) */}
      <div
        className="fixed inset-0 z-40 bg-black/10 transition-opacity"
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Card flutuante no canto direito da tela, tamanho proporcional e cantos arredondados */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Minha cesta"
        className="fixed bottom-4 right-4 top-4 z-50 flex w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl border border-slate-100 animate-in slide-in-from-right duration-300"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onToggle}
            aria-label="Fechar cesta"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#0056b3] transition-colors hover:bg-slate-100"
          >
            <X className="h-6 w-6 stroke-[2.5]" />
          </button>
          <h2 className="flex-1 text-center text-[17px] font-bold text-[#0056b3]">
            Minha cesta
          </h2>
          <div className="w-8" aria-hidden="true" />
        </div>

        {/* Conteúdo: Cesta Vazia vs. Cesta com Itens */}
        {entries.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-between px-6 py-8 text-center">
            <div className="my-auto flex flex-col items-center">
              {/* Ilustração exata do carrinho vazio com badge vermelho e confetes */}
              <div className="relative flex items-center justify-center">
                <svg
                  width="180"
                  height="150"
                  viewBox="0 0 180 150"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="select-none"
                  aria-hidden="true"
                >
                  {/* Nuvem azul suave de fundo */}
                  <path
                    d="M142.3 43.1C154.6 60.5 149.2 87.2 135.5 106.8C121.8 126.4 99.8 138.9 77.4 135.4C55 131.9 32.2 112.4 25.1 90.7C18 69 26.6 45.1 42.4 30.6C58.2 16.1 81.2 11 104.3 14.7C127.4 18.4 130 25.7 142.3 43.1Z"
                    fill="#DDF1FE"
                  />

                  {/* Confetes / Partículas */}
                  <circle cx="28" cy="40" r="3" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <circle cx="152" cy="34" r="2.5" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                  <circle cx="36" cy="85" r="2" fill="#FBBF24" />
                  <circle cx="150" cy="88" r="4" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                  <circle cx="150" cy="88" r="1.5" fill="#F59E0B" />
                  <path d="M136 102C138 98 143 97 146 100" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="2 2" />

                  {/* Carrinho azul */}
                  <path
                    d="M48 42H58L68 88H122L132 50H62"
                    stroke="#0056B3"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line x1="72" y1="62" x2="124" y2="62" stroke="#0056B3" strokeWidth="4" strokeLinecap="round" />
                  <line x1="75" y1="74" x2="118" y2="74" stroke="#0056B3" strokeWidth="4" strokeLinecap="round" />

                  {/* Rodas */}
                  <circle cx="75" cy="100" r="6" fill="#003B7A" />
                  <circle cx="115" cy="100" r="6" fill="#003B7A" />

                  {/* Badge vermelho com X */}
                  <circle cx="126" cy="46" r="9.5" fill="#EF4444" />
                  <path
                    d="M122.5 42.5L129.5 49.5M129.5 42.5L122.5 49.5"
                    stroke="#FFFFFF"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h3 className="mt-8 text-xl font-bold text-[#111827]">
                Sua cesta está vazia
              </h3>
              <p className="mt-1 text-sm text-[#6b7280]">
                Veja algumas ofertas e promoções
              </p>
            </div>

            {/* Botão de ação inferior */}
            <div className="w-full pt-4">
              <button
                type="button"
                onClick={onToggle}
                className="w-full rounded-full bg-[#0056b3] py-4 text-base font-bold text-white transition-all hover:bg-[#004494] active:scale-[0.99] shadow-md"
              >
                Escolher produtos
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Régua de frete grátis */}
            <div className="border-b border-slate-100 bg-[#f4f9fd] px-6 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#0056b3]">
                <Truck className="h-4 w-4" />
                {missing === 0 ? "Você ganhou frete grátis*" : `Faltam ${brl(missing)} para frete grátis*`}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#0056b3] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Lista de itens da cesta */}
            <ul className="intua-scroll max-h-[50vh] flex-1 divide-y divide-slate-100 overflow-y-auto px-6 py-2">
              {entries.map(({ p, qty }) => (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <ProductVisual product={p} small className="h-12 w-12 shrink-0 rounded-lg border border-slate-100" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-medium text-slate-800">{p.name}</p>
                    <p className="mt-0.5 text-xs font-bold text-price">{brl(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-slate-200 px-1 py-0.5">
                    <button
                      type="button"
                      aria-label="Diminuir"
                      onClick={() => onSetQty(p.id, qty - 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-xs font-bold text-slate-800">{qty}</span>
                    <button
                      type="button"
                      aria-label="Aumentar"
                      onClick={() => onSetQty(p.id, qty + 1)}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
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

            {/* Rodapé com total e botões */}
            <div className="mt-auto border-t border-slate-100 bg-white px-6 py-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-slate-600">Subtotal ({count} {count === 1 ? "item" : "itens"})</span>
                <span className="text-lg font-bold text-price">{brl(total)}</span>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onCheckout}
                  className="w-full rounded-full bg-[#0056b3] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#004494] active:scale-[0.99] shadow-md"
                >
                  Finalizar compra · {brl(total)}
                </button>
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={onClear}
                    className="text-xs text-slate-400 hover:text-brand"
                  >
                    Esvaziar cesta
                  </button>
                  <button
                    type="button"
                    onClick={onToggle}
                    className="text-xs font-medium text-[#0056b3] hover:underline"
                  >
                    Continuar comprando
                  </button>
                </div>
              </div>
              {checkoutNote && (
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  O checkout está fora do escopo do MVP.
                </p>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
