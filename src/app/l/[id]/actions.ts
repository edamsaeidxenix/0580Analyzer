"use server";

import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { listings, reports } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { field, isUuid, type ActionState } from "@/lib/validate";

export async function reportListing(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to report a listing." };

  const listingId = field(form, "listingId") ?? "";
  const reason = field(form, "reason", 200);
  if (!isUuid(listingId) || !reason) return { error: "Please choose a reason." };

  const [listing] = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId));
  if (!listing) return { error: "Listing not found." };

  const dayAgo = new Date(Date.now() - 24 * 60 * 60_000);
  const [already] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.listingId, listingId), eq(reports.reporterId, user.id), gt(reports.createdAt, dayAgo)));
  if (!already) await db.insert(reports).values({ listingId, reporterId: user.id, reason });

  return { message: "Thanks — an admin will review this listing." };
}
