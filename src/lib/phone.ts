/**
 * Maldivian phone numbers are 7 digits. Mobile numbers start with 7 or 9
 * (Dhiraagu / Ooredoo). We store everything as E.164: +960XXXXXXX.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.length === 10 && digits.startsWith("960")) digits = digits.slice(3);
  if (!/^[79]\d{6}$/.test(digits)) return null;
  return `+960${digits}`;
}

/** +9607771234 -> 777-1234 */
export function formatPhone(e164: string): string {
  const local = e164.startsWith("+960") ? e164.slice(4) : e164;
  return local.length === 7 ? `${local.slice(0, 3)}-${local.slice(3)}` : e164;
}
