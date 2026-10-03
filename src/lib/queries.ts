import { and, asc, desc, eq, gt, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { catalogItems, categories, listings, shops } from "@/db/schema";

export const PAGE_SIZE = 24;

/** Columns needed to render a listing card. */
const cardColumns = {
  id: listings.id,
  title: listings.title,
  kind: listings.kind,
  priceLaari: listings.priceLaari,
  compareAtLaari: listings.compareAtLaari,
  unit: listings.unit,
  imageUrls: listings.imageUrls,
  inStock: listings.inStock,
  isActive: listings.isActive,
  specialUntil: listings.specialUntil,
  catalogItemId: listings.catalogItemId,
  updatedAt: listings.updatedAt,
  shopName: shops.name,
  shopSlug: shops.slug,
  categoryIcon: categories.icon,
  // How many approved shops sell the same catalogue product (for "compare prices").
  // Outer columns are written out in full: Drizzle leaves them unqualified in a
  // single-table select, which would bind them to the subquery's own table.
  offerCount: sql<number>`(
    select count(*)::int from ${listings} l2
    join ${shops} s2 on s2.id = l2.shop_id
    where l2.catalog_item_id = "listings"."catalog_item_id"
      and l2.is_active and s2.status = 'approved'
  )`,
};

export type ListingCard = Awaited<ReturnType<typeof latestListings>>[number];

/** Only active listings from approved shops are public. */
const isPublic = and(eq(listings.isActive, true), eq(shops.status, "approved"));

function cardQuery() {
  return db
    .select(cardColumns)
    .from(listings)
    .innerJoin(shops, eq(listings.shopId, shops.id))
    .innerJoin(categories, eq(listings.categoryId, categories.id));
}

export async function latestListings(limit = 12) {
  return cardQuery()
    .where(and(isPublic, eq(listings.inStock, true)))
    .orderBy(desc(listings.createdAt))
    .limit(limit);
}

export async function todaysSpecials(limit = 12) {
  return cardQuery()
    .where(and(isPublic, eq(listings.inStock, true), gt(listings.specialUntil, new Date())))
    .orderBy(desc(listings.updatedAt))
    .limit(limit);
}

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "newest";

export interface SearchParams {
  q?: string;
  category?: string;
  minLaari?: number | null;
  maxLaari?: number | null;
  inStockOnly?: boolean;
  sort?: SearchSort;
  page?: number;
}

export async function searchListings(params: SearchParams) {
  const q = params.q?.trim();
  const conditions: (SQL | undefined)[] = [isPublic];

  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(listings.title, pattern),
        ilike(listings.description, pattern),
        ilike(shops.name, pattern),
        sql`word_similarity(${q}, ${listings.title}) > 0.45`,
        sql`exists (select 1 from ${catalogItems} ci where ci.id = ${listings.catalogItemId}
              and (ci.name ilike ${pattern} or ci.brand ilike ${pattern}))`,
      ),
    );
  }
  if (params.category) conditions.push(eq(categories.slug, params.category));
  if (params.minLaari != null) conditions.push(gte(listings.priceLaari, params.minLaari));
  if (params.maxLaari != null) conditions.push(lte(listings.priceLaari, params.maxLaari));
  if (params.inStockOnly) conditions.push(eq(listings.inStock, true));

  const sort = params.sort ?? (q ? "relevance" : "newest");
  const orderBy =
    sort === "price_asc"
      ? [asc(listings.priceLaari)]
      : sort === "price_desc"
        ? [desc(listings.priceLaari)]
        : sort === "relevance" && q
          ? [
              desc(listings.inStock),
              desc(sql`greatest(word_similarity(${q}, ${listings.title}), similarity(${q}, ${listings.title}))`),
              asc(listings.priceLaari),
            ]
          : [desc(listings.createdAt)];

  const page = Math.max(1, params.page ?? 1);
  const rows = await cardQuery()
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  return { results: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE, page };
}

/** Catalogue products matching the query, each with its cheapest current price. */
export async function matchingCatalogItems(q: string, limit = 6) {
  const pattern = `%${q.trim().replace(/[%_\\]/g, "\\$&")}%`;
  return db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      size: catalogItems.size,
      minPriceLaari: sql<number>`min(${listings.priceLaari})::int`,
      maxPriceLaari: sql<number>`max(${listings.priceLaari})::int`,
      shopCount: sql<number>`count(distinct ${listings.shopId})::int`,
    })
    .from(catalogItems)
    .innerJoin(listings, eq(listings.catalogItemId, catalogItems.id))
    .innerJoin(shops, eq(listings.shopId, shops.id))
    .where(
      and(
        isPublic,
        eq(listings.inStock, true),
        or(
          ilike(catalogItems.name, pattern),
          ilike(catalogItems.brand, pattern),
          sql`word_similarity(${q}, ${catalogItems.name}) > 0.45`,
        ),
      ),
    )
    .groupBy(catalogItems.id)
    .having(sql`count(distinct ${listings.shopId}) >= 2`)
    .orderBy(desc(sql`count(distinct ${listings.shopId})`))
    .limit(limit);
}

/** Every shop's offer for one catalogue product, cheapest first. */
export async function compareOffers(catalogItemId: number) {
  return cardQuery()
    .where(and(isPublic, eq(listings.catalogItemId, catalogItemId)))
    .orderBy(desc(listings.inStock), asc(listings.priceLaari));
}

export async function allCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function listingsForShop(shopId: string, includeHidden = false) {
  return cardQuery()
    .where(and(eq(listings.shopId, shopId), includeHidden ? undefined : eq(listings.isActive, true)))
    .orderBy(desc(listings.specialUntil), desc(listings.inStock), desc(listings.updatedAt));
}

export async function approvedShops() {
  return db
    .select({
      id: shops.id,
      slug: shops.slug,
      name: shops.name,
      type: shops.type,
      logoUrl: shops.logoUrl,
      description: shops.description,
      offersDelivery: shops.offersDelivery,
      listingCount: sql<number>`(select count(*)::int from ${listings} l where l.shop_id = "shops"."id" and l.is_active)`,
    })
    .from(shops)
    .where(eq(shops.status, "approved"))
    .orderBy(asc(shops.name));
}

export async function searchCatalog(q: string, limit = 8) {
  const pattern = `%${q.trim().replace(/[%_\\]/g, "\\$&")}%`;
  return db
    .select({
      id: catalogItems.id,
      name: catalogItems.name,
      brand: catalogItems.brand,
      size: catalogItems.size,
      categoryId: catalogItems.categoryId,
    })
    .from(catalogItems)
    .where(
      or(
        ilike(catalogItems.name, pattern),
        ilike(catalogItems.brand, pattern),
        sql`word_similarity(${q}, ${catalogItems.name}) > 0.4`,
      ),
    )
    .orderBy(desc(sql`word_similarity(${q}, ${catalogItems.name})`))
    .limit(limit);
}
