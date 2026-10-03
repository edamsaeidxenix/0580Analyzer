const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_RE.test(value);

/** Reads a trimmed text field; empty strings become null. */
export function field(form: FormData, name: string, maxLength = 2000): string | null {
  const value = form.get(name);
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed.length ? trimmed : null;
}

export type ActionState = { error?: string; message?: string } | null;
