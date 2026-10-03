/** Prices are stored as integer laari (1 MVR = 100 laari). */

export function formatMvr(laari: number): string {
  const mvr = laari / 100;
  const text = Number.isInteger(mvr)
    ? mvr.toLocaleString("en-US")
    : mvr.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `MVR ${text}`;
}

/** Parses user input such as "25", "25.5" or "1,250.00" into laari. */
export function parseMvr(input: string): number | null {
  const cleaned = input.replace(/mvr|rf|,|\s/gi, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** Converts laari back to an input-friendly string ("25" or "25.50"). */
export function laariToInput(laari: number | null | undefined): string {
  if (laari == null) return "";
  return laari % 100 === 0 ? String(laari / 100) : (laari / 100).toFixed(2);
}
