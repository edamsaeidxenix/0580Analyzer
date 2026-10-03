"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { canTransition } from "@/lib/order-rules";
import { notify } from "@/lib/sms";
import { isFile, saveImage, UploadError } from "@/lib/storage";
import { field, isUuid } from "@/lib/validate";

async function ownOrder(form: FormData) {
  const user = await requireUser("/orders");
  const orderId = field(form, "orderId") ?? "";
  if (!isUuid(orderId)) throw new Error("Order not found");
  const [row] = await db
    .select({ order: orders, shopPhone: shops.phone })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(and(eq(orders.id, orderId), eq(orders.customerId, user.id)));
  if (!row) throw new Error("Order not found");
  return row;
}

export async function cancelOrder(form: FormData) {
  const { order, shopPhone } = await ownOrder(form);
  if (!canTransition("customer", order.status, "cancelled", order.fulfilment)) return;

  // Guard on the current status so a seller accepting at the same moment wins.
  const updated = await db
    .update(orders)
    .set({ status: "cancelled" })
    .where(and(eq(orders.id, order.id), eq(orders.status, order.status)))
    .returning({ id: orders.id });
  if (updated.length) await notify(shopPhone, `Order #${order.number} was cancelled by the customer.`);
  revalidatePath(`/orders/${order.id}`);
}

export async function uploadReceipt(form: FormData) {
  const { order, shopPhone } = await ownOrder(form);
  const file = form.get("receipt");
  if (order.paymentMethod !== "bank_transfer" || !isFile(file)) return;

  try {
    const receiptUrl = await saveImage(file, "receipts", 1600);
    await db.update(orders).set({ receiptUrl }).where(eq(orders.id, order.id));
    await notify(shopPhone, `Order #${order.number}: the customer uploaded a transfer receipt.`);
  } catch (err) {
    if (!(err instanceof UploadError)) throw err;
  }
  revalidatePath(`/orders/${order.id}`);
}
