"use client";

import { X } from "lucide-react";
import { brl, getProduct, valueMetric } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/types";
import { ProductVisual } from "./ProductVisual";

interface Props {
  ids: number[];
  onClose: () => void;
  onAdd: (id: number) => void;
}

export function CompareTable({ ids, onClose, onAdd }: Props) {
  const items = ids.map(getProduct).filter((p): p is CatalogProduct => !!p);
  if (items.length < 2) return null;

  const sameMetric = items.every((p) => valueMetric(p).label === valueMetric(items[0]).label);
  const bestValue = sameMetric ? Math.min(...items.map((p) => valueMetric(p).value)) : null;
  const cheapest = Math.min(...items.map((p) => p.price));

  const rows: { label: string; cell: (p: CatalogProduct) => React.ReactNode }[] = [
    {
      label: "Preço",
      cell: (p) => (
        <span className={p.price === cheapest ? "font-bold text-price" : "font-medium"}>
          {brl(p.price)}
          {p.price === cheapest && <span className="ml-1 text-[10px] font-medium text-emerald-600">menor preço</span>}
        </span>
      ),
    },
    { label: "Tamanho", cell: (p) => p.size },
    {
      label: "Custo-benefício",
      cell: (p) => {
        const m = valueMetric(p);
        const best = bestValue !== null && m.value === bestValue;
        return (
          <span className={best ? "font-bold text-emerald-700" : ""}>
            {brl(m.value)} <span className="text-[11px] text-slate-500">{m.label.replace(/^R\$ /, "")}</span>
            {best && <span className="ml-1 text-[10px] font-medium text-emerald-600">melhor</span>}
          </span>
        );
      },
    },
    { label: "Ativos", cell: (p) => p.actives.join(", ") },
    {
      label: "Perfil",
      cell: (p) => (p.skinTypes ? `Pele ${p.skinTypes.join(", ")}` : (p.diet ?? []).join(", ") || "—"),
    },
    {
      label: "FPS / Proteína",
      cell: (p) =>
        p.fps
          ? `FPS ${p.fps}`
          : p.proteinPerServingG
            ? `${p.proteinPerServingG} g por porção de ${p.servingSize}`
            : p.servingSize
              ? `Porção de ${p.servingSize}`
              : "—",
    },
    { label: "Avaliação", cell: (p) => `${p.rating.toFixed(1)} (${p.reviews.toLocaleString("pt-BR")})` },
  ];

  return (
    <section className="intua-in mx-4 mt-4 overflow-hidden rounded-xl border border-ai/60 bg-white shadow-sm">
      <header className="flex items-center justify-between bg-navy px-4 py-2 text-white">
        <h2 className="text-sm font-bold">Comparando lado a lado</h2>
        <button type="button" onClick={onClose} aria-label="Fechar comparação" className="rounded p-1 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr>
              <th className="w-28 p-3" />
              {items.map((p) => (
                <th key={p.id} className="p-3 align-top">
                  <ProductVisual product={p} small className="mb-2 h-14 w-full" />
                  <span className="line-clamp-2 text-[13px] font-medium leading-tight text-slate-700">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => onAdd(p.id)}
                    className="mt-2 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white hover:bg-brand-700"
                  >
                    Adicionar
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-slate-100 align-top">
                <th className="p-3 text-xs font-medium text-slate-500">{r.label}</th>
                {items.map((p) => (
                  <td key={p.id} className="p-3 text-[13px] text-slate-700">
                    {r.cell(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
