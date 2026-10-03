import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/forms";
import { OrderSummary } from "@/components/order-view";
import { requireSeller } from "@/lib/auth";
import { actionLabels, allowedTransitions } from "@/lib/order-rules";
import { getOrderWithItems } from "@/lib/orders";
import { isUuid } from "@/lib/validate";
import { setPaymentReceived, updateOrderStatus } from "../../actions";

export const metadata: Metadata = { title: "Order" };

export default async function SellerOrderPage(props: PageProps<"/sell/orders/[id]">) {
  const { id } = await props.params;
  const { shop } = await requireSeller(`/sell/orders/${id}`);
  const data = isUuid(id) ? await getOrderWithItems(id) : null;
  if (!data || data.order.shopId !== shop.id) notFound();
  const { order, items } = data;

  const next = allowedTransitions("seller", order.status, order.fulfilment);
  const forward = next.filter((s) => s !== "rejected" && s !== "cancelled");
  const negative = next.filter((s) => s === "rejected" || s === "cancelled");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/sell/orders" className="text-sm text-brand-700">
        ← Orders
      </Link>
      <OrderSummary order={order} items={items} shop={shop} viewer="seller" />

      {next.length > 0 && (
        <form action={updateOrderStatus} className="card space-y-3 p-4">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="block">
            <span className="label">Message to customer (optional)</span>
            <input
              name="sellerNote"
              maxLength={300}
              placeholder={order.status === "pending" ? "e.g. Ready in 30 minutes" : "e.g. Sorry, sold out"}
              className="input"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {forward.map((s) => (
              <SubmitButton key={s} name="status" value={s} className="btn-primary flex-1">
                {order.fulfilment === "booking" && s === "confirmed" ? "Confirm booking" : actionLabels[s]}
              </SubmitButton>
            ))}
            {negative.map((s) => (
              <SubmitButton key={s} name="status" value={s} className="btn-danger">
                {actionLabels[s]}
              </SubmitButton>
            ))}
          </div>
          <p className="text-xs text-gray-500">The customer gets an SMS each time you update the order.</p>
        </form>
      )}

      {order.paymentMethod === "bank_transfer" && (
        <form action={setPaymentReceived} className="card flex items-center justify-between gap-3 p-4">
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="received" value={order.paymentReceived ? "0" : "1"} />
          <p className="text-sm">
            {order.paymentReceived ? "✅ You marked the transfer as received." : "Check your bank app, then confirm the transfer."}
          </p>
          <SubmitButton className="btn-secondary shrink-0">
            {order.paymentReceived ? "Undo" : "Payment received"}
          </SubmitButton>
        </form>
      )}
    </div>
  );
}
