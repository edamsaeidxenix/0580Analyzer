"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart, type CartLine } from "./cart";

export function AddToCart({ line, label = "Add to cart" }: { line: Omit<CartLine, "quantity">; label?: string }) {
  const { add, lines } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.listingId === line.listingId)?.quantity ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex items-center rounded-xl border border-gray-300 bg-white">
          <button
            type="button"
            aria-label="Decrease quantity"
            className="px-3 py-2 text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            className="px-3 py-2 text-lg"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="btn-primary flex-1"
          onClick={() => {
            add(line, quantity);
            setAdded(true);
            setQuantity(1);
          }}
        >
          {label}
        </button>
      </div>
      {(added || inCart > 0) && (
        <p className="text-sm text-gray-600">
          {inCart} in your cart ·{" "}
          <Link href="/cart" className="font-semibold text-brand-700">
            View cart →
          </Link>
        </p>
      )}
    </div>
  );
}
