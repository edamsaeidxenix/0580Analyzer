"use server";

import { redirect } from "next/navigation";
import { endSession, requestOtp, startSession, verifyOtp } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { field } from "@/lib/validate";

export type LoginState = {
  step: "phone" | "code";
  phone?: string;
  devCode?: string;
  error?: string;
};

/** Only allow redirects to paths on this site. */
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function loginAction(prev: LoginState, form: FormData): Promise<LoginState> {
  const intent = field(form, "intent");

  if (intent === "change") return { step: "phone", phone: prev.phone };

  if (intent === "send" || intent === "resend") {
    // "send" uses the number just typed; "resend" reuses the one we already sent to.
    const typed = field(form, "phone");
    const phone = normalizePhone((intent === "send" ? typed : (prev.phone ?? typed)) ?? "");
    if (!phone) return { step: "phone", error: "Enter a valid Maldivian mobile number (7 digits, starts with 7 or 9)." };
    const result = await requestOtp(phone);
    if (!result.ok) return { step: intent === "resend" ? "code" : "phone", phone, error: result.error };
    return { step: "code", phone, devCode: result.devCode };
  }

  // Fall back to the form field so this also works if the page's JavaScript hadn't loaded yet.
  const phone = prev.phone ?? normalizePhone(field(form, "phone") ?? "");
  const code = (field(form, "code") ?? "").replace(/\D/g, "");
  if (!phone) return { step: "phone" };
  if (code.length !== 6) return { step: "code", phone, error: "Enter the 6-digit code from the SMS." };

  const user = await verifyOtp(phone, code);
  if (!user) return { step: "code", phone, error: "That code is wrong or has expired. Try again or request a new code." };

  await startSession(user.id);
  const next = safeNext(field(form, "next"));
  redirect(user.name ? next : `/account?welcome=1&next=${encodeURIComponent(next)}`);
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}
