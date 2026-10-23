"use client";

import { AlertTriangle, Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import { brl, getProduct } from "@/lib/catalog";
import { ProductVisual } from "./ProductVisual";

interface Props {
  productId: number;
  reason?: string;
  onClose: () => void;
  onAsk: (text: string) => void;
}

export function ExplainModal({ productId, reason, onClose, onAsk }: Props) {
  const p = getProduct(productId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!p) return null;

  const facts: [string, string][] = [
    ["Preço", brl(p.price)],
    ...p.metrics.map((m): [string, string] => [`Custo ${m.label.replace(/^R\$ /, "")}`, brl(m.value)]),
    ["Ativos", p.actives.join(", ")],
  ];
  if (p.skinTypes) facts.push(["Tipos de pele", p.skinTypes.join(", ")]);
  if (p.fps) facts.push(["FPS", String(p.fps)]);
  if (p.proteinPerServingG) facts.push(["Proteína por porção", `${p.proteinPerServingG} g (porção de ${p.servingSize})`]);
  else if (p.servingSize) facts.push(["Porção do rótulo", p.servingSize]);
  if (p.diet?.length) facts.push(["Dieta", p.diet.join(", ")]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Por que a INTUA recomendou este produto"
        onClick={(e) => e.stopPropagation()}
        className="intua-in max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <header className="flex items-center gap-2 bg-navy px-4 py-3 text-white">
          <Sparkles className="h-4 w-4 text-ai" />
          <h2 className="flex-1 text-sm font-bold">
            {reason ? "Por que a INTUA recomendou isso?" : "O que a INTUA sabe sobre este produto"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-4">
          <div className="flex items-center gap-3">
            <ProductVisual product={p} small className="h-16 w-16 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800">{p.name}</p>
              <p className="text-xs font-bold uppercase text-slate-500">
                {p.brand} · {p.size}
              </p>
            </div>
          </div>

          {reason ? (
            <p className="mt-4 rounded-lg border border-ai/40 bg-ai/10 p-3 text-sm leading-relaxed text-navy-800">
              {reason}
            </p>
          ) : (
            <p className="mt-4 rounded-lg bg-surface p-3 text-sm text-slate-600">
              Este produto não foi uma recomendação direta. Posso avaliar se ele combina com o que você procura.
            </p>
          )}

          <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
            Dados do catálogo usados na escolha
          </h3>
          <dl className="mt-2 divide-y divide-slate-100 text-sm">
            {facts.map(([k, v], i) => (
              <div key={`${k}-${i}`} className="flex justify-between gap-4 py-1.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>

          {p.caution && (
            <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {p.caution}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              onAsk(reason ? `Por que você recomendou ${p.name}?` : `O produto ${p.name} serve para mim?`)
            }
            className="mt-4 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            {reason ? "Perguntar mais para a INTUA" : "Perguntar à INTUA"}
          </button>
          <p className="mt-3 text-center text-[11px] text-slate-400">
            A INTUA não substitui a orientação de um farmacêutico ou médico.
          </p>
        </div>
      </div>
    </div>
  );
}
