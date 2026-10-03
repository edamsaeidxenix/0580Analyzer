import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { SearchBar } from "@/components/search-bar";
import { ShopAvatar } from "@/components/shop-avatar";
import { allCategories, approvedShops, latestListings, todaysSpecials } from "@/lib/queries";

export default async function HomePage() {
  const [categories, specials, latest, shops] = await Promise.all([
    allCategories(),
    todaysSpecials(8),
    latestListings(12),
    approvedShops(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Everything Milandhoo sells, in one place</h1>
        <p className="mt-1 text-brand-100">Search, compare prices and order from local shops — no more scrolling through hundreds of posters.</p>
        <div className="mt-4 text-gray-900">
          <SearchBar />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Categories</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/search?category=${c.slug}`}
              className="card flex flex-col items-center gap-1 p-3 text-center hover:border-brand-500"
            >
              <span className="text-3xl" aria-hidden>
                {c.icon}
              </span>
              <span className="text-xs leading-tight font-medium">{c.name}</span>
              {c.nameDv && (
                <span lang="dv" className="text-[11px] text-gray-500">
                  {c.nameDv}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {specials.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">🔥 Today&apos;s specials</h2>
          </div>
          <ListingGrid listings={specials} />
        </section>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-bold">New in the market</h2>
          <Link href="/search?sort=newest" className="text-sm font-medium text-brand-700">
            See all →
          </Link>
        </div>
        <ListingGrid listings={latest} empty="No listings yet. Shops are joining soon!" />
      </section>

      {shops.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Shops</h2>
            <Link href="/shops" className="text-sm font-medium text-brand-700">
              All shops →
            </Link>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {shops.slice(0, 12).map((s) => (
              <Link key={s.id} href={`/s/${s.slug}`} className="card w-36 shrink-0 p-3 hover:border-brand-500">
                <ShopAvatar name={s.name} logoUrl={s.logoUrl} />
                <p className="mt-2 truncate text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-gray-500">{s.listingCount} items</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold">Do you sell in Milandhoo?</h2>
          <p className="text-sm text-gray-600">Open your free shop, post once and stay visible — no daily reposting.</p>
        </div>
        <Link href="/sell" className="btn-primary">
          Start selling
        </Link>
      </section>
    </div>
  );
}
