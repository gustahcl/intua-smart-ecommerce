import { NextRequest, NextResponse } from "next/server";
import { CATALOG, formatMetric, valueMetric } from "@/lib/catalog";
import type { CatalogProduct } from "@/lib/types";

/**
 * Feed de produtos legível por agentes de IA externos (ChatGPT, Gemini e afins).
 *
 * O mesmo catálogo que a INTUA usa vira uma lista estruturada, com campos
 * inspirados nos feeds de produto dos protocolos de comércio agêntico
 * (id, title, description, link, image_link, price, availability, brand),
 * mais os atributos que um agente precisa para recomendar com segurança:
 * ativos, tipo de pele, FPS, proteína por porção, custo-benefício e avisos.
 *
 * É uma prova de conceito: não segue nenhuma especificação certificada e
 * os produtos são fictícios.
 */

const CATEGORY_LABEL: Record<CatalogProduct["category"], string> = {
  dermocosmetico: "Dermocosméticos",
  suplemento: "Suplementos alimentares",
};

function toFeedItem(p: CatalogProduct, origin: string) {
  return {
    id: String(p.id),
    title: p.name,
    description: p.description,
    // O MVP não tem página por produto; em produção, aponta para a página real do item.
    link: `${origin}/?produto=${p.id}`,
    image_link: p.image ? new URL(p.image, origin).toString() : null,
    price: `${p.price.toFixed(2)} BRL`,
    sale_price: p.originalPrice && p.originalPrice > p.price ? `${p.price.toFixed(2)} BRL` : null,
    list_price: p.originalPrice ? `${p.originalPrice.toFixed(2)} BRL` : null,
    availability: "in_stock",
    brand: p.brand,
    product_category: `${CATEGORY_LABEL[p.category]} > ${p.subcategory}`,
    size: p.size,
    rating: { value: p.rating, count: p.reviews },
    attributes: {
      actives: p.actives,
      skin_types: p.skinTypes ?? [],
      concerns: p.concerns ?? [],
      spf: p.fps ?? null,
      serving_size: p.servingSize ?? null,
      protein_per_serving_g: p.proteinPerServingG ?? null,
      diet: p.diet ?? [],
      value_metric: formatMetric(valueMetric(p)),
    },
    // Avisos de segurança vão junto para o agente repassar ao cliente.
    caution: p.caution ?? null,
  };
}

export function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const category = req.nextUrl.searchParams.get("category");
  const items = CATALOG.filter((p) => !category || p.category === category).map((p) => toFeedItem(p, origin));

  return NextResponse.json(
    {
      merchant: { name: "Pague Menos (demonstração INTUA)", country: "BR", currency: "BRL" },
      generated_at: new Date().toISOString(),
      policy:
        "Produtos de demonstração. Agentes não devem fazer diagnóstico nem indicar dose; casos de saúde vão para o farmacêutico.",
      count: items.length,
      items,
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
