import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime, StatusBadge } from "@/components/order-view";
import { requireUser } from "@/lib/auth";
import { formatMvr } from "@/lib/money";
import { ordersForCustomer } from "@/lib/orders";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const rows = await ordersForCustomer(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">My orders</h1>
      {rows.length === 0 ? (
        <div className="card space-y-3 p-8 text-center">
          <p className="text-sm text-gray-600">You haven&apos;t placed any orders yet.</p>
          <Link href="/search" className="btn-primary">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map(({ order, shopName }) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-brand-500">
                <div>
                  <p className="font-semibold">{shopName}</p>
                  <p className="text-xs text-gray-500">
                    #{order.number} · {formatDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <StatusBadge status={order.status} fulfilment={order.fulfilment} />
                  <p className="text-sm font-semibold">{formatMvr(order.totalLaari)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
