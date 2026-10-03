"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { categories, listings, orders, shops, shopType, type OrderStatus } from "@/db/schema";
import { getShopForOwner, requireSeller, requireUser } from "@/lib/auth";
import { slugify } from "@/lib/labels";
import { formatMvr, parseMvr } from "@/lib/money";
import { canTransition, statusLabels } from "@/lib/order-rules";
import { normalizePhone } from "@/lib/phone";
import { notify } from "@/lib/sms";
import { isFile, saveImage, UploadError } from "@/lib/storage";
import { field, isUuid, type ActionState } from "@/lib/validate";

const MAX_IMAGES = 5;
const SPECIAL_HOURS = 24;

async function uniqueSlug(name: string, excludeShopId?: string) {
  const base = slugify(name);
  for (let i = 0; i < 50; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const [taken] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(excludeShopId ? and(eq(shops.slug, slug), ne(shops.id, excludeShopId)) : eq(shops.slug, slug));
    if (!taken) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function saveShop(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("/sell");
  const existing = await getShopForOwner(user.id);

  const name = field(form, "name", 60);
  if (!name || name.length < 2) return { error: "Please enter your shop name." };
  const type = field(form, "type") as (typeof shopType.enumValues)[number];
  if (!shopType.enumValues.includes(type)) return { error: "Please choose a business type." };
  const phone = normalizePhone(field(form, "phone") ?? "");
  if (!phone) return { error: "Enter a valid Maldivian mobile number for orders." };

  const offersPickup = form.get("offersPickup") === "on";
  const offersDelivery = form.get("offersDelivery") === "on";
  if (!offersPickup && !offersDelivery && type !== "guest_house") {
    return { error: "Choose pickup, delivery, or both." };
  }
  const deliveryFeeLaari = offersDelivery ? parseMvr(field(form, "deliveryFee") ?? "0") : 0;
  if (deliveryFeeLaari == null) return { error: "Delivery fee must be a number, e.g. 10 or 12.50." };
  const acceptsBankTransfer = form.get("acceptsBankTransfer") === "on";
  const bankDetails = acceptsBankTransfer ? field(form, "bankDetails", 200) : null;
  if (acceptsBankTransfer && !bankDetails) return { error: "Add your bank account details, or untick bank transfer." };

  let logoUrl = existing?.logoUrl ?? null;
  if (!form.getAll("keepImages").includes(logoUrl ?? "")) logoUrl = null;
  const logo = form.get("logo");
  if (isFile(logo)) {
    try {
      logoUrl = await saveImage(logo, "logos", 400);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  const values = {
    name,
    type,
    phone,
    description: field(form, "description", 300),
    address: field(form, "address", 120),
    openingHours: field(form, "openingHours", 120),
    offersPickup,
    offersDelivery,
    deliveryFeeLaari,
    acceptsBankTransfer,
    bankDetails,
    logoUrl,
  };

  if (existing) {
    await db.update(shops).set(values).where(eq(shops.id, existing.id));
    revalidatePath(`/s/${existing.slug}`);
    revalidatePath("/sell");
    return { message: "Shop details saved." };
  }

  await db.insert(shops).values({ ...values, ownerId: user.id, slug: await uniqueSlug(name) });
  redirect("/sell?created=1");
}

/** Reads and validates the listing form shared by create and edit. */
async function parseListingForm(form: FormData) {
  const title = field(form, "title", 100);
  if (!title || title.length < 2) return { error: "Please enter a title." } as const;
  const priceLaari = parseMvr(field(form, "price") ?? "");
  if (priceLaari == null || priceLaari <= 0) return { error: "Enter a price in MVR, e.g. 25 or 12.50." } as const;
  const categoryId = Number(field(form, "categoryId"));
  const [category] = Number.isInteger(categoryId)
    ? await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId))
    : [];
  if (!category) return { error: "Please choose a category." } as const;

  const catalogRaw = field(form, "catalogItemId");
  const catalogItemId = catalogRaw ? Number(catalogRaw) : null;
  const kind = field(form, "kind");
  const wasPrice = field(form, "compareAt");
  const compareAtLaari = wasPrice ? parseMvr(wasPrice) : null;
  if (wasPrice && compareAtLaari == null) return { error: "The 'was' price must be a number." } as const;

  return {
    values: {
      title,
      priceLaari,
      categoryId,
      catalogItemId: Number.isInteger(catalogItemId) ? catalogItemId : null,
      kind: (["product", "menu_item", "room", "service"] as const).find((k) => k === kind) ?? "product",
      description: field(form, "description", 1000),
      unit: field(form, "unit", 30),
      compareAtLaari: compareAtLaari && compareAtLaari > priceLaari ? compareAtLaari : null,
      inStock: form.get("inStock") === "on",
      specialUntil:
        form.get("special") === "on" ? new Date(Date.now() + SPECIAL_HOURS * 60 * 60_000) : null,
    },
  } as const;
}

async function collectImages(form: FormData, keep: string[]) {
  const kept = form.getAll("keepImages").filter((v): v is string => typeof v === "string" && keep.includes(v));
  const files = form.getAll("images").filter(isFile);
  if (kept.length + files.length > MAX_IMAGES) throw new UploadError(`Up to ${MAX_IMAGES} photos per listing.`);
  const uploaded = [];
  for (const file of files) uploaded.push(await saveImage(file, "listings"));
  return [...kept, ...uploaded];
}

export async function createListing(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { shop } = await requireSeller();
  const parsed = await parseListingForm(form);
  if ("error" in parsed) return { error: parsed.error };

  let imageUrls: string[];
  try {
    imageUrls = await collectImages(form, []);
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  await db.insert(listings).values({ ...parsed.values, shopId: shop.id, imageUrls });
  revalidatePath("/sell/listings");
  revalidatePath("/");
  redirect(form.get("another") === "1" ? "/sell/listings/new?added=1" : "/sell/listings?added=1");
}

export async function updateListing(_prev: ActionState, form: FormData): Promise<ActionState> {
  const { shop } = await requireSeller();
  const id = field(form, "id") ?? "";
  const [listing] = isUuid(id)
    ? await db.select().from(listings).where(and(eq(listings.id, id), eq(listings.shopId, shop.id)))
    : [];
  if (!listing) return { error: "Listing not found." };

  const parsed = await parseListingForm(form);
  if ("error" in parsed) return { error: parsed.error };

  let imageUrls: string[];
  try {
    imageUrls = await collectImages(form, listing.imageUrls);
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  // Keep an existing special running unless the seller unticks it.
  const specialUntil =
    parsed.values.specialUntil && listing.specialUntil && listing.specialUntil > new Date()
      ? listing.specialUntil
      : parsed.values.specialUntil;

  await db
    .update(listings)
    .set({ ...parsed.values, specialUntil, imageUrls })
    .where(eq(listings.id, listing.id));
  revalidatePath(`/l/${listing.id}`);
  revalidatePath("/sell/listings");
  redirect("/sell/listings?saved=1");
}

/** One-tap toggles from the listings page. */
export async function quickUpdateListing(form: FormData) {
  const { shop } = await requireSeller();
  const id = field(form, "id") ?? "";
  if (!isUuid(id)) return;
  const op = field(form, "op");

  const changes =
    op === "in_stock"
      ? { inStock: true }
      : op === "out_of_stock"
        ? { inStock: false }
        : op === "special_on"
          ? { specialUntil: new Date(Date.now() + SPECIAL_HOURS * 60 * 60_000) }
          : op === "special_off"
            ? { specialUntil: null }
            : op === "show"
              ? { isActive: true }
              : op === "hide"
                ? { isActive: false }
                : op === "refresh"
                  ? { updatedAt: new Date() }
                  : null;
  if (!changes) return;

  await db
    .update(listings)
    .set(changes)
    .where(and(eq(listings.id, id), eq(listings.shopId, shop.id)));
  revalidatePath("/sell/listings");
  revalidatePath(`/l/${id}`);
}

export async function deleteListing(form: FormData) {
  const { shop } = await requireSeller();
  const id = field(form, "id") ?? "";
  if (!isUuid(id)) return;
  await db.delete(listings).where(and(eq(listings.id, id), eq(listings.shopId, shop.id)));
  revalidatePath("/sell/listings");
  redirect("/sell/listings?deleted=1");
}

export async function updateOrderStatus(form: FormData) {
  const { shop } = await requireSeller();
  const id = field(form, "orderId") ?? "";
  if (!isUuid(id)) return;
  const to = field(form, "status") as OrderStatus;
  const sellerNote = field(form, "sellerNote", 300);

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, id), eq(orders.shopId, shop.id)));
  if (!order || !canTransition("seller", order.status, to, order.fulfilment)) return;

  const updated = await db
    .update(orders)
    .set({ status: to, ...(sellerNote ? { sellerNote } : {}) })
    .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
    .returning({ id: orders.id });

  if (updated.length) {
    const label = order.fulfilment === "booking" && to === "confirmed" ? "Booking confirmed" : statusLabels[to];
    await notify(
      order.customerPhone,
      `${shop.name} – order #${order.number} (${formatMvr(order.totalLaari)}): ${label}.${sellerNote ? ` "${sellerNote}"` : ""}`,
    );
  }
  revalidatePath(`/sell/orders/${order.id}`);
  revalidatePath("/sell/orders");
  revalidatePath("/sell");
}

export async function setPaymentReceived(form: FormData) {
  const { shop } = await requireSeller();
  const id = field(form, "orderId") ?? "";
  if (!isUuid(id)) return;
  await db
    .update(orders)
    .set({ paymentReceived: form.get("received") === "1" })
    .where(and(eq(orders.id, id), eq(orders.shopId, shop.id)));
  revalidatePath(`/sell/orders/${id}`);
}
