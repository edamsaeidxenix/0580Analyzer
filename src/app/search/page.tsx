import type { Metadata } from "next";
import Link from "next/link";
import { ListingGrid } from "@/components/listing-card";
import { SearchBar } from "@/components/search-bar";
import { formatMvr, parseMvr } from "@/lib/money";
import { allCategories, matchingCatalogItems, searchListings, type SearchSort } from "@/lib/queries";

export const metadata: Metadata = { title: "Search" };

const SORTS: { value: SearchSort; label: string }[] = [
  { value: "relevance", label: "Best match" },
  { value: "price_asc", label: "Cheapest first" },
  { value: "price_desc", label: "Most expensive first" },
  { value: "newest", label: "Newest" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = one(sp.q).slice(0, 100);
  const category = one(sp.category);
  const min = one(sp.min);
  const max = one(sp.max);
  const inStock = one(sp.instock) === "1";
  const sortParam = one(sp.sort) as SearchSort;
  const sort = SORTS.some((s) => s.value === sortParam) ? sortParam : undefined;
  const page = Number(one(sp.page)) || 1;

  const [categories, { results, hasMore }, comparisons] = await Promise.all([
    allCategories(),
    searchListings({
      q,
      category: category || undefined,
      minLaari: min ? parseMvr(min) : null,
      maxLaari: max ? parseMvr(max) : null,
      inStockOnly: inStock,
      sort,
      page,
    }),
    q ? matchingCatalogItems(q) : Promise.resolve([]),
  ]);

  const current = { q, category, min, max, instock: inStock ? "1" : "", sort: sort ?? "" };
  const href = (changes: Partial<typeof current> & { page?: string }) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...current, ...changes })) if (v) params.set(k, v);
    return `/search?${params}`;
  };
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="space-y-4">
      <SearchBar defaultValue={q} autoFocus={!q && !category} />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link href={href({ category: "", page: "" })} className={category ? "chip" : "chip-active"}>
          All
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={href({ category: c.slug, page: "" })} className={c.slug === category ? "chip-active" : "chip"}>
            <span aria-hidden>{c.icon}</span> {c.name}
          </Link>
        ))}
      </div>

      <details className="card p-3" open={Boolean(min || max || inStock)}>
        <summary className="cursor-pointer text-sm font-medium">Filters &amp; sorting</summary>
        <form action="/search" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="category" value={category} />
          <label className="col-span-2 sm:col-span-1">
            <span className="label">Sort by</span>
            <select name="sort" defaultValue={sort ?? ""} className="input">
              <option value="">Default</option>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Min MVR</span>
            <input name="min" inputMode="decimal" defaultValue={min} className="input" placeholder="0" />
          </label>
          <label>
            <span className="label">Max MVR</span>
            <input name="max" inputMode="decimal" defaultValue={max} className="input" placeholder="Any" />
          </label>
          <label className="flex items-center gap-2 py-2 text-sm">
            <input type="checkbox" name="instock" value="1" defaultChecked={inStock} className="size-4 accent-brand-600" />
            In stock only
          </label>
          <button className="btn-primary">Apply</button>
        </form>
      </details>

      {comparisons.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Compare prices</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {comparisons.map((c) => (
              <Link key={c.id} href={`/compare/${c.id}`} className="card flex items-center justify-between gap-3 p-3 hover:border-brand-500">
                <div>
                  <p className="font-medium">
                    {c.name} {c.size && <span className="text-gray-500">· {c.size}</span>}
                  </p>
                  <p className="text-xs text-gray-500">Sold by {c.shopCount} shops</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-brand-700">from {formatMvr(c.minPriceLaari)}</p>
                  {c.maxPriceLaari > c.minPriceLaari && (
                    <p className="text-xs text-gray-500">up to {formatMvr(c.maxPriceLaari)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h1 className="text-sm text-gray-600">
          {q ? (
            <>
              Results for <strong className="text-gray-900">“{q}”</strong>
            </>
          ) : (
            "All listings"
          )}
          {activeCategory && <> in {activeCategory.name}</>}
        </h1>
        <ListingGrid
          listings={results}
          empty={
            <>
              Nothing found. Try a different word{category ? " or search all categories" : ""}.
            </>
          }
        />
        <div className="flex justify-between">
          {page > 1 ? (
            <Link href={href({ page: String(page - 1) })} className="btn-secondary">
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          {hasMore && (
            <Link href={href({ page: String(page + 1) })} className="btn-secondary">
              Next →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
