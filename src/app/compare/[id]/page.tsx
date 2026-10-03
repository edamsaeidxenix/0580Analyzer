import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingImage } from "@/components/listing-card";
import { db } from "@/db";
import { catalogItems } from "@/db/schema";
import { formatMvr } from "@/lib/money";
import { compareOffers } from "@/lib/queries";

export const metadata: Metadata = { title: "Compare prices" };

export default async function ComparePage(props: PageProps<"/compare/[id]">) {
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const [item] = await db.select().from(catalogItems).where(eq(catalogItems.id, id));
  if (!item) notFound();
  const offers = await compareOffers(id);
  const inStock = offers.filter((o) => o.inStock);
  const cheapest = inStock[0]?.priceLaari;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-sm text-gray-500">Compare prices</p>
        <h1 className="text-2xl font-bold">
          {item.name} {item.size && <span className="text-gray-500">· {item.size}</span>}
        </h1>
        {item.brand && <p className="text-sm text-gray-600">{item.brand}</p>}
      </div>

      {inStock.length > 1 && cheapest != null && (
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
          Prices range from <strong>{formatMvr(cheapest)}</strong> to{" "}
          <strong>{formatMvr(inStock[inStock.length - 1].priceLaari)}</strong> across {inStock.length} shops.
        </p>
      )}

      {offers.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">No shop lists this product right now.</div>
      ) : (
        <ol className="space-y-2">
          {offers.map((o) => (
            <li key={o.id}>
              <Link href={`/l/${o.id}`} className="card flex items-center gap-3 p-3 hover:border-brand-500">
                <ListingImage src={o.imageUrls[0]} alt="" icon={o.categoryIcon} className="size-16 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{o.shopName}</p>
                  <p className="truncate text-sm text-gray-600">{o.title}</p>
                  <p className="text-xs text-gray-400">Updated {o.updatedAt.toLocaleDateString("en-GB")}</p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${o.inStock ? "" : "text-gray-400 line-through"}`}>{formatMvr(o.priceLaari)}</p>
                  {!o.inStock ? (
                    <p className="text-xs text-red-600">Out of stock</p>
                  ) : (
                    o.priceLaari === cheapest && <p className="text-xs font-semibold text-brand-700">Cheapest</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
