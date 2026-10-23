"use client";

import { MapPin, Search, ShoppingCart, User } from "lucide-react";
import Image from "next/image";
import { brl } from "@/lib/catalog";
import { cx } from "@/lib/cx";
import type { CategoryFilter } from "./Showcase";

interface Props {
  count: number;
  total: number;
  query: string;
  category: CategoryFilter;
  onQuery: (q: string) => void;
  onCart: () => void;
  onNav: (c: CategoryFilter) => void;
}

// Menu de categorias da Pague Menos. No MVP só "Dermo e Beleza" e "Vida Saudável" têm catálogo.
const NAV: { label: string; cat?: CategoryFilter }[] = [
  { label: "Ofertas", cat: "todos" },
  { label: "Medicamentos e Saúde" },
  { label: "Dermo e Beleza", cat: "dermocosmetico" },
  { label: "Mamães e Bebês" },
  { label: "Higiene pessoal" },
  { label: "Vida Saudável", cat: "suplemento" },
  { label: "Conveniência" },
  { label: "Serviços de Saúde" },
  { label: "Pet shop" },
];

export function Header({ count, total, query, category, onQuery, onCart, onNav }: Props) {
  return (
    <header className="z-30 shadow-md">
      <div className="hidden items-center justify-end gap-6 bg-[#000a38] px-6 py-1.5 text-[11px] font-medium text-white/90 lg:flex">
        <span>Nossas lojas</span>
        <span>Baixe nosso APP</span>
        <span>Precisa de ajuda</span>
      </div>

      <div className="bg-logo px-4 py-2.5 text-white lg:px-6">
        <div className="flex items-center gap-3 lg:gap-6">
          <Image
            src="/brand/logo-intua-crop.png"
            alt="INTUA | Pague Menos, sua assistente de compras inteligente"
            width={171}
            height={40}
            priority
            className="h-9 w-auto shrink-0 lg:h-10"
          />

          <label className="relative hidden max-w-xl flex-1 lg:block">
            <span className="sr-only">Buscar produtos</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value.slice(0, 60))}
              placeholder="O que você procura?"
              className="w-full rounded-lg bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ai"
            />
          </label>

          <div className="ml-auto flex items-center gap-5">
            <span className="hidden items-center gap-1.5 text-xs lg:flex">
              <MapPin className="h-4 w-4 text-ai" /> Insira seu CEP
            </span>
            <span className="hidden items-center gap-1.5 text-xs lg:flex">
              <User className="h-4 w-4 text-ai" /> Entre ou cadastre-se
            </span>
            <button type="button" onClick={onCart} className="flex items-center gap-2" aria-label="Abrir carrinho">
              <span className="relative">
                <ShoppingCart className="h-6 w-6" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold">
                    {count}
                  </span>
                )}
              </span>
              <span className="hidden text-sm font-bold sm:block">{brl(total)}</span>
            </button>
          </div>
        </div>

        <label className="relative mt-2 block lg:hidden">
          <span className="sr-only">Buscar produtos</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value.slice(0, 60))}
            placeholder="O que você procura?"
            className="w-full rounded-lg bg-white py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-ai"
          />
        </label>
      </div>

      <nav className="hidden overflow-x-auto border-b border-slate-200 bg-white px-6 lg:block" aria-label="Categorias">
        <ul className="flex items-center gap-1 whitespace-nowrap">
          {NAV.map((item) => {
            const active = item.cat !== undefined && item.cat === category && item.cat !== "todos";
            return (
              <li key={item.label}>
                {item.cat ? (
                  <button
                    type="button"
                    onClick={() => onNav(item.cat!)}
                    className={cx(
                      "px-3 py-2.5 text-[13px] font-medium transition-colors hover:text-price",
                      item.label === "Ofertas" ? "text-promo" : "text-[#3f3f3f]",
                      active && "border-b-2 border-price text-price",
                    )}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span
                    title="Fora do escopo do MVP"
                    className="cursor-default px-3 py-2.5 text-[13px] font-medium text-[#3f3f3f]/50"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
