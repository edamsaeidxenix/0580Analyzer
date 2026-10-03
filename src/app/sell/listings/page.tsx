import type { Metadata } from "next";
import Link from "next/link";
import { isSpecial, ListingImage } from "@/components/listing-card";
import { requireSeller } from "@/lib/auth";
import { formatMvr } from "@/lib/money";
import { listingsForShop } from "@/lib/queries";
import { quickUpdateListing } from "../actions";

export const metadata: Metadata = { title: "My listings" };

function QuickButton({ id, op, children, className = "chip" }: { id: string; op: string; children: React.ReactNode; className?: string }) {
  return (
    <form action={quickUpdateListing}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="op" value={op} />
      <button className={`${className} px-2.5 py-1 text-xs`}>{children}</button>
    </form>
  );
}

export default async function MyListingsPage(props: PageProps<"/sell/listings">) {
  const { shop } = await requireSeller("/sell/listings");
  const sp = await props.searchParams;
  const items = await listingsForShop(shop.id, true);
  const notice = sp.added ? "Listing published." : sp.saved ? "Changes saved." : sp.deleted ? "Listing deleted." : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link href="/sell" className="text-sm text-brand-700">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold">My listings</h1>
        </div>
        <Link href="/sell/listings/new" className="btn-primary">
          ＋ Add item
        </Link>
      </div>
      {notice && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">{notice}</p>}

      {items.length === 0 ? (
        <div className="card space-y-3 p-8 text-center">
          <p className="text-sm text-gray-600">No listings yet. Take a photo of an item (or your poster) to add it in seconds.</p>
          <Link href="/sell/listings/new" className="btn-primary">
            Add your first item
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((l) => {
            const special = isSpecial(l.specialUntil);
            const hidden = !l.isActive;
            return (
              <li key={l.id} className={`card flex gap-3 p-3 ${hidden ? "opacity-60" : ""}`}>
                <Link href={`/sell/listings/${l.id}`} className="shrink-0">
                  <ListingImage src={l.imageUrls[0]} alt="" icon={l.categoryIcon} className="size-20 rounded-xl" />
                </Link>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Link href={`/sell/listings/${l.id}`} className="block">
                    <p className="truncate font-medium">{l.title}</p>
                    <p className="text-sm">
                      <strong>{formatMvr(l.priceLaari)}</strong>
                      {l.unit && <span className="text-gray-500"> {l.unit}</span>}
                      {hidden && <span className="ml-2 text-xs text-gray-500">(hidden)</span>}
                      {!l.inStock && <span className="ml-2 text-xs text-red-600">Out of stock</span>}
                      {special && <span className="ml-2 text-xs font-semibold text-coral-600">🔥 Special</span>}
                    </p>
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    {l.inStock ? (
                      <QuickButton id={l.id} op="out_of_stock">Mark sold out</QuickButton>
                    ) : (
                      <QuickButton id={l.id} op="in_stock">Back in stock</QuickButton>
                    )}
                    {special ? (
                      <QuickButton id={l.id} op="special_off">End special</QuickButton>
                    ) : (
                      <QuickButton id={l.id} op="special_on">🔥 Special today</QuickButton>
                    )}
                    <QuickButton id={l.id} op="refresh">✓ Price still correct</QuickButton>
                    {hidden ? (
                      <QuickButton id={l.id} op="show">Show</QuickButton>
                    ) : (
                      <QuickButton id={l.id} op="hide">Hide</QuickButton>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
