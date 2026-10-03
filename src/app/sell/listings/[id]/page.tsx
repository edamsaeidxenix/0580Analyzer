import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/forms";
import { db } from "@/db";
import { catalogItems, listings } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { defaultKindForShop } from "@/lib/labels";
import { allCategories } from "@/lib/queries";
import { isUuid } from "@/lib/validate";
import { deleteListing, updateListing } from "../../actions";
import { ListingForm } from "../../listing-form";

export const metadata: Metadata = { title: "Edit item" };

export default async function EditListingPage(props: PageProps<"/sell/listings/[id]">) {
  const { id } = await props.params;
  const { shop } = await requireSeller(`/sell/listings/${id}`);
  if (!isUuid(id)) notFound();

  const [listing] = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, id), eq(listings.shopId, shop.id)));
  if (!listing) notFound();

  const [categories, [linked]] = await Promise.all([
    allCategories(),
    listing.catalogItemId
      ? db.select().from(catalogItems).where(eq(catalogItems.id, listing.catalogItemId))
      : Promise.resolve([]),
  ]);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/sell/listings" className="text-sm text-brand-700">
          ← My listings
        </Link>
        <Link href={`/l/${listing.id}`} className="text-sm text-brand-700">
          View as customer →
        </Link>
      </div>
      <h1 className="text-2xl font-bold">Edit item</h1>
      <ListingForm
        action={updateListing}
        categories={categories}
        listing={listing}
        linkedCatalog={linked ?? null}
        defaultKind={defaultKindForShop(shop.type)}
      />
      <form action={deleteListing} className="pt-4">
        <input type="hidden" name="id" value={listing.id} />
        <ConfirmButton message="Delete this listing permanently?" className="btn-danger w-full">
          Delete listing
        </ConfirmButton>
      </form>
    </div>
  );
}
