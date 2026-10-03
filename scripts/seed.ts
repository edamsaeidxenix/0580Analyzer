/**
 * Seeds categories and the shared product catalogue.
 *   npm run db:seed           -> categories + catalogue (safe to run repeatedly)
 *   npm run db:seed -- --demo -> also adds demo shops and listings for testing
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

const { categories, catalogItems, listings, shops, users } = schema;

const CATEGORIES = [
  { slug: "groceries", name: "Groceries", nameDv: "ކާބޯތަކެތި", icon: "🛒" },
  { slug: "food", name: "Food & Restaurants", nameDv: "ކެއުން", icon: "🍛" },
  { slug: "fish-produce", name: "Fish & Produce", nameDv: "މަސް އަދި ދަނޑުވެރިކަން", icon: "🐟" },
  { slug: "home-made", name: "Home-made", nameDv: "ގޭގައި ހަދާ", icon: "🧁" },
  { slug: "clothing", name: "Clothing & Fashion", nameDv: "ހެދުން", icon: "👗" },
  { slug: "electronics", name: "Electronics & Phones", nameDv: "އިލެކްޓްރޯނިކްސް", icon: "📱" },
  { slug: "household", name: "Household", nameDv: "ގޭބިސީގެ ތަކެތި", icon: "🏠" },
  { slug: "health-beauty", name: "Health & Beauty", nameDv: "ސިއްޙަތާއި ރީތިކަން", icon: "💄" },
  { slug: "hardware", name: "Hardware & Fishing", nameDv: "ހާޑްވެއަރ", icon: "🔧" },
  { slug: "guest-houses", name: "Guest houses & Stays", nameDv: "ގެސްޓްހައުސް", icon: "🛏️" },
  { slug: "services", name: "Services", nameDv: "ޚިދުމަތް", icon: "🧰" },
];

// Common items sold in many island shops, so their prices can be compared.
const CATALOG: [string, string | null, string | null, string][] = [
  ["Milo", "Nestlé", "400g", "groceries"],
  ["Milo", "Nestlé", "1kg", "groceries"],
  ["Nido full cream milk powder", "Nestlé", "900g", "groceries"],
  ["Anchor full cream milk powder", "Anchor", "1kg", "groceries"],
  ["Sweetened condensed milk", "Milkmaid", "390g", "groceries"],
  ["Basmati rice", null, "5kg", "groceries"],
  ["Rice (white)", null, "1kg", "groceries"],
  ["Sugar (white)", null, "1kg", "groceries"],
  ["Wheat flour", null, "1kg", "groceries"],
  ["Cooking oil", null, "1L", "groceries"],
  ["Coconut milk", null, "400ml", "groceries"],
  ["Tuna chunks in oil (canned)", null, "185g", "groceries"],
  ["Instant noodles", "Maggi", "5 pack", "groceries"],
  ["Black tea", "Lipton", "100 bags", "groceries"],
  ["Nescafé Classic coffee", "Nestlé", "200g", "groceries"],
  ["Eggs", null, "tray of 30", "groceries"],
  ["Eggs", null, "dozen", "groceries"],
  ["Bread loaf", null, null, "groceries"],
  ["Biscuits (Marie)", null, "200g", "groceries"],
  ["Mineral water", null, "1.5L", "groceries"],
  ["Mineral water", null, "500ml", "groceries"],
  ["Coca-Cola", null, "1.5L", "groceries"],
  ["Coca-Cola can", null, "330ml", "groceries"],
  ["Onions", null, "1kg", "fish-produce"],
  ["Potatoes", null, "1kg", "fish-produce"],
  ["Tomatoes", null, "1kg", "fish-produce"],
  ["Bananas", null, "1kg", "fish-produce"],
  ["Fresh tuna (skipjack)", null, "1kg", "fish-produce"],
  ["Rihaakuru", null, "500g", "fish-produce"],
  ["Valhomas (smoked tuna)", null, "1kg", "fish-produce"],
  ["Laundry detergent powder", null, "1kg", "household"],
  ["Dishwashing liquid", null, "500ml", "household"],
  ["Toilet paper", null, "10 rolls", "household"],
  ["Mosquito coil", null, "10 pack", "household"],
  ["Gas cylinder refill", null, "12kg", "household"],
  ["Shampoo", "Sunsilk", "340ml", "health-beauty"],
  ["Toothpaste", "Colgate", "150g", "health-beauty"],
  ["Bath soap", "Lux", "4 pack", "health-beauty"],
  ["Diapers", "Pampers", "size M", "health-beauty"],
  ["Paracetamol", "Panadol", "12 tablets", "health-beauty"],
  ["Mobile recharge card", "Dhiraagu", "MVR 100", "electronics"],
  ["Mobile recharge card", "Ooredoo", "MVR 100", "electronics"],
  ["Fishing line", null, "100m", "hardware"],
  ["Petrol", null, "1L", "hardware"],
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  for (const [i, c] of CATEGORIES.entries()) {
    await db
      .insert(categories)
      .values({ ...c, sortOrder: i })
      .onConflictDoUpdate({ target: categories.slug, set: { ...c, sortOrder: i } });
  }
  const cats = await db.select().from(categories);
  const catId = (slug: string) => cats.find((c) => c.slug === slug)!.id;

  const existing = await db.select().from(catalogItems);
  const key = (name: string, size: string | null) => `${name}|${size ?? ""}`.toLowerCase();
  const have = new Set(existing.map((e) => key(e.name, e.size)));
  const toAdd = CATALOG.filter(([name, , size]) => !have.has(key(name, size))).map(
    ([name, brand, size, cat]) => ({ name, brand, size, categoryId: catId(cat) }),
  );
  if (toAdd.length) await db.insert(catalogItems).values(toAdd);
  console.log(`Categories: ${cats.length}, catalogue items added: ${toAdd.length}`);

  if (process.argv.includes("--demo")) await seedDemo(db, catId);

  await pool.end();
}

async function seedDemo(
  db: ReturnType<typeof drizzle<typeof schema>>,
  catId: (slug: string) => number,
) {
  const catalog = await db.select().from(catalogItems);
  const item = (name: string, size: string) =>
    catalog.find((c) => c.name === name && c.size === size)?.id ?? null;

  const demoShops = [
    {
      phone: "+9607000001",
      shop: {
        slug: "hamza-store",
        name: "Hamza Store",
        type: "shop" as const,
        description: "Groceries, household items and fresh produce. Open daily.",
        address: "Near the harbour",
        openingHours: "8:00am – 11:00pm (closed during Friday prayer)",
        offersDelivery: true,
        deliveryFeeLaari: 1000,
        acceptsBankTransfer: true,
        bankDetails: "BML 7730000000001 — Hamza Store",
      },
      listings: [
        { title: "Milo 400g", price: 6500, cat: "groceries", catalog: item("Milo", "400g") },
        { title: "Sugar 1kg", price: 1500, cat: "groceries", catalog: item("Sugar (white)", "1kg") },
        { title: "Eggs – tray of 30", price: 7500, cat: "groceries", catalog: item("Eggs", "tray of 30") },
        { title: "Onions 1kg", price: 2200, cat: "fish-produce", catalog: item("Onions", "1kg") },
        { title: "Mineral water 1.5L", price: 900, cat: "groceries", catalog: item("Mineral water", "1.5L") },
        { title: "Maggi noodles 5 pack", price: 2800, cat: "groceries", catalog: item("Instant noodles", "5 pack"), special: 2400 },
      ],
    },
    {
      phone: "+9607000002",
      shop: {
        slug: "island-mart",
        name: "Island Mart",
        type: "shop" as const,
        description: "Your one-stop shop for groceries and electronics.",
        address: "Main road, opposite the school",
        openingHours: "9:00am – 10:30pm",
        offersDelivery: false,
        deliveryFeeLaari: 0,
        acceptsBankTransfer: true,
        bankDetails: "BML 7730000000002 — Island Mart Pvt Ltd",
      },
      listings: [
        { title: "MILO tin 400 g", price: 6200, cat: "groceries", catalog: item("Milo", "400g") },
        { title: "White sugar 1kg pack", price: 1400, cat: "groceries", catalog: item("Sugar (white)", "1kg") },
        { title: "Eggs (30)", price: 7800, cat: "groceries", catalog: item("Eggs", "tray of 30"), inStock: false },
        { title: "Water bottle 1.5L", price: 850, cat: "groceries", catalog: item("Mineral water", "1.5L") },
        { title: "Phone charger USB-C fast charge", price: 15000, cat: "electronics", catalog: null },
        { title: "Dhiraagu reload card MVR 100", price: 10000, cat: "electronics", catalog: item("Mobile recharge card", "MVR 100") },
      ],
    },
    {
      phone: "+9607000003",
      shop: {
        slug: "sea-breeze-cafe",
        name: "Sea Breeze Café",
        type: "restaurant" as const,
        description: "Hedhikaa, short eats, fried rice and fresh juice. Pre-order for pickup.",
        address: "Beach side, north",
        openingHours: "6:00am – 12:00 midnight",
        offersDelivery: true,
        deliveryFeeLaari: 500,
        acceptsBankTransfer: false,
        bankDetails: null,
      },
      listings: [
        { title: "Chicken fried rice", price: 4500, cat: "food", catalog: null, kind: "menu_item" as const },
        { title: "Mas huni with roshi (breakfast)", price: 3000, cat: "food", catalog: null, kind: "menu_item" as const, special: 2500 },
        { title: "Hedhikaa plate (10 pcs)", price: 2500, cat: "food", catalog: null, kind: "menu_item" as const },
        { title: "Fresh watermelon juice", price: 2000, cat: "food", catalog: null, kind: "menu_item" as const },
      ],
    },
    {
      phone: "+9607000004",
      shop: {
        slug: "aminas-kitchen",
        name: "Amina's Kitchen",
        type: "micro_business" as const,
        description: "Home-made cakes, bondi bai and kulhi boakiba. Orders one day in advance.",
        address: "Home delivery around the island",
        openingHours: "Order by 8pm for next day",
        offersDelivery: true,
        deliveryFeeLaari: 0,
        acceptsBankTransfer: true,
        bankDetails: "BML 7730000000004 — Aminath Ali",
      },
      listings: [
        { title: "Chocolate cake (1kg)", price: 35000, cat: "home-made", catalog: null },
        { title: "Kulhi boakiba (tray)", price: 15000, cat: "home-made", catalog: null },
        { title: "Bondi bai (per bowl)", price: 2500, cat: "home-made", catalog: null },
      ],
    },
    {
      phone: "+9607000005",
      shop: {
        slug: "coral-view-guesthouse",
        name: "Coral View Guest House",
        type: "guest_house" as const,
        description: "Clean air-conditioned rooms, 2 minutes from the beach. Airport transfer on request.",
        address: "South beach road",
        openingHours: "Reception 24 hours",
        offersDelivery: false,
        deliveryFeeLaari: 0,
        acceptsBankTransfer: true,
        bankDetails: "BML 7730000000005 — Coral View",
      },
      listings: [
        { title: "Double room with breakfast (per night)", price: 75000, cat: "guest-houses", catalog: null, kind: "room" as const, unit: "per night" },
        { title: "Family room (per night)", price: 110000, cat: "guest-houses", catalog: null, kind: "room" as const, unit: "per night" },
      ],
    },
  ];

  for (const demo of demoShops) {
    const [owner] = await db
      .insert(users)
      .values({ phone: demo.phone, name: `${demo.shop.name} owner` })
      .onConflictDoUpdate({ target: users.phone, set: { updatedAt: new Date() } })
      .returning();

    const [found] = await db.select().from(shops).where(eq(shops.slug, demo.shop.slug));
    if (found) continue;

    const [shop] = await db
      .insert(shops)
      .values({ ...demo.shop, ownerId: owner.id, phone: demo.phone, status: "approved" })
      .returning();

    await db.insert(listings).values(
      demo.listings.map((l) => {
        const special = "special" in l ? l.special : undefined;
        return {
          shopId: shop.id,
          categoryId: catId(l.cat),
          catalogItemId: l.catalog,
          kind: "kind" in l ? l.kind : ("product" as const),
          title: l.title,
          unit: "unit" in l ? l.unit : null,
          priceLaari: special ?? l.price,
          compareAtLaari: special ? l.price : null,
          specialUntil: special ? new Date(Date.now() + 24 * 60 * 60_000) : null,
          inStock: "inStock" in l ? l.inStock : true,
        };
      }),
    );
  }
  console.log(`Demo shops ready (${demoShops.length}). Seller logins: +9607000001 … +9607000005`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
