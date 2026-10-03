"use client";

import Link from "next/link";
import { useCart, type CartLine } from "@/components/cart";
import { ListingImage } from "@/components/listing-card";
import { formatMvr } from "@/lib/money";

export default function CartPage() {
  const { lines, ready, setQuantity, remove } = useCart();

  if (!ready) return <div className="card h-40 animate-pulse" />;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-10 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="text-xl font-bold">Your cart is empty</h1>
        <Link href="/search" className="btn-primary">
          Start shopping
        </Link>
      </div>
    );
  }

  const byShop = new Map<string, CartLine[]>();
  for (const line of lines) byShop.set(line.shopSlug, [...(byShop.get(line.shopSlug) ?? []), line]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Cart</h1>
      {byShop.size > 1 && (
        <p className="text-sm text-gray-600">Your cart has items from {byShop.size} shops. Each shop gets its own order.</p>
      )}
      {[...byShop.entries()].map(([slug, shopLines]) => {
        const subtotal = shopLines.reduce((s, l) => s + l.priceLaari * l.quantity, 0);
        return (
          <section key={slug} className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <Link href={`/s/${slug}`} className="font-semibold">
                🏪 {shopLines[0].shopName}
              </Link>
            </header>
            <ul className="divide-y divide-gray-100">
              {shopLines.map((l) => (
                <li key={l.listingId} className="flex gap-3 p-3">
                  <ListingImage src={l.imageUrl} alt="" icon="🛍️" className="size-16 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/l/${l.listingId}`} className="line-clamp-2 text-sm font-medium">
                      {l.title}
                    </Link>
                    <p className="text-sm text-gray-600">{formatMvr(l.priceLaari)}</p>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-gray-300">
                        <button
                          type="button"
                          aria-label="Decrease"
                          className="px-2.5 py-1"
                          onClick={() => setQuantity(l.listingId, l.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{l.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase"
                          className="px-2.5 py-1"
                          onClick={() => setQuantity(l.listingId, l.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button type="button" onClick={() => remove(l.listingId)} className="text-xs text-red-600">
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">{formatMvr(l.priceLaari * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <footer className="flex items-center justify-between gap-3 bg-gray-50 px-4 py-3">
              <p className="text-sm">
                Subtotal <strong>{formatMvr(subtotal)}</strong>
              </p>
              <Link href={`/checkout/${slug}`} className="btn-primary">
                Checkout
              </Link>
            </footer>
          </section>
        );
      })}
      <p className="text-xs text-gray-500">Prices are checked again with the shop when you place the order.</p>
    </div>
  );
}
