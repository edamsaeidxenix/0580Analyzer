import type { Metadata } from "next";
import Link from "next/link";
import { ShopAvatar } from "@/components/shop-avatar";
import { shopTypeLabels } from "@/lib/labels";
import { approvedShops } from "@/lib/queries";

export const metadata: Metadata = { title: "Shops" };

export default async function ShopsPage() {
  const shops = await approvedShops();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shops in Milandhoo</h1>
      {shops.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">No shops yet.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {shops.map((s) => (
            <Link key={s.id} href={`/s/${s.slug}`} className="card flex gap-3 p-4 hover:border-brand-500">
              <ShopAvatar name={s.name} logoUrl={s.logoUrl} size="size-14" />
              <div className="min-w-0">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-gray-500">
                  {shopTypeLabels[s.type]} · {s.listingCount} items{s.offersDelivery && " · Delivers"}
                </p>
                {s.description && <p className="mt-1 line-clamp-2 text-sm text-gray-600">{s.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
