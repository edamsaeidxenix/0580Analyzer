"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { field, type ActionState } from "@/lib/validate";

export async function updateName(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser("/account");
  const name = field(form, "name", 60);
  if (!name || name.length < 2) return { error: "Please enter your name." };

  await db.update(users).set({ name }).where(eq(users.id, user.id));

  const next = field(form, "next");
  if (next && next.startsWith("/") && !next.startsWith("//")) redirect(next);
  revalidatePath("/account");
  return { message: "Saved." };
}
