import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime, StatusBadge } from "@/components/order-view";
import { requireSeller } from "@/lib/auth";
import { formatMvr } from "@/lib/money";
import { isOpenStatus } from "@/lib/order-rules";
import { ordersForShop } from "@/lib/orders";

export const metadata: Metadata = { title: "Orders" };

export default async function SellerOrdersPage(props: PageProps<"/sell/orders">) {
  const { shop } = await requireSeller("/sell/orders");
  const showAll = (await props.searchParams).all === "1";
  const all = await ordersForShop(shop.id);
  const rows = showAll ? all : all.filter((o) => isOpenStatus(o.status));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/sell" className="text-sm text-brand-700">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="flex gap-2">
        <Link href="/sell/orders" className={showAll ? "chip" : "chip-active"}>
          Open
        </Link>
        <Link href="/sell/orders?all=1" className={showAll ? "chip-active" : "chip"}>
          All
        </Link>
      </div>
      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">No {showAll ? "" : "open "}orders.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((o) => (
            <li key={o.id}>
              <Link href={`/sell/orders/${o.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-brand-500">
                <div>
                  <p className="font-semibold">
                    #{o.number} · {o.customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(o.createdAt)} · {o.fulfilment === "delivery" ? "Delivery" : o.fulfilment === "pickup" ? "Pickup" : "Booking"}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <StatusBadge status={o.status} fulfilment={o.fulfilment} />
                  <p className="text-sm font-semibold">{formatMvr(o.totalLaari)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
