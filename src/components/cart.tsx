"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface CartLine {
  listingId: string;
  shopSlug: string;
  shopName: string;
  title: string;
  priceLaari: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (listingId: string, quantity: number) => void;
  remove: (listingId: string) => void;
  clearShop: (shopSlug: string) => void;
}

const STORAGE_KEY = "mm_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read the saved cart once on mount; localStorage isn't available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setLines(load());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    setLines((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage can be unavailable (private mode); the cart still works for this visit.
      }
      return next;
    });
  }, []);

  // Stable callbacks so consumers can safely list them as effect dependencies.
  const add = useCallback<CartContextValue["add"]>(
    (line, quantity = 1) =>
      update((prev) => {
        const existing = prev.find((l) => l.listingId === line.listingId);
        if (existing) {
          return prev.map((l) =>
            l.listingId === line.listingId ? { ...l, ...line, quantity: Math.min(99, l.quantity + quantity) } : l,
          );
        }
        return [...prev, { ...line, quantity }];
      }),
    [update],
  );
  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    (listingId, quantity) =>
      update((prev) =>
        quantity <= 0
          ? prev.filter((l) => l.listingId !== listingId)
          : prev.map((l) => (l.listingId === listingId ? { ...l, quantity: Math.min(99, quantity) } : l)),
      ),
    [update],
  );
  const remove = useCallback<CartContextValue["remove"]>(
    (listingId) => update((prev) => prev.filter((l) => l.listingId !== listingId)),
    [update],
  );
  const clearShop = useCallback<CartContextValue["clearShop"]>(
    (shopSlug) => update((prev) => prev.filter((l) => l.shopSlug !== shopSlug)),
    [update],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      add,
      setQuantity,
      remove,
      clearShop,
    }),
    [lines, ready, add, setQuantity, remove, clearShop],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
