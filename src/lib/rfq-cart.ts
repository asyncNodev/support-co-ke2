import type { Id } from "@/convex/_generated/dataModel.d.ts";

export type RFQCartItem = {
  productId: Id<"products">;
  name: string;
  quantity: number;
};

const STORAGE_KEY = "rfq_cart";

export function getRFQCart(): Array<RFQCartItem> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRFQCart(cart: Array<RFQCartItem>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}

export function clearRFQCart(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear cart:", error);
  }
}
