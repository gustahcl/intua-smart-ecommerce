"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  MapPin,
  Minus,
  Plus,
  QrCode,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { brl, getProduct } from "@/lib/catalog";
import { cartCount, cartTotal, type Cart } from "@/lib/cart";
import { ProductVisual } from "./ProductVisual";

const FREE_SHIPPING_FROM = 150;

type CheckoutStep = "cart" | "delivery" | "payment" | "success";

interface Props {
  cart: Cart;
  open: boolean;
  checkoutNote: boolean;
  onToggle: () => void;
  onSetQty: (id: number, qty: number) => void;
  onClear: () => void;
  onCheckout: () => void;
}

export function CartBar({ cart, open, onToggle, onSetQty, onClear }: Props) {
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [deliveryType, setDeliveryType] = useState<"express" | "pickup">("express");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [pixCopied, setPixCopied] = useState(false);

  // Reseta para a cesta sempre que abrir
  useEffect(() => {
    if (open) {
      setStep("cart");
      setPixCopied(false);
    }
  }, [open]);

  // Fechar com a tecla Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onToggle();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onToggle]);

  if (!open) return null;

  const count = cartCount(cart);
  const subtotal = cartTotal(cart);
  const freeShipping = subtotal >= FREE_SHIPPING_FROM;
  const shippingCost = deliveryType === "pickup" ? 0 : freeShipping ? 0 : 9.9;
  const total = subtotal + shippingCost;
  const missing = Math.max(0, FREE_SHIPPING_FROM - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_FROM) * 100);

  const entries = Object.entries(cart).flatMap(([id, qty]) => {
    const p = getProduct(Number(id));
    return p ? [{ p, qty }] : [];
  });

  const handleCopyPix = () => {
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2500);
  };

  const handleFinishSuccess = () => {
    onClear();
    setStep("cart");
    onToggle();
  };

  return (
    <>
      {/* Fundo sutil transparente para fechar ao clicar fora */}
      <div
        className="fixed inset-0 z-40 bg-black/15 transition-opacity"
        onClick={onToggle}
        aria-hidden="true"
      />

      {/* Card flutuante no canto direito da tela */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Minha cesta e finalização"
        className="fixed bottom-4 right-4 top-4 z-50 flex w-[400px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl border border-slate-100 animate-in slide-in-from-right duration-300"
      >
        {/* Cabeçalho dinâmico de acordo com o passo */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          {step !== "cart" && step !== "success" ? (
            <button
              type="button"
              onClick={() => setStep(step === "payment" ? "delivery" : "cart")}
              className="flex items-center gap-1 text-xs font-semibold text-[#0056b3] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#0056b3] transition-colors hover:bg-slate-100"
            >
              <X className="h-6 w-6 stroke-[2.5]" />
            </button>
          )}

          <h2 className="flex-1 text-center text-[17px] font-bold text-[#0056b3]">
            {step === "cart" && "Minha cesta"}
            {step === "delivery" && "Opções de Entrega"}
            {step === "payment" && "Pagamento"}
            {step === "success" && "Pedido Confirmado"}
          </h2>
          <div className="w-12 text-right" aria-hidden="true" />
        </div>

        {/* 1. PASSO: CESTA (Vazia ou com Itens) */}
        {step === "cart" && (
          entries.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-between px-6 py-8 text-center">
              <div className="my-auto flex flex-col items-center">
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
                    <path
                      d="M142.3 43.1C154.6 60.5 149.2 87.2 135.5 106.8C121.8 126.4 99.8 138.9 77.4 135.4C55 131.9 32.2 112.4 25.1 90.7C18 69 26.6 45.1 42.4 30.6C58.2 16.1 81.2 11 104.3 14.7C127.4 18.4 130 25.7 142.3 43.1Z"
                      fill="#DDF1FE"
                    />
                    <circle cx="28" cy="40" r="3" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                    <circle cx="152" cy="34" r="2.5" fill="none" stroke="#60A5FA" strokeWidth="1.5" />
                    <circle cx="36" cy="85" r="2" fill="#FBBF24" />
                    <circle cx="150" cy="88" r="4" fill="none" stroke="#F59E0B" strokeWidth="1.5" />
                    <circle cx="150" cy="88" r="1.5" fill="#F59E0B" />
                    <path d="M136 102C138 98 143 97 146 100" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="2 2" />
                    <path
                      d="M48 42H58L68 88H122L132 50H62"
                      stroke="#0056B3"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <line x1="72" y1="62" x2="124" y2="62" stroke="#0056B3" strokeWidth="4" strokeLinecap="round" />
                    <line x1="75" y1="74" x2="118" y2="74" stroke="#0056B3" strokeWidth="4" strokeLinecap="round" />
                    <circle cx="75" cy="100" r="6" fill="#003B7A" />
                    <circle cx="115" cy="100" r="6" fill="#003B7A" />
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

              <div className="mt-auto border-t border-slate-100 bg-white px-6 py-4">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-slate-600">Subtotal ({count} {count === 1 ? "item" : "itens"})</span>
                  <span className="text-lg font-bold text-price">{brl(subtotal)}</span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("delivery")}
                    className="w-full rounded-full bg-[#0056b3] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#004494] active:scale-[0.99] shadow-md"
                  >
                    Finalizar compra · {brl(subtotal)}
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
              </div>
            </div>
          )
        )}

        {/* 2. PASSO: OPÇÕES DE ENTREGA OMNICHANNEL */}
        {step === "delivery" && (
          <div className="flex flex-1 flex-col justify-between overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
                <div className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 text-[#0056b3] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Entregar em:</p>
                    <p className="text-xs text-slate-600">Av. Boa Viagem, 2040 - Recife / PE</p>
                    <span className="text-[10px] text-emerald-600 font-semibold">CEP 51020-000 (Região atendida)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Escolha como receber:</p>

                {/* Opção 1: Entrega Expressa em 2h */}
                <button
                  type="button"
                  onClick={() => setDeliveryType("express")}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                    deliveryType === "express"
                      ? "border-[#0056b3] bg-[#0056b3]/5 ring-2 ring-[#0056b3]/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Entrega Expressa Pague Menos</span>
                      <span className="text-xs font-bold text-[#0056b3]">
                        {freeShipping ? "Grátis" : "R$ 9,90"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Receba em até <strong>2 horas</strong> na sua porta.
                    </p>
                    <p className="text-[10px] text-slate-400">Saindo da loja: Rua Barão de Souza Leão, 450</p>
                  </div>
                </button>

                {/* Opção 2: Retirada na Loja */}
                <button
                  type="button"
                  onClick={() => setDeliveryType("pickup")}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                    deliveryType === "pickup"
                      ? "border-[#0056b3] bg-[#0056b3]/5 ring-2 ring-[#0056b3]/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Clique & Retire</span>
                      <span className="text-xs font-bold text-emerald-600">Grátis</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600">
                      Pronto para retirada em <strong>30 minutos</strong>.
                    </p>
                    <p className="text-[10px] text-slate-400">Pague Menos Boa Viagem Shopping</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Subtotal</span>
                <span>{brl(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>Frete</span>
                <span>{shippingCost === 0 ? "Grátis" : brl(shippingCost)}</span>
              </div>
              <div className="flex items-baseline justify-between text-sm font-bold text-slate-900 mb-4">
                <span>Total</span>
                <span className="text-lg text-price">{brl(total)}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep("payment")}
                className="w-full rounded-full bg-[#0056b3] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#004494] shadow-md"
              >
                Continuar para pagamento
              </button>
            </div>
          </div>
        )}

        {/* 3. PASSO: PAGAMENTO SIMULADO (PIX / CARTÃO) */}
        {step === "payment" && (
          <div className="flex flex-1 flex-col justify-between overflow-y-auto px-6 py-5">
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                    paymentMethod === "pix"
                      ? "border-[#0056b3] bg-[#0056b3]/5 text-[#0056b3] ring-1 ring-[#0056b3]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <QrCode className="h-4 w-4" /> PIX (Aprovação imediata)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-xs font-bold transition-all ${
                    paymentMethod === "card"
                      ? "border-[#0056b3] bg-[#0056b3]/5 text-[#0056b3] ring-1 ring-[#0056b3]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <CreditCard className="h-4 w-4" /> Cartão
                </button>
              </div>

              {paymentMethod === "pix" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-center">
                  <p className="text-xs text-slate-600 mb-3">
                    Escaneie o QR Code abaixo no app do seu banco:
                  </p>

                  {/* QR Code Simulado com padrão SVG */}
                  <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-slate-200">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                      {/* Cantos do QR */}
                      <rect x="5" y="5" width="25" height="25" fill="#003B7A" rx="4" />
                      <rect x="10" y="10" width="15" height="15" fill="#fff" rx="2" />
                      <rect x="13" y="13" width="9" height="9" fill="#003B7A" rx="1" />

                      <rect x="70" y="5" width="25" height="25" fill="#003B7A" rx="4" />
                      <rect x="75" y="10" width="15" height="15" fill="#fff" rx="2" />
                      <rect x="78" y="13" width="9" height="9" fill="#003B7A" rx="1" />

                      <rect x="5" y="70" width="25" height="25" fill="#003B7A" rx="4" />
                      <rect x="10" y="75" width="15" height="15" fill="#fff" rx="2" />
                      <rect x="13" y="78" width="9" height="9" fill="#003B7A" rx="1" />

                      {/* Módulos de dados decorativos */}
                      <rect x="35" y="10" width="8" height="8" fill="#0056B3" />
                      <rect x="48" y="12" width="6" height="6" fill="#0056B3" />
                      <rect x="40" y="30" width="15" height="15" fill="#003B7A" rx="2" />
                      <rect x="60" y="35" width="8" height="8" fill="#0056B3" />
                      <rect x="15" y="45" width="10" height="10" fill="#0056B3" />
                      <rect x="35" y="60" width="12" height="12" fill="#003B7A" />
                      <rect x="65" y="65" width="16" height="16" fill="#0056B3" rx="2" />
                      <rect x="50" y="80" width="10" height="10" fill="#003B7A" />
                    </svg>
                  </div>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {pixCopied ? "Código copiado!" : "Copiar código PIX"}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Chave temporária expira em 15 minutos
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-left">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Número do Cartão</label>
                    <input
                      type="text"
                      disabled
                      value="•••• •••• •••• 4242 (Cartão de Teste)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Validade</label>
                      <input
                        type="text"
                        disabled
                        value="12/28"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">CVV</label>
                      <input
                        type="text"
                        disabled
                        value="•••"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 py-2 rounded-xl border border-emerald-200">
                <ShieldCheck className="h-4 w-4" /> Ambiente Seguro com Criptografia de Ponta
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6">
              <div className="flex items-baseline justify-between text-sm font-bold text-slate-900 mb-3">
                <span>Total a pagar</span>
                <span className="text-xl text-price">{brl(total)}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep("success")}
                className="w-full rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 shadow-md"
              >
                Confirmar pagamento simulado
              </button>
            </div>
          </div>
        )}

        {/* 4. PASSO: SUCESSO (Jornada Ponta a Ponta Concluída) */}
        {step === "success" && (
          <div className="flex flex-1 flex-col items-center justify-between px-6 py-6 text-center overflow-y-auto">
            <div className="my-auto flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Pedido Realizado com Sucesso!
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Código do Pedido: <strong className="text-slate-800">#PM-84291</strong>
              </p>

              {/* Status do Pedido / Timeline */}
              <div className="mt-5 w-full rounded-2xl bg-slate-50 p-4 border border-slate-200/80 text-left">
                <p className="text-xs font-bold text-slate-800 mb-3">Acompanhamento do Pedido:</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Pagamento Aprovado</p>
                      <p className="text-[10px] text-slate-500">Notificação enviada ao seu WhatsApp</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                      ●
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Separando na Farmácia</p>
                      <p className="text-[10px] text-slate-500">
                        {deliveryType === "express"
                          ? "Previsão de entrega: em até 2 horas"
                          : "Pronto para retirada em até 30 min"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 opacity-40">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-300 text-white text-[10px] font-bold">
                      3
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {deliveryType === "express" ? "A caminho do endereço" : "Aguardando retirada"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5 text-[#0056b3]" />
                Tempo médio da jornada: <strong className="text-[#0056b3]">1 min e 20s (do prompt à compra)</strong>
              </div>
            </div>

            <div className="w-full pt-4">
              <button
                type="button"
                onClick={handleFinishSuccess}
                className="w-full rounded-full bg-[#0056b3] py-3.5 text-sm font-bold text-white transition-all hover:bg-[#004494] shadow-md"
              >
                Concluir e voltar à vitrine
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
