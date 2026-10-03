import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, shops } from "@/db/schema";

export async function getOrderWithItems(orderId: string) {
  const [row] = await db
    .select({ order: orders, shop: shops })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!row) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(asc(orderItems.title));
  return { ...row, items };
}

export async function ordersForCustomer(customerId: string) {
  return db
    .select({ order: orders, shopName: shops.name })
    .from(orders)
    .innerJoin(shops, eq(orders.shopId, shops.id))
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

export async function ordersForShop(shopId: string) {
  return db.select().from(orders).where(eq(orders.shopId, shopId)).orderBy(desc(orders.createdAt)).limit(200);
}
