import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AddToCart } from "@/components/add-to-cart";
import { isSpecial, ListingImage, Price } from "@/components/listing-card";
import { ShareButton } from "@/components/share-button";
import { ShopAvatar } from "@/components/shop-avatar";
import { db } from "@/db";
import { categories, listings, shops } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { formatMvr } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { compareOffers } from "@/lib/queries";
import { isUuid } from "@/lib/validate";
import { ReportForm } from "./report-form";

const getListing = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const [row] = await db
    .select({ listing: listings, shop: shops, category: categories })
    .from(listings)
    .innerJoin(shops, eq(listings.shopId, shops.id))
    .innerJoin(categories, eq(listings.categoryId, categories.id))
    .where(eq(listings.id, id))
    .limit(1);
  return row ?? null;
});

export async function generateMetadata(props: PageProps<"/l/[id]">): Promise<Metadata> {
  const row = await getListing((await props.params).id);
  if (!row) return {};
  return {
    title: row.listing.title,
    description: `${formatMvr(row.listing.priceLaari)} at ${row.shop.name}`,
    openGraph: { images: row.listing.imageUrls.slice(0, 1) },
  };
}

export default async function ListingPage(props: PageProps<"/l/[id]">) {
  const { id } = await props.params;
  const row = await getListing(id);
  if (!row) notFound();
  const { listing, shop, category } = row;

  const user = await getCurrentUser();
  const isOwner = user?.id === shop.ownerId;
  const isPublic = listing.isActive && shop.status === "approved";
  if (!isPublic && !isOwner && user?.role !== "admin") notFound();

  const offers = listing.catalogItemId ? await compareOffers(listing.catalogItemId) : [];
  const cheaper = offers.filter((o) => o.id !== listing.id && o.inStock && o.priceLaari < listing.priceLaari);
  const isBooking = listing.kind === "room" || listing.kind === "service";

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        {listing.imageUrls.length > 0 ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            {listing.imageUrls.map((src, i) => (
              <ListingImage
                key={src}
                src={src}
                alt={`${listing.title} photo ${i + 1}`}
                icon={category.icon}
                className="aspect-square w-[85%] shrink-0 snap-center rounded-2xl md:w-full"
              />
            ))}
          </div>
        ) : (
          <ListingImage src={null} alt={listing.title} icon={category.icon} className="aspect-square w-full rounded-2xl" />
        )}
      </div>

      <div className="space-y-5">
        {!isPublic && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {shop.status !== "approved"
              ? "Your shop is waiting for approval. Customers can't see this listing yet."
              : "This listing is hidden from customers."}
          </p>
        )}
        <div className="space-y-2">
          <Link href={`/search?category=${category.slug}`} className="text-sm text-brand-700">
            {category.icon} {category.name}
          </Link>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          {isSpecial(listing.specialUntil) && (
            <span className="inline-block rounded-full bg-coral-500 px-2 py-0.5 text-xs font-bold text-white">
              Today&apos;s special
            </span>
          )}
          <Price priceLaari={listing.priceLaari} compareAtLaari={listing.compareAtLaari} unit={listing.unit} large />
          <p className={`text-sm font-medium ${listing.inStock ? "text-brand-700" : "text-red-600"}`}>
            {listing.inStock ? (isBooking ? "Available" : "In stock") : isBooking ? "Not available" : "Out of stock"}
          </p>
          <p className="text-xs text-gray-500">Price updated {listing.updatedAt.toLocaleDateString("en-GB")}</p>
        </div>

        {listing.inStock && !isOwner && (
          <AddToCart
            label={isBooking ? "Request booking" : "Add to cart"}
            line={{
              listingId: listing.id,
              shopSlug: shop.slug,
              shopName: shop.name,
              title: listing.title,
              priceLaari: listing.priceLaari,
              imageUrl: listing.imageUrls[0] ?? null,
            }}
          />
        )}
        {isOwner && (
          <Link href={`/sell/listings/${listing.id}`} className="btn-secondary w-full">
            ✏️ Edit this listing
          </Link>
        )}

        {cheaper.length > 0 && (
          <Link href={`/compare/${listing.catalogItemId}`} className="block rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            💡 Available for {formatMvr(Math.min(...cheaper.map((c) => c.priceLaari)))} at {cheaper[0].shopName}. Compare prices →
          </Link>
        )}
        {cheaper.length === 0 && offers.length > 1 && (
          <Link href={`/compare/${listing.catalogItemId}`} className="block text-sm font-medium text-brand-700">
            ✅ Best price in Milandhoo · compare {offers.length} shops →
          </Link>
        )}

        {listing.description && <p className="text-sm whitespace-pre-line text-gray-700">{listing.description}</p>}

        <div className="card space-y-3 p-4">
          <Link href={`/s/${shop.slug}`} className="flex items-center gap-3">
            <ShopAvatar name={shop.name} logoUrl={shop.logoUrl} />
            <div>
              <p className="font-semibold">{shop.name}</p>
              <p className="text-xs text-gray-500">
                {[shop.offersPickup && "Pickup", shop.offersDelivery && "Delivery"].filter(Boolean).join(" · ")}
                {shop.openingHours && ` · ${shop.openingHours}`}
              </p>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${shop.phone}`} className="btn-secondary">
              📞 {formatPhone(shop.phone)}
            </a>
            <a href={`viber://chat?number=${encodeURIComponent(shop.phone)}`} className="btn-secondary">
              💜 Viber
            </a>
            <ShareButton path={`/l/${listing.id}`} text={`${listing.title} – ${formatMvr(listing.priceLaari)} at ${shop.name}`} />
          </div>
        </div>

        {!isOwner && <ReportForm listingId={listing.id} />}
      </div>
    </div>
  );
}
