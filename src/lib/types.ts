export type Category = "dermocosmetico" | "suplemento";

/** Formato bruto do catálogo (src/data/products.json). */
export interface Product {
  id: number;
  name: string;
  brand: string;
  category: Category;
  subcategory: string;
  price: number;
  originalPrice?: number;
  size: string;
  sizeAmount: number;
  sizeUnit: "g" | "ml" | "cápsulas";
  servings?: number;
  servingSize?: string;
  proteinPerServingG?: number;
  skinTypes?: string[];
  concerns?: string[];
  fps?: number;
  actives: string[];
  diet?: string[];
  tags: string[];
  rating: number;
  reviews: number;
  description: string;
  caution?: string;
  image?: string;
}

/** Métrica de valor calculada no código (nunca pela IA). */
export interface Metric {
  label: string;
  value: number;
}

export type CatalogProduct = Product & { metrics: Metric[] };

export type CartAction =
  | { type: "add"; productId: number; quantity: number }
  | { type: "remove"; productId: number }
  | { type: "set"; productId: number; quantity: number }
  | { type: "clear" };

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Resposta da rota /api/chat. É um superset do contrato original do projeto
 * (message, recommendedProductIds, suggestedActions).
 */
export interface ChatResponse {
  mode: "ai" | "demo";
  message: string;
  recommendedProductIds: number[];
  reasons: Record<number, string>;
  compareProductIds: number[];
  cartActions: CartAction[];
  suggestedActions: string[];
  pharmacistHandoff: string | null;
}
