import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton, SubmitButton } from "@/components/forms";
import { OrderSummary } from "@/components/order-view";
import { requireUser } from "@/lib/auth";
import { canTransition } from "@/lib/order-rules";
import { getOrderWithItems } from "@/lib/orders";
import { isUuid } from "@/lib/validate";
import { cancelOrder, uploadReceipt } from "./actions";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
  const user = await requireUser(`/orders/${id}`);
  const data = isUuid(id) ? await getOrderWithItems(id) : null;
  if (!data || data.order.customerId !== user.id) notFound();
  const { order, shop, items } = data;
  const placed = (await props.searchParams).placed === "1";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      {placed && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          ✅ Sent to {shop.name}. They&apos;ll confirm it soon — you can check back here any time.
        </p>
      )}
      <OrderSummary order={order} items={items} shop={shop} viewer="customer" />

      {order.paymentMethod === "bank_transfer" && !order.receiptUrl && !["rejected", "cancelled"].includes(order.status) && (
        <form action={uploadReceipt} className="card space-y-2 p-4">
          <input type="hidden" name="orderId" value={order.id} />
          <label className="block">
            <span className="label">Upload your transfer receipt</span>
            <input name="receipt" type="file" accept="image/*" required className="input text-sm" />
          </label>
          <SubmitButton pendingText="Uploading…">Upload receipt</SubmitButton>
        </form>
      )}

      {canTransition("customer", order.status, "cancelled", order.fulfilment) && (
        <form action={cancelOrder}>
          <input type="hidden" name="orderId" value={order.id} />
          <ConfirmButton message="Cancel this order?" className="btn-danger w-full">
            Cancel order
          </ConfirmButton>
        </form>
      )}

      <Link href="/orders" className="block text-center text-sm text-brand-700">
        ← All orders
      </Link>
    </div>
  );
}
