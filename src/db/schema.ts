import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const shopType = pgEnum("shop_type", [
  "shop",
  "restaurant",
  "guest_house",
  "micro_business",
]);

export const shopStatus = pgEnum("shop_status", ["pending", "approved", "suspended"]);

export const listingKind = pgEnum("listing_kind", ["product", "menu_item", "room", "service"]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "ready",
  "out_for_delivery",
  "completed",
  "rejected",
  "cancelled",
]);

export const fulfilment = pgEnum("fulfilment", ["pickup", "delivery", "booking"]);

export const paymentMethod = pgEnum("payment_method", ["cash", "bank_transfer"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  // E.164 format, e.g. +9607771234
  phone: text("phone").notNull().unique(),
  name: text("name"),
  role: userRole("role").notNull().default("user"),
  ...timestamps,
});

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: text("phone").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("otp_codes_phone_idx").on(t.phone, t.createdAt)],
);

export const sessions = pgTable("sessions", {
  // sha256 of the session token stored in the cookie
  id: text("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: shopType("type").notNull().default("shop"),
    description: text("description"),
    island: text("island").notNull().default("Milandhoo"),
    address: text("address"),
    phone: text("phone").notNull(),
    openingHours: text("opening_hours"),
    logoUrl: text("logo_url"),
    offersPickup: boolean("offers_pickup").notNull().default(true),
    offersDelivery: boolean("offers_delivery").notNull().default(false),
    deliveryFeeLaari: integer("delivery_fee_laari").notNull().default(0),
    acceptsBankTransfer: boolean("accepts_bank_transfer").notNull().default(false),
    bankDetails: text("bank_details"),
    status: shopStatus("status").notNull().default("pending"),
    ...timestamps,
  },
  (t) => [uniqueIndex("shops_owner_idx").on(t.ownerId)],
);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameDv: text("name_dv"),
  icon: text("icon").notNull().default("🛍️"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/**
 * Shared catalogue of common products (mostly groceries). Sellers link their
 * listings to a catalogue item so the same product can be price-compared
 * across shops.
 */
export const catalogItems = pgTable("catalog_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand"),
  size: text("size"),
  categoryId: integer("category_id").references(() => categories.id),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    catalogItemId: integer("catalog_item_id").references(() => catalogItems.id, {
      onDelete: "set null",
    }),
    kind: listingKind("kind").notNull().default("product"),
    title: text("title").notNull(),
    description: text("description"),
    // Prices are stored in laari (1 MVR = 100 laari) to avoid float rounding.
    priceLaari: integer("price_laari").notNull(),
    // Optional "was" price shown crossed out on specials.
    compareAtLaari: integer("compare_at_laari"),
    unit: text("unit"),
    imageUrls: text("image_urls").array().notNull().default([]),
    inStock: boolean("in_stock").notNull().default(true),
    isActive: boolean("is_active").notNull().default(true),
    specialUntil: timestamp("special_until", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("listings_shop_idx").on(t.shopId),
    index("listings_category_idx").on(t.categoryId),
    index("listings_catalog_idx").on(t.catalogItemId),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: serial("number").notNull().unique(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => users.id),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id),
    status: orderStatus("status").notNull().default("pending"),
    fulfilment: fulfilment("fulfilment").notNull(),
    deliveryAddress: text("delivery_address"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerNote: text("customer_note"),
    sellerNote: text("seller_note"),
    paymentMethod: paymentMethod("payment_method").notNull(),
    receiptUrl: text("receipt_url"),
    paymentReceived: boolean("payment_received").notNull().default(false),
    subtotalLaari: integer("subtotal_laari").notNull(),
    deliveryFeeLaari: integer("delivery_fee_laari").notNull().default(0),
    totalLaari: integer("total_laari").notNull(),
    ...timestamps,
  },
  (t) => [index("orders_customer_idx").on(t.customerId), index("orders_shop_idx").on(t.shopId)],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
  // Snapshots so the order stays correct if the listing changes later.
  title: text("title").notNull(),
  priceLaari: integer("price_laari").notNull(),
  quantity: integer("quantity").notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type CatalogItem = typeof catalogItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type ShopType = (typeof shopType.enumValues)[number];
export type ListingKind = (typeof listingKind.enumValues)[number];
export type Fulfilment = (typeof fulfilment.enumValues)[number];
export type PaymentMethod = (typeof paymentMethod.enumValues)[number];
