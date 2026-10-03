"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { catalogItems, listings, reports, shops } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/sms";
import { field, isUuid } from "@/lib/validate";

export async function setShopStatus(form: FormData) {
  await requireAdmin();
  const id = field(form, "shopId") ?? "";
  const status = field(form, "status");
  if (!isUuid(id) || (status !== "approved" && status !== "suspended" && status !== "pending")) return;

  const [shop] = await db.update(shops).set({ status }).where(eq(shops.id, id)).returning();
  if (shop && status === "approved") {
    await notify(shop.phone, `Good news! ${shop.name} is now live on Milandhoo Market. Customers can see your listings.`);
  }
  revalidatePath("/admin");
}

export async function resolveReport(form: FormData) {
  await requireAdmin();
  const id = field(form, "reportId") ?? "";
  if (!isUuid(id)) return;
  const [report] = await db.update(reports).set({ resolved: true }).where(eq(reports.id, id)).returning();
  if (report && field(form, "hideListing") === "1") {
    await db.update(listings).set({ isActive: false }).where(eq(listings.id, report.listingId));
  }
  revalidatePath("/admin");
}

export async function addCatalogItem(form: FormData) {
  await requireAdmin();
  const name = field(form, "name", 100);
  if (!name) return;
  const categoryId = Number(field(form, "categoryId"));
  await db.insert(catalogItems).values({
    name,
    brand: field(form, "brand", 60),
    size: field(form, "size", 30),
    categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null,
  });
  revalidatePath("/admin");
}
