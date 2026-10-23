import { getProduct } from "./catalog";
import type { CartAction } from "./types";

/** Carrinho no cliente: productId -> quantidade. */
export type Cart = Record<number, number>;

export function applyCartActions(cart: Cart, actions: CartAction[]): Cart {
  let next = { ...cart };
  for (const a of actions) {
    if (a.type === "clear") {
      next = {};
    } else if (!getProduct(a.productId)) {
      continue;
    } else if (a.type === "remove") {
      delete next[a.productId];
    } else if (a.type === "add") {
      next[a.productId] = Math.min(20, (next[a.productId] ?? 0) + Math.max(1, a.quantity));
    } else if (a.type === "set") {
      if (a.quantity <= 0) delete next[a.productId];
      else next[a.productId] = Math.min(20, a.quantity);
    }
  }
  return next;
}

export const cartCount = (cart: Cart): number =>
  Object.values(cart).reduce((s, q) => s + q, 0);

export const cartTotal = (cart: Cart): number =>
  Object.entries(cart).reduce((s, [id, q]) => s + (getProduct(Number(id))?.price ?? 0) * q, 0);
