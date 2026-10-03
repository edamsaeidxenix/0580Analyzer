"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useCart } from "@/components/cart";
import { FormMessage, SubmitButton } from "@/components/forms";
import type { ShopType } from "@/db/schema";
import { formatMvr } from "@/lib/money";
import { placeOrder, type PlaceOrderState } from "./actions";

interface CheckoutShop {
  slug: string;
  name: string;
  type: ShopType;
  offersPickup: boolean;
  offersDelivery: boolean;
  deliveryFeeLaari: number;
  acceptsBankTransfer: boolean;
  bankDetails: string | null;
  address: string | null;
}

export function CheckoutForm({
  shop,
  defaultName,
  isOwnShop,
}: {
  shop: CheckoutShop;
  defaultName: string;
  isOwnShop: boolean;
}) {
  const router = useRouter();
  const { lines, ready, clearShop } = useCart();
  const [state, action] = useActionState<PlaceOrderState, FormData>(placeOrder, null);
  const isBooking = shop.type === "guest_house";
  const [fulfilment, setFulfilment] = useState(
    isBooking ? "booking" : shop.offersPickup ? "pickup" : "delivery",
  );
  const [payment, setPayment] = useState("cash");

  const shopLines = lines.filter((l) => l.shopSlug === shop.slug);

  useEffect(() => {
    if (state?.orderId) {
      clearShop(shop.slug);
      router.replace(`/orders/${state.orderId}?placed=1`);
    }
  }, [state?.orderId, clearShop, router, shop.slug]);

  if (!ready) return <div className="card h-40 animate-pulse" />;
  if (state?.orderId) return <div className="card p-6 text-center">Order placed! Opening your order…</div>;
  if (isOwnShop) return <div className="card p-6 text-center text-sm text-gray-600">You can&apos;t order from your own shop.</div>;
  if (shopLines.length === 0) {
    return (
      <div className="card space-y-3 p-6 text-center">
        <p className="text-sm text-gray-600">You have nothing from {shop.name} in your cart.</p>
        <Link href={`/s/${shop.slug}`} className="btn-primary">
          Browse {shop.name}
        </Link>
      </div>
    );
  }

  const subtotal = shopLines.reduce((s, l) => s + l.priceLaari * l.quantity, 0);
  const fee = fulfilment === "delivery" ? shop.deliveryFeeLaari : 0;

  return (
    <form action={action} className="space-y-4">
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(shopLines.map((l) => ({ listingId: l.listingId, quantity: l.quantity })))}
      />
      <input type="hidden" name="shop" value={shop.slug} />

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">🏪 {shop.name}</h2>
        <ul className="space-y-1 text-sm">
          {shopLines.map((l) => (
            <li key={l.listingId} className="flex justify-between gap-3">
              <span>
                {l.quantity} × {l.title}
              </span>
              <span>{formatMvr(l.priceLaari * l.quantity)}</span>
            </li>
          ))}
        </ul>
      </section>

      {!isBooking && (
        <section className="card space-y-2 p-4">
          <h2 className="font-semibold">How do you want to get it?</h2>
          <input type="hidden" name="fulfilment" value={fulfilment} />
          <div className="grid grid-cols-2 gap-2">
            {shop.offersPickup && (
              <button
                type="button"
                onClick={() => setFulfilment("pickup")}
                className={fulfilment === "pickup" ? "chip-active justify-center py-3" : "chip justify-center py-3"}
              >
                🚶 Pickup
              </button>
            )}
            {shop.offersDelivery && (
              <button
                type="button"
                onClick={() => setFulfilment("delivery")}
                className={fulfilment === "delivery" ? "chip-active justify-center py-3" : "chip justify-center py-3"}
              >
                🛵 Delivery {shop.deliveryFeeLaari ? `+${formatMvr(shop.deliveryFeeLaari)}` : "(free)"}
              </button>
            )}
          </div>
          {fulfilment === "pickup" && shop.address && <p className="text-sm text-gray-600">Pick up at: {shop.address}</p>}
          {fulfilment === "delivery" && (
            <label className="block">
              <span className="label">Delivery address</span>
              <input name="deliveryAddress" required maxLength={200} placeholder="House name, street" className="input" />
            </label>
          )}
        </section>
      )}
      {isBooking && <input type="hidden" name="fulfilment" value="booking" />}

      <section className="card space-y-3 p-4">
        <label className="block">
          <span className="label">Your name</span>
          <input name="customerName" defaultValue={defaultName} required maxLength={60} className="input" />
        </label>
        <label className="block">
          <span className="label">{isBooking ? "Dates and number of guests" : "Note for the shop (optional)"}</span>
          <textarea
            name="note"
            rows={2}
            maxLength={500}
            required={isBooking}
            placeholder={isBooking ? "e.g. 12–15 March, 2 adults" : "e.g. please call when ready"}
            className="input"
          />
        </label>
      </section>

      <section className="card space-y-2 p-4">
        <h2 className="font-semibold">Payment</h2>
        <input type="hidden" name="paymentMethod" value={payment} />
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPayment("cash")}
            className={payment === "cash" ? "chip-active justify-center py-3" : "chip justify-center py-3"}
          >
            💵 {isBooking ? "Pay on arrival" : fulfilment === "delivery" ? "Cash on delivery" : "Pay at pickup"}
          </button>
          {shop.acceptsBankTransfer && (
            <button
              type="button"
              onClick={() => setPayment("bank_transfer")}
              className={payment === "bank_transfer" ? "chip-active justify-center py-3" : "chip justify-center py-3"}
            >
              🏦 Bank transfer
            </button>
          )}
        </div>
        {payment === "bank_transfer" && (
          <div className="space-y-2 text-sm">
            {shop.bankDetails && (
              <p className="rounded-xl bg-gray-50 p-3 whitespace-pre-line">
                Transfer to:
                <br />
                <strong>{shop.bankDetails}</strong>
              </p>
            )}
            <label className="block">
              <span className="label">Transfer receipt (screenshot)</span>
              <input name="receipt" type="file" accept="image/*" className="input text-sm" />
              <span className="mt-1 block text-xs text-gray-500">You can also upload it later from your order page.</span>
            </label>
          </div>
        )}
      </section>

      <section className="card space-y-1 p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMvr(subtotal)}</span>
        </div>
        {fulfilment === "delivery" && (
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{fee ? formatMvr(fee) : "Free"}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 text-base font-bold">
          <span>Total</span>
          <span>{formatMvr(subtotal + fee)}</span>
        </div>
      </section>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full py-3 text-base" pendingText="Placing order…">
        {isBooking ? "Send booking request" : "Place order"}
      </SubmitButton>
      <p className="text-center text-xs text-gray-500">
        {shop.name} will confirm your {isBooking ? "booking" : "order"}. You&apos;ll see updates on the Orders page.
      </p>
    </form>
  );
}
