"use client";

import { useActionState, useEffect, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/forms";
import { ImagePicker } from "@/components/image-picker";
import type { Category, Listing, ListingKind } from "@/db/schema";
import { listingKindLabels } from "@/lib/labels";
import { laariToInput } from "@/lib/money";
import type { ActionState } from "@/lib/validate";

interface CatalogMatch {
  id: number;
  name: string;
  brand: string | null;
  size: string | null;
  categoryId: number | null;
}

const catalogLabel = (c: Pick<CatalogMatch, "name" | "size" | "brand">) =>
  [c.name, c.size].filter(Boolean).join(" · ") + (c.brand ? ` (${c.brand})` : "");

export function ListingForm({
  action: serverAction,
  categories,
  listing,
  linkedCatalog,
  defaultKind,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  categories: Category[];
  listing?: Listing;
  linkedCatalog?: CatalogMatch | null;
  defaultKind: ListingKind;
}) {
  const [state, action] = useActionState(serverAction, null);
  const [title, setTitle] = useState(listing?.title ?? "");
  const [categoryId, setCategoryId] = useState(listing ? String(listing.categoryId) : "");
  const [catalog, setCatalog] = useState<CatalogMatch | null>(linkedCatalog ?? null);
  const [matches, setMatches] = useState<CatalogMatch[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Suggest a catalogue product so the listing shows up in price comparisons.
  useEffect(() => {
    if (catalog || dismissed || title.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/catalog?q=${encodeURIComponent(title)}`, { signal: controller.signal });
        if (res.ok) setMatches(await res.json());
      } catch {
        // Ignore aborted or failed lookups; suggestions are optional.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [title, catalog, dismissed]);

  const special = listing?.specialUntil != null && listing.specialUntil > new Date();
  const showMatches = !catalog && !dismissed && title.trim().length >= 3 && matches.length > 0;

  return (
    <form action={action} className="space-y-4">
      {listing && <input type="hidden" name="id" value={listing.id} />}
      <input type="hidden" name="catalogItemId" value={catalog?.id ?? ""} />

      <section className="card space-y-3 p-4">
        <ImagePicker
          name="images"
          label="Photos"
          existing={listing?.imageUrls}
          hint="Take a photo or upload your existing poster. Up to 5 photos."
        />
        <label className="block">
          <span className="label">Title</span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            placeholder="e.g. Milo 400g, Chicken fried rice"
            className="input"
          />
        </label>

        {catalog && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            <span>
              ✅ Linked to <strong>{catalogLabel(catalog)}</strong> for price comparison
            </span>
            <button type="button" onClick={() => { setCatalog(null); setDismissed(true); }} className="text-xs underline">
              Unlink
            </button>
          </div>
        )}
        {showMatches && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-2 text-sm">
            <p className="px-1 pb-1 text-xs text-gray-600">Is it one of these? Linking lets customers compare prices.</p>
            <div className="flex flex-wrap gap-1.5">
              {matches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setCatalog(m);
                    if (!categoryId && m.categoryId) setCategoryId(String(m.categoryId));
                  }}
                >
                  {catalogLabel(m)}
                </button>
              ))}
              <button type="button" className="chip text-gray-500" onClick={() => setDismissed(true)}>
                None of these
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="label">Price (MVR)</span>
            <input
              name="price"
              inputMode="decimal"
              defaultValue={laariToInput(listing?.priceLaari)}
              required
              placeholder="25"
              className="input"
            />
          </label>
          <label className="block">
            <span className="label">Unit (optional)</span>
            <input name="unit" defaultValue={listing?.unit ?? ""} maxLength={30} placeholder="per kg, per night" className="input" />
          </label>
        </div>
        <label className="block">
          <span className="label">Category</span>
          <select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="input">
            <option value="" disabled>
              Choose…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="inStock" defaultChecked={listing?.inStock ?? true} className="size-4 accent-brand-600" />
          In stock / available
        </label>
      </section>

      <details className="card p-4" open={Boolean(listing?.description || listing?.compareAtLaari || special)}>
        <summary className="cursor-pointer text-sm font-medium">More options</summary>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="special" defaultChecked={special} className="size-4 accent-coral-500" />
            🔥 Show as today&apos;s special (24 hours on the home page)
          </label>
          <label className="block">
            <span className="label">Was price (MVR, optional)</span>
            <input
              name="compareAt"
              inputMode="decimal"
              defaultValue={laariToInput(listing?.compareAtLaari)}
              placeholder="Shown crossed out"
              className="input max-w-40"
            />
          </label>
          <label className="block">
            <span className="label">Description</span>
            <textarea name="description" defaultValue={listing?.description ?? ""} rows={3} maxLength={1000} className="input" />
          </label>
          <label className="block">
            <span className="label">Type</span>
            <select name="kind" defaultValue={listing?.kind ?? defaultKind} className="input">
              {Object.entries(listingKindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>

      <FormMessage state={state} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton className="btn-primary flex-1" pendingText="Saving…">
          {listing ? "Save changes" : "Publish"}
        </SubmitButton>
        {!listing && (
          <SubmitButton className="btn-secondary flex-1" pendingText="Saving…" name="another" value="1">
            Publish &amp; add another
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
