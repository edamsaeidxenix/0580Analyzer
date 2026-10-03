"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Please wait…",
  className = "btn-primary",
  name,
  value,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} name={name} value={value}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: { error?: string; message?: string } | null | undefined }) {
  if (state?.error) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state?.message) {
    return <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">{state.message}</p>;
  }
  return null;
}

/** A submit button that asks for confirmation first. */
export function ConfirmButton({
  children,
  message,
  className = "btn-danger",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
