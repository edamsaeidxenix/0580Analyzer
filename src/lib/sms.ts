/**
 * Sends SMS through the configured provider. "console" prints messages to the
 * server log and is meant for development only.
 */
export function smsProvider(): "console" | "twilio" {
  return process.env.SMS_PROVIDER === "twilio" ? "twilio" : "console";
}

export function isDevSms(): boolean {
  return smsProvider() === "console" && process.env.NODE_ENV !== "production";
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (smsProvider() === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (!sid || !token || !from) throw new Error("Twilio is not configured");

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    if (!res.ok) throw new Error(`SMS failed: ${res.status} ${await res.text()}`);
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMS_PROVIDER=console cannot be used in production");
  }
  console.log(`[sms] to ${to}: ${body}`);
}

/** Best-effort notification: never fails the caller's request. */
export async function notify(to: string, body: string): Promise<void> {
  try {
    await sendSms(to, body);
  } catch (err) {
    console.error("[sms] notification failed", err);
  }
}
