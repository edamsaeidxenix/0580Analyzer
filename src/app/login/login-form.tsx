"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/forms";
import { formatPhone } from "@/lib/phone";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(loginAction, { step: "phone" });

  if (state.step === "phone") {
    return (
      <form action={action} className="space-y-4">
        <input type="hidden" name="intent" value="send" />
        <label className="block">
          <span className="label">Mobile number</span>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-600">+960</span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="7XX XXXX"
              defaultValue={state.phone ? formatPhone(state.phone) : ""}
              required
              autoFocus
              className="input"
            />
          </div>
        </label>
        <FormMessage state={state} />
        <SubmitButton className="btn-primary w-full" pendingText="Sending code…">
          Send me a code
        </SubmitButton>
        <p className="text-xs text-gray-500">We&apos;ll send a 6-digit code by SMS. No password needed.</p>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="phone" value={state.phone ?? ""} />
      <p className="text-sm text-gray-600">
        Enter the code we sent to <strong>{state.phone && formatPhone(state.phone)}</strong>.
      </p>
      {state.devCode && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Development mode — no SMS sent. Your code is <strong>{state.devCode}</strong>.
        </p>
      )}
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        placeholder="123456"
        required
        autoFocus
        className="input text-center text-2xl tracking-[0.4em]"
      />
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Checking…" name="intent" value="verify">
        Sign in
      </SubmitButton>
      <div className="flex justify-between text-sm">
        <button name="intent" value="change" formNoValidate className="text-gray-600 underline">
          Change number
        </button>
        <button name="intent" value="resend" formNoValidate className="text-brand-700 underline">
          Send a new code
        </button>
      </div>
    </form>
  );
}
