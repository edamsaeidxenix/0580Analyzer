import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { otpCodes, sessions, shops, users, type User } from "@/db/schema";
import { isDevSms, sendSms } from "./sms";

const SESSION_COOKIE = "mm_session";
const SESSION_DAYS = 60;
const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_SENDS = 3;
const OTP_SEND_WINDOW_MINUTES = 15;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || (process.env.NODE_ENV === "production" && value === "change-me")) {
    throw new Error("AUTH_SECRET must be set");
  }
  return value;
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hashCode = (phone: string, code: string) => sha256(`${secret()}:${phone}:${code}`);

export type OtpRequestResult = { ok: true; devCode?: string } | { ok: false; error: string };

export async function requestOtp(phone: string): Promise<OtpRequestResult> {
  const windowStart = new Date(Date.now() - OTP_SEND_WINDOW_MINUTES * 60_000);
  const recent = await db
    .select({ id: otpCodes.id })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, windowStart)));
  if (recent.length >= OTP_MAX_SENDS) {
    return { ok: false, error: "Too many codes requested. Please wait 15 minutes and try again." };
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({
    phone,
    codeHash: hashCode(phone, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
  });

  try {
    await sendSms(phone, `Your Milandhoo Market code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`);
  } catch (err) {
    console.error("[auth] failed to send code", err);
    return { ok: false, error: "We couldn't send the SMS. Please try again shortly." };
  }

  return { ok: true, devCode: isDevSms() ? code : undefined };
}

export async function verifyOtp(phone: string, code: string): Promise<User | null> {
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(
      and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt), gt(otpCodes.expiresAt, new Date())),
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) return null;

  await db
    .update(otpCodes)
    .set({ attempts: otp.attempts + 1 })
    .where(eq(otpCodes.id, otp.id));

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(phone, code.trim()), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));

  const isAdmin = (process.env.ADMIN_PHONES ?? "")
    .split(",")
    .map((p) => p.trim())
    .includes(phone);

  const [user] = await db
    .insert(users)
    .values({ phone, role: isAdmin ? "admin" : "user" })
    .onConflictDoUpdate({
      target: users.phone,
      set: isAdmin ? { role: "admin" } : { updatedAt: new Date() },
    })
    .returning();
  return user;
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Cached for the duration of a request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row?.user ?? null;
});

export async function requireUser(next = "/"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export const getShopForOwner = cache(async (ownerId: string) => {
  const [shop] = await db.select().from(shops).where(eq(shops.ownerId, ownerId)).limit(1);
  return shop ?? null;
});

/** Signed-in user plus their shop; sends them to shop registration if they have none. */
export async function requireSeller(next = "/sell") {
  const user = await requireUser(next);
  const shop = await getShopForOwner(user.id);
  if (!shop) redirect("/sell/register");
  return { user, shop };
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (user.role !== "admin") redirect("/");
  return user;
}
