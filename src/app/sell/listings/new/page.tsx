import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { defaultKindForShop } from "@/lib/labels";
import { allCategories } from "@/lib/queries";
import { createListing } from "../../actions";
import { ListingForm } from "../../listing-form";

export const metadata: Metadata = { title: "Add item" };

export default async function NewListingPage(props: PageProps<"/sell/listings/new">) {
  const { shop } = await requireSeller("/sell/listings/new");
  const categories = await allCategories();
  const added = (await props.searchParams).added === "1";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/sell/listings" className="text-sm text-brand-700">
        ← My listings
      </Link>
      <h1 className="text-2xl font-bold">Add item</h1>
      {added && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">✅ Published! Add the next one.</p>}
      <ListingForm action={createListing} categories={categories} defaultKind={defaultKindForShop(shop.type)} />
    </div>
  );
}
