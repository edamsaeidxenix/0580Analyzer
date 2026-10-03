import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";
import { isSpecial, ListingGrid } from "@/components/listing-card";
import { ShareButton } from "@/components/share-button";
import { ShopAvatar } from "@/components/shop-avatar";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { shopTypeLabels } from "@/lib/labels";
import { formatMvr } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { listingsForShop } from "@/lib/queries";

const getShop = cache(async (slug: string) => {
  const [shop] = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
  return shop ?? null;
});

export async function generateMetadata(props: PageProps<"/s/[slug]">): Promise<Metadata> {
  const shop = await getShop((await props.params).slug);
  return shop ? { title: shop.name, description: shop.description ?? undefined } : {};
}

export default async function ShopPage(props: PageProps<"/s/[slug]">) {
  const shop = await getShop((await props.params).slug);
  if (!shop) notFound();
  const user = await getCurrentUser();
  if (shop.status !== "approved" && user?.id !== shop.ownerId && user?.role !== "admin") notFound();

  const items = await listingsForShop(shop.id);
  const specials = items.filter((l) => isSpecial(l.specialUntil));
  const rest = items.filter((l) => !isSpecial(l.specialUntil));

  return (
    <div className="space-y-6">
      <section className="card space-y-3 p-4">
        <div className="flex items-start gap-3">
          <ShopAvatar name={shop.name} logoUrl={shop.logoUrl} size="size-16" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{shop.name}</h1>
            <p className="text-sm text-gray-500">
              {shopTypeLabels[shop.type]} · {shop.island}
            </p>
          </div>
        </div>
        {shop.description && <p className="text-sm text-gray-700">{shop.description}</p>}
        <dl className="grid gap-1 text-sm text-gray-600">
          {shop.address && (
            <div>
              <dt className="inline font-medium">📍 </dt>
              <dd className="inline">{shop.address}</dd>
            </div>
          )}
          {shop.openingHours && (
            <div>
              <dt className="inline font-medium">🕒 </dt>
              <dd className="inline">{shop.openingHours}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium">🚚 </dt>
            <dd className="inline">
              {[
                shop.offersPickup && "Pickup",
                shop.offersDelivery &&
                  `Delivery${shop.deliveryFeeLaari ? ` (${formatMvr(shop.deliveryFeeLaari)})` : " (free)"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <a href={`tel:${shop.phone}`} className="btn-secondary">
            📞 {formatPhone(shop.phone)}
          </a>
          <a href={`viber://chat?number=${encodeURIComponent(shop.phone)}`} className="btn-secondary">
            💜 Viber
          </a>
          <ShareButton path={`/s/${shop.slug}`} text={`${shop.name} on Milandhoo Market`} label="Share shop" />
        </div>
      </section>

      {specials.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">🔥 Today&apos;s specials</h2>
          <ListingGrid listings={specials} />
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-bold">All items</h2>
        <ListingGrid listings={rest} empty="This shop hasn't listed anything yet." />
      </section>
    </div>
  );
}
