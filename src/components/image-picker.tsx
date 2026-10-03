"use client";

import { useRef, useState } from "react";

const MAX_EDGE = 1600;

/** Shrinks a photo in the browser so uploads are fast on mobile data. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // Let the server handle formats the browser can't decode (e.g. HEIC).
  }
}

/**
 * File input with previews. Existing images can be removed; their URLs are
 * submitted as `keepImages` fields.
 */
export function ImagePicker({
  name,
  existing = [],
  max = 5,
  label,
  hint,
}: {
  name: string;
  existing?: string[];
  max?: number;
  label: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [kept, setKept] = useState(existing);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const picked = Array.from(input.files ?? []);
    setError(null);
    if (kept.length + picked.length > max) {
      setError(`You can add up to ${max} photo${max > 1 ? "s" : ""}.`);
      input.value = "";
      setPreviews([]);
      return;
    }
    setBusy(true);
    const files = await Promise.all(picked.map(compress));
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    previews.forEach(URL.revokeObjectURL);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    setBusy(false);
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex flex-wrap gap-2">
        {kept.map((src) => (
          <div key={src} className="relative">
            <input type="hidden" name="keepImages" value={src} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-20 rounded-xl object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => setKept((k) => k.filter((s) => s !== src))}
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-gray-900 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
        {previews.map((src) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt="" className="size-20 rounded-xl object-cover ring-2 ring-brand-500" />
        ))}
        {kept.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="grid size-20 place-items-center rounded-xl border-2 border-dashed border-gray-300 text-center text-xs text-gray-500 hover:border-brand-500"
          >
            {busy ? "…" : previews.length ? "Change" : "📷 Add"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        multiple={max > 1}
        onChange={onChange}
        className="sr-only"
        tabIndex={-1}
      />
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
