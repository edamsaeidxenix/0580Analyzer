import type { Metadata } from "next";
import { count, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { SubmitButton } from "@/components/forms";
import { formatDateTime } from "@/components/order-view";
import { db } from "@/db";
import { catalogItems, listings, orders, reports, shops, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { shopTypeLabels } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { allCategories } from "@/lib/queries";
import { addCatalogItem, resolveReport, setShopStatus } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  const [allShops, openReports, categories, [stats], catalog] = await Promise.all([
    db.select().from(shops).orderBy(sql`case ${shops.status} when 'pending' then 0 else 1 end`, desc(shops.createdAt)),
    db
      .select({ report: reports, listingTitle: listings.title, shopName: shops.name })
      .from(reports)
      .innerJoin(listings, eq(reports.listingId, listings.id))
      .innerJoin(shops, eq(listings.shopId, shops.id))
      .where(eq(reports.resolved, false))
      .orderBy(desc(reports.createdAt)),
    allCategories(),
    db
      .select({
        users: sql<number>`(select count(*)::int from ${users})`,
        listings: sql<number>`(select count(*)::int from ${listings} where is_active)`,
        orders: count(),
        ordersWeek: sql<number>`count(*) filter (where ${orders.createdAt} > now() - interval '7 days')::int`,
      })
      .from(orders),
    db
      .select({
        id: catalogItems.id,
        name: catalogItems.name,
        size: catalogItems.size,
        brand: catalogItems.brand,
        uses: sql<number>`(select count(*)::int from ${listings} l where l.catalog_item_id = "catalog_items"."id")`,
      })
      .from(catalogItems)
      .orderBy(catalogItems.name),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Users", stats.users],
          ["Shops", allShops.length],
          ["Active listings", stats.listings],
          ["Orders (7 days)", stats.ordersWeek],
        ].map(([label, value]) => (
          <div key={label} className="card p-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Shops</h2>
        <ul className="space-y-2">
          {allShops.map((s) => (
            <li key={s.id} className="card flex flex-wrap items-center justify-between gap-3 p-3">
              <div>
                <Link href={`/s/${s.slug}`} className="font-semibold">
                  {s.name}
                </Link>
                <p className="text-xs text-gray-500">
                  {shopTypeLabels[s.type]} · {formatPhone(s.phone)} · joined {formatDateTime(s.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    s.status === "approved"
                      ? "bg-brand-100 text-brand-800"
                      : s.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {s.status}
                </span>
                <form action={setShopStatus}>
                  <input type="hidden" name="shopId" value={s.id} />
                  {s.status === "approved" ? (
                    <SubmitButton name="status" value="suspended" className="btn-danger px-3 py-1.5">
                      Suspend
                    </SubmitButton>
                  ) : (
                    <SubmitButton name="status" value="approved" className="btn-primary px-3 py-1.5">
                      Approve
                    </SubmitButton>
                  )}
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Reports ({openReports.length})</h2>
        {openReports.length === 0 ? (
          <p className="card p-4 text-sm text-gray-500">No open reports.</p>
        ) : (
          <ul className="space-y-2">
            {openReports.map(({ report, listingTitle, shopName }) => (
              <li key={report.id} className="card flex flex-wrap items-center justify-between gap-3 p-3">
                <div>
                  <Link href={`/l/${report.listingId}`} className="font-semibold">
                    {listingTitle}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {shopName} · “{report.reason}” · {formatDateTime(report.createdAt)}
                  </p>
                </div>
                <form action={resolveReport} className="flex gap-2">
                  <input type="hidden" name="reportId" value={report.id} />
                  <SubmitButton name="hideListing" value="1" className="btn-danger px-3 py-1.5">
                    Hide listing
                  </SubmitButton>
                  <SubmitButton name="hideListing" value="0" className="btn-secondary px-3 py-1.5">
                    Dismiss
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-bold">Price comparison catalogue ({catalog.length})</h2>
        <p className="text-sm text-gray-600">
          Common products sellers can link their listings to, so customers can compare prices across shops.
        </p>
        <form action={addCatalogItem} className="card grid gap-2 p-3 sm:grid-cols-5">
          <input name="name" placeholder="Product name" required className="input sm:col-span-2" />
          <input name="size" placeholder="Size (e.g. 400g)" className="input" />
          <input name="brand" placeholder="Brand" className="input" />
          <select name="categoryId" className="input" defaultValue="">
            <option value="">Category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <SubmitButton className="btn-primary sm:col-span-5">Add to catalogue</SubmitButton>
        </form>
        <details className="card p-3">
          <summary className="cursor-pointer text-sm font-medium">Show catalogue</summary>
          <ul className="mt-2 divide-y divide-gray-100 text-sm">
            {catalog.map((c) => (
              <li key={c.id} className="flex justify-between py-1.5">
                <Link href={`/compare/${c.id}`}>
                  {c.name} {c.size && <span className="text-gray-500">· {c.size}</span>}{" "}
                  {c.brand && <span className="text-gray-400">({c.brand})</span>}
                </Link>
                <span className="text-gray-500">{c.uses} listings</span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
