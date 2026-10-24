"use client";

import { useState } from "react";
import Image from "next/image";
import { Droplets, Dumbbell, FlaskConical, Leaf, Pill, Sparkles, Sun, type LucideIcon } from "lucide-react";
import type { CatalogProduct } from "@/lib/types";

function pick(p: CatalogProduct): { Icon: LucideIcon; from: string; to: string } {
  const sub = p.subcategory.toLowerCase();
  if (sub.includes("protetor")) return { Icon: Sun, from: "#FFF3D6", to: "#FFD98A" };
  if (sub.includes("sérum")) return { Icon: FlaskConical, from: "#E6F7FF", to: "#9EDBFF" };
  if (sub.includes("hidratante") || sub.includes("limpeza")) return { Icon: Droplets, from: "#E8F1FF", to: "#B5D0FF" };
  if (sub.includes("pontual")) return { Icon: Sparkles, from: "#FDE8EE", to: "#F6B9CB" };
  if (sub.includes("whey") || sub.includes("vegetal") || sub.includes("creatina"))
    return { Icon: Dumbbell, from: "#EAF0FF", to: "#B8C7F5" };
  if (sub.includes("vitaminas") || sub.includes("ácidos")) return { Icon: Pill, from: "#FFF0E0", to: "#FFCF9E" };
  return { Icon: Leaf, from: "#E9F8EE", to: "#B4E5C4" };
}

/**
 * Exibe a foto do produto cadastrado ou o fallback estilizado com ícone caso a imagem
 * não esteja disponível ou ocorra falha de carregamento.
 */
export function ProductVisual({
  product,
  className = "",
  small = false,
}: {
  product: CatalogProduct;
  className?: string;
  /** Miniatura: ícone menor e sem o nome da marca. */
  small?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const { Icon, from, to } = pick(product);

  const showImage = Boolean(product.image && !imageError);

  if (showImage && product.image) {
    return (
      <div className={`relative overflow-hidden rounded-lg bg-[#fafafa] ${className}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          unoptimized={product.image.endsWith(".svg")}
          sizes={small ? "64px" : "(max-width: 768px) 50vw, 25vw"}
          className={`object-contain transition-transform duration-300 hover:scale-105 ${small ? "p-1" : "p-2"}`}
          onError={() => setImageError(true)}
          priority={product.id <= 4}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-lg ${className}`}
      style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <Icon className={small ? "h-6 w-6 text-navy/70" : "h-12 w-12 text-navy/70"} strokeWidth={1.5} />
      {!small && (
        <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-wide text-navy/60">
          {product.brand}
        </span>
      )}
    </div>
  );
}
