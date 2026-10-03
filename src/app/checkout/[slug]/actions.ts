"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { listings, orderItems, orders, shops, users, type Fulfilment } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatMvr } from "@/lib/money";
import { orderTotals } from "@/lib/order-rules";
import { notify } from "@/lib/sms";
import { isFile, saveImage, UploadError } from "@/lib/storage";
import { field } from "@/lib/validate";

export type PlaceOrderState = { error?: string; orderId?: string } | null;

const MAX_OPEN_ORDERS = 10;

const itemsSchema = z
  .array(z.object({ listingId: z.uuid(), quantity: z.number().int().min(1).max(99) }))
  .min(1)
  .max(50);

export async function placeOrder(_prev: PlaceOrderState, form: FormData): Promise<PlaceOrderState> {
  const user = await requireUser();

  let items: z.infer<typeof itemsSchema>;
  try {
    items = itemsSchema.parse(JSON.parse(field(form, "items", 10_000) ?? "[]"));
  } catch {
    return { error: "Your cart looks empty or invalid. Please go back to the cart." };
  }

  const [shop] = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, field(form, "shop") ?? ""))
    .limit(1);
  if (!shop || shop.status !== "approved") return { error: "This shop isn't taking orders right now." };
  if (shop.ownerId === user.id) return { error: "You can't order from your own shop." };

  const isBooking = shop.type === "guest_house";
  const fulfilment = field(form, "fulfilment") as Fulfilment;
  if (isBooking ? fulfilment !== "booking" : fulfilment !== "pickup" && fulfilment !== "delivery") {
    return { error: "Please choose pickup or delivery." };
  }
  if (fulfilment === "pickup" && !shop.offersPickup) return { error: "This shop doesn't offer pickup." };
  if (fulfilment === "delivery" && !shop.offersDelivery) return { error: "This shop doesn't deliver." };

  const deliveryAddress = field(form, "deliveryAddress", 200);
  if (fulfilment === "delivery" && !deliveryAddress) return { error: "Please enter a delivery address." };

  const paymentMethod = field(form, "paymentMethod");
  if (paymentMethod !== "cash" && paymentMethod !== "bank_transfer") return { error: "Please choose a payment method." };
  if (paymentMethod === "bank_transfer" && !shop.acceptsBankTransfer) {
    return { error: "This shop doesn't accept bank transfers." };
  }

  const customerName = field(form, "customerName", 60);
  if (!customerName) return { error: "Please enter your name." };
  const note = field(form, "note", 500);
  if (isBooking && !note) return { error: "Please tell the guest house your dates and number of guests." };

  const [{ open }] = await db
    .select({ open: count() })
    .from(orders)
    .where(and(eq(orders.customerId, user.id), eq(orders.status, "pending")));
  if (open >= MAX_OPEN_ORDERS) {
    return { error: "You have too many orders waiting for shops. Please wait for them to be confirmed." };
  }

  // Always use current prices from the database, never the prices held in the browser.
  const ids = items.map((i) => i.listingId);
  const current = await db
    .select()
    .from(listings)
    .where(and(inArray(listings.id, ids), eq(listings.shopId, shop.id)));
  const unavailable = items.filter((i) => {
    const l = current.find((c) => c.id === i.listingId);
    return !l || !l.isActive || !l.inStock;
  });
  if (unavailable.length) {
    return {
      error: "Some items in your cart are no longer available. Please remove them from your cart and try again.",
    };
  }

  const lines = items.map((i) => {
    const l = current.find((c) => c.id === i.listingId)!;
    return { listingId: l.id, title: l.title, priceLaari: l.priceLaari, quantity: i.quantity };
  });
  const totals = orderTotals(lines, fulfilment, shop.deliveryFeeLaari);

  let receiptUrl: string | null = null;
  const receipt = form.get("receipt");
  if (paymentMethod === "bank_transfer" && isFile(receipt)) {
    try {
      receiptUrl = await saveImage(receipt, "receipts", 1600);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        customerId: user.id,
        shopId: shop.id,
        fulfilment,
        deliveryAddress: fulfilment === "delivery" ? deliveryAddress : null,
        customerName,
        customerPhone: user.phone,
        customerNote: note,
        paymentMethod,
        receiptUrl,
        ...totals,
      })
      .returning();
    await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: created.id })));
    if (!user.name) await tx.update(users).set({ name: customerName }).where(eq(users.id, user.id));
    return created;
  });

  await notify(
    shop.phone,
    `New ${isBooking ? "booking request" : "order"} #${order.number} on Milandhoo Market: ${formatMvr(order.totalLaari)} from ${customerName}. Open the app to accept it.`,
  );

  revalidatePath("/orders");
  revalidatePath("/sell");
  return { orderId: order.id };
}
