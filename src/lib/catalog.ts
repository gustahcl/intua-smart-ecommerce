import raw from "@/data/products.json";
import type { CatalogProduct, Metric, Product } from "./types";

export const brl = (n: number): string =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Métricas de valor calculadas em código: a IA nunca inventa preço por dose. */
function metricsFor(p: Product): Metric[] {
  const metrics: Metric[] = [];
  if (p.servings) {
    metrics.push({ label: "R$ por dose", value: p.price / p.servings });
    if (p.proteinPerServingG) {
      metrics.push({
        label: "R$ por g de proteína",
        value: p.price / (p.servings * p.proteinPerServingG),
      });
    }
  } else {
    metrics.push({
      label: `R$ por 10 ${p.sizeUnit}`,
      value: (p.price / p.sizeAmount) * 10,
    });
  }
  return metrics;
}

export const CATALOG: CatalogProduct[] = (raw as unknown as Product[]).map((p) => ({
  ...p,
  metrics: metricsFor(p),
}));

const BY_ID = new Map(CATALOG.map((p) => [p.id, p]));

export const getProduct = (id: number): CatalogProduct | undefined => BY_ID.get(id);

export const discountPct = (p: Product): number =>
  p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;

/** Métrica principal de custo-benefício (a última da lista). */
export const valueMetric = (p: CatalogProduct): Metric => p.metrics[p.metrics.length - 1];

export const formatMetric = (m: Metric): string =>
  `${brl(m.value)} ${m.label.replace(/^R\$ /, "")}`;

const haystackCache = new Map<number, string>();
function haystack(p: CatalogProduct): string {
  let h = haystackCache.get(p.id);
  if (!h) {
    h = normalize(
      [
        p.name,
        p.brand,
        p.subcategory,
        p.description,
        ...p.tags,
        ...p.actives,
        ...(p.concerns ?? []),
        ...(p.skinTypes ?? []),
        ...(p.diet ?? []),
      ].join(" "),
    );
    haystackCache.set(p.id, h);
  }
  return h;
}

const STOPWORDS = new Set([
  "para", "com", "sem", "uma", "uns", "que", "por", "pele", "produto", "produtos",
  "quero", "preciso", "algo", "tem", "mais", "menos", "muito", "bom", "boa", "meu",
  "minha", "das", "dos", "num", "como", "todas", "todos", "tudo", "regras", "ajuda",
]);

export type SortBy = "relevancia" | "preco_asc" | "preco_desc" | "avaliacao" | "custo_beneficio";

export interface SearchParams {
  query?: string;
  category?: "dermocosmetico" | "suplemento";
  maxPrice?: number;
  skinType?: "oleosa" | "seca" | "mista" | "normal" | "sensivel";
  concern?: string;
  diet?: "vegano" | "sem lactose" | "baixo teor de lactose";
  sortBy?: SortBy;
  limit?: number;
}

function dietMatches(p: CatalogProduct, wanted: NonNullable<SearchParams["diet"]>): boolean {
  const d = (p.diet ?? []).map(normalize);
  if (wanted === "vegano") return d.includes("vegano");
  if (wanted === "sem lactose") return d.some((x) => x === "sem lactose" || x === "vegano");
  return d.some((x) => x.includes("baixo teor") || x === "sem lactose" || x === "vegano");
}

export function searchProducts(params: SearchParams): CatalogProduct[] {
  const tokens = normalize(params.query ?? "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

  const scored = CATALOG.map((p) => {
    let score = 0;
    const h = haystack(p);
    const name = normalize(p.name);
    for (const t of tokens) {
      if (h.includes(t)) score += 1;
      if (name.includes(t)) score += 1;
    }
    return { p, score };
  }).filter(({ p, score }) => {
    if (params.category && p.category !== params.category) return false;
    if (params.maxPrice !== undefined && p.price > params.maxPrice) return false;
    if (params.skinType) {
      if (!p.skinTypes) return false;
      if (!p.skinTypes.includes(params.skinType) && !p.skinTypes.includes("todas")) return false;
    }
    if (params.concern) {
      const c = normalize(params.concern);
      const inConcerns = (p.concerns ?? []).some((x) => normalize(x).includes(c));
      if (!inConcerns && !haystack(p).includes(c)) return false;
    }
    if (params.diet && !dietMatches(p, params.diet)) return false;
    if (tokens.length > 0 && score === 0) return false;
    return true;
  });

  const sort = params.sortBy ?? "relevancia";
  scored.sort((a, b) => {
    switch (sort) {
      case "preco_asc":
        return a.p.price - b.p.price;
      case "preco_desc":
        return b.p.price - a.p.price;
      case "avaliacao":
        return b.p.rating - a.p.rating;
      case "custo_beneficio":
        return valueMetric(a.p).value - valueMetric(b.p).value;
      default:
        return b.score - a.score || b.p.rating - a.p.rating;
    }
  });

  return scored.slice(0, Math.min(Math.max(params.limit ?? 6, 1), 8)).map((s) => s.p);
}
