import type { Metadata } from "next";
import { and, count, eq, gte, inArray, sql } from "drizzle-orm";
import Link from "next/link";
import { formatDateTime, StatusBadge } from "@/components/order-view";
import { ShareButton } from "@/components/share-button";
import { db } from "@/db";
import { listings, orders } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { formatMvr } from "@/lib/money";

export const metadata: Metadata = { title: "Seller dashboard" };

const OPEN = ["pending", "confirmed", "ready", "out_for_delivery"] as const;

export default async function SellerDashboard(props: PageProps<"/sell">) {
  const { shop } = await requireSeller("/sell");
  const created = (await props.searchParams).created === "1";

  const [openOrders, [listingStats], [weekStats]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(and(eq(orders.shopId, shop.id), inArray(orders.status, [...OPEN])))
      .orderBy(orders.createdAt),
    db
      .select({
        total: count(),
        outOfStock: sql<number>`count(*) filter (where not ${listings.inStock})::int`,
        specials: sql<number>`count(*) filter (where ${listings.specialUntil} > now())::int`,
        stale: sql<number>`count(*) filter (where ${listings.updatedAt} < now() - interval '7 days')::int`,
      })
      .from(listings)
      .where(and(eq(listings.shopId, shop.id), eq(listings.isActive, true))),
    db
      .select({
        orders: count(),
        revenue: sql<number>`coalesce(sum(${orders.totalLaari}), 0)::int`,
      })
      .from(orders)
      .where(and(eq(orders.shopId, shop.id), eq(orders.status, "completed"), gte(orders.createdAt, sql`now() - interval '7 days'`))),
  ]);

  const pending = openOrders.filter((o) => o.status === "pending");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Seller dashboard</p>
          <h1 className="text-2xl font-bold">{shop.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/s/${shop.slug}`} className="btn-secondary">
            View shop
          </Link>
          <ShareButton path={`/s/${shop.slug}`} text={`Order from ${shop.name} on Milandhoo Market`} label="Share" />
        </div>
      </div>

      {created && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          🎉 Your shop is created! Add your first items now — an admin will approve your shop shortly.
        </p>
      )}
      {shop.status === "pending" && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⏳ Waiting for approval. You can add listings now; customers will see them once your shop is approved.
        </p>
      )}
      {shop.status === "suspended" && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Your shop is suspended and hidden from customers. Please contact the Milandhoo Market admin.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="New orders" value={pending.length} highlight={pending.length > 0} href="/sell/orders" />
        <Stat label="Active listings" value={listingStats.total} href="/sell/listings" />
        <Stat label="Out of stock" value={listingStats.outOfStock} href="/sell/listings" />
        <Stat label="Sales this week" value={formatMvr(weekStats.revenue)} sub={`${weekStats.orders} orders`} />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Link href="/sell/listings/new" className="btn-primary py-3">
          ＋ Add item
        </Link>
        <Link href="/sell/listings" className="btn-secondary py-3">
          📋 My listings
        </Link>
        <Link href="/sell/shop" className="btn-secondary py-3">
          ⚙️ Shop details
        </Link>
      </div>

      {listingStats.stale > 0 && (
        <p className="rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-700">
          {listingStats.stale} listing{listingStats.stale > 1 ? "s haven't" : " hasn't"} been updated in over a week.{" "}
          <Link href="/sell/listings" className="font-medium text-brand-700">
            Check prices and stock →
          </Link>
        </p>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Open orders</h2>
        {openOrders.length === 0 ? (
          <div className="card p-6 text-center text-sm text-gray-500">No open orders right now.</div>
        ) : (
          <ul className="space-y-2">
            {openOrders.map((o) => (
              <li key={o.id}>
                <Link href={`/sell/orders/${o.id}`} className="card flex items-center justify-between gap-3 p-4 hover:border-brand-500">
                  <div>
                    <p className="font-semibold">
                      #{o.number} · {o.customerName}
                    </p>
                    <p className="text-xs text-gray-500">{formatDateTime(o.createdAt)}</p>
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
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  href,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  href?: string;
  highlight?: boolean;
}) {
  const body = (
    <>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-coral-600" : ""}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="card p-3 hover:border-brand-500">
      {body}
    </Link>
  ) : (
    <div className="card p-3">{body}</div>
  );
}
