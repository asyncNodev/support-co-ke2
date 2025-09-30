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

export function addToRFQCart(productId: Id<"products">, name: string, quantity: number = 1): void {
  const cart = getRFQCart();
  const existingItem = cart.find((item) => item.productId === productId);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ productId, name, quantity });
  }
  
  saveRFQCart(cart);
}

export function removeFromRFQCart(productId: Id<"products">): void {
  const cart = getRFQCart();
  const updatedCart = cart.filter((item) => item.productId !== productId);
  saveRFQCart(updatedCart);
}

export function updateRFQCartQuantity(productId: Id<"products">, quantity: number): void {
  const cart = getRFQCart();
  const item = cart.find((item) => item.productId === productId);
  
  if (item) {
    item.quantity = quantity;
    saveRFQCart(cart);
  }
}