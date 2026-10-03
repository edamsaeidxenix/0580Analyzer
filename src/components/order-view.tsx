import type { Order, OrderItem, OrderStatus, Shop } from "@/db/schema";
import { formatMvr } from "@/lib/money";
import { statusLabels } from "@/lib/order-rules";
import { formatPhone } from "@/lib/phone";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  ready: "bg-brand-100 text-brand-800",
  out_for_delivery: "bg-brand-100 text-brand-800",
  completed: "bg-gray-100 text-gray-700",
  rejected: "bg-red-100 text-red-700",
  cancelled: "bg-gray-100 text-gray-500",
};

export function StatusBadge({ status, fulfilment }: { status: OrderStatus; fulfilment?: Order["fulfilment"] }) {
  const label =
    fulfilment === "booking" && status === "confirmed"
      ? "Booking confirmed"
      : fulfilment === "booking" && status === "pending"
        ? "Waiting for guest house"
        : statusLabels[status];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>{label}</span>;
}

export function formatDateTime(date: Date) {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Indian/Maldives",
  });
}

const fulfilmentLabels: Record<Order["fulfilment"], string> = {
  pickup: "🚶 Pickup",
  delivery: "🛵 Delivery",
  booking: "🛏️ Booking request",
};

/** Order details shared by the customer and seller views. */
export function OrderSummary({
  order,
  items,
  shop,
  viewer,
}: {
  order: Order;
  items: OrderItem[];
  shop: Pick<Shop, "name" | "phone" | "address" | "bankDetails">;
  viewer: "customer" | "seller";
}) {
  const contactPhone = viewer === "customer" ? shop.phone : order.customerPhone;

  return (
    <div className="space-y-4">
      <section className="card space-y-2 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Order #{order.number}</h1>
          <StatusBadge status={order.status} fulfilment={order.fulfilment} />
        </div>
        <p className="text-sm text-gray-500">Placed {formatDateTime(order.createdAt)}</p>
        <p className="text-sm">
          {viewer === "customer" ? (
            <>
              From <strong>{shop.name}</strong>
            </>
          ) : (
            <>
              Customer: <strong>{order.customerName}</strong>
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${contactPhone}`} className="btn-secondary">
            📞 {formatPhone(contactPhone)}
          </a>
          <a href={`viber://chat?number=${encodeURIComponent(contactPhone)}`} className="btn-secondary">
            💜 Viber
          </a>
        </div>
        {order.sellerNote && (
          <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm">
            <span className="font-medium">Message from shop:</span> {order.sellerNote}
          </p>
        )}
      </section>

      <section className="card p-4">
        <ul className="space-y-1 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>
                {i.quantity} × {i.title}
              </span>
              <span>{formatMvr(i.priceLaari * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
          {order.deliveryFeeLaari > 0 && (
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{formatMvr(order.deliveryFeeLaari)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatMvr(order.totalLaari)}</span>
          </div>
        </div>
      </section>

      <section className="card space-y-1 p-4 text-sm">
        <p className="font-medium">{fulfilmentLabels[order.fulfilment]}</p>
        {order.fulfilment === "delivery" && <p>Deliver to: {order.deliveryAddress}</p>}
        {order.fulfilment === "pickup" && shop.address && <p>Pick up at: {shop.address}</p>}
        {order.customerNote && (
          <p>
            <span className="font-medium">Note:</span> {order.customerNote}
          </p>
        )}
        <p className="pt-2 font-medium">
          {order.paymentMethod === "cash" ? "💵 Cash" : "🏦 Bank transfer"}
          {order.paymentReceived && <span className="ml-2 text-brand-700">✓ Payment received</span>}
        </p>
        {order.paymentMethod === "bank_transfer" && viewer === "customer" && shop.bankDetails && !order.paymentReceived && (
          <p className="whitespace-pre-line text-gray-600">Transfer to: {shop.bankDetails}</p>
        )}
        {order.receiptUrl && (
          <a href={order.receiptUrl} target="_blank" rel="noreferrer" className="inline-block pt-1 font-medium text-brand-700">
            🧾 View transfer receipt
          </a>
        )}
      </section>
    </div>
  );
}
