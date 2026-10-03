"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/forms";
import { ImagePicker } from "@/components/image-picker";
import type { Shop } from "@/db/schema";
import { shopTypeLabels } from "@/lib/labels";
import { laariToInput } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { saveShop } from "./actions";

export function ShopForm({ shop, defaultPhone }: { shop?: Shop; defaultPhone: string }) {
  const [state, action] = useActionState(saveShop, null);
  const [delivery, setDelivery] = useState(shop?.offersDelivery ?? false);
  const [bank, setBank] = useState(shop?.acceptsBankTransfer ?? false);

  return (
    <form action={action} className="space-y-4">
      <section className="card space-y-3 p-4">
        <label className="block">
          <span className="label">Shop name</span>
          <input name="name" defaultValue={shop?.name} required maxLength={60} className="input" />
        </label>
        <label className="block">
          <span className="label">Type of business</span>
          <select name="type" defaultValue={shop?.type ?? "shop"} className="input">
            {Object.entries(shopTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">Short description</span>
          <textarea
            name="description"
            defaultValue={shop?.description ?? ""}
            rows={2}
            maxLength={300}
            placeholder="What do you sell?"
            className="input"
          />
        </label>
        <ImagePicker
          name="logo"
          label="Logo or shop photo (optional)"
          existing={shop?.logoUrl ? [shop.logoUrl] : []}
          max={1}
        />
      </section>

      <section className="card space-y-3 p-4">
        <label className="block">
          <span className="label">Phone for orders (Viber / SMS)</span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            defaultValue={formatPhone(shop?.phone ?? defaultPhone)}
            required
            className="input"
          />
          <span className="mt-1 block text-xs text-gray-500">New-order alerts are sent to this number.</span>
        </label>
        <label className="block">
          <span className="label">Location</span>
          <input name="address" defaultValue={shop?.address ?? ""} maxLength={120} placeholder="e.g. Near the harbour" className="input" />
        </label>
        <label className="block">
          <span className="label">Opening hours</span>
          <input
            name="openingHours"
            defaultValue={shop?.openingHours ?? ""}
            maxLength={120}
            placeholder="e.g. 8am – 11pm, closed Friday prayer"
            className="input"
          />
        </label>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Orders</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="offersPickup" defaultChecked={shop?.offersPickup ?? true} className="size-4 accent-brand-600" />
          Customers can pick up
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="offersDelivery"
            checked={delivery}
            onChange={(e) => setDelivery(e.target.checked)}
            className="size-4 accent-brand-600"
          />
          I deliver on the island
        </label>
        {delivery && (
          <label className="block pl-6">
            <span className="label">Delivery fee (MVR, 0 for free)</span>
            <input
              name="deliveryFee"
              inputMode="decimal"
              defaultValue={laariToInput(shop?.deliveryFeeLaari ?? 0)}
              className="input max-w-40"
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptsBankTransfer"
            checked={bank}
            onChange={(e) => setBank(e.target.checked)}
            className="size-4 accent-brand-600"
          />
          I accept bank transfer
        </label>
        {bank && (
          <label className="block pl-6">
            <span className="label">Bank account details shown to customers</span>
            <textarea
              name="bankDetails"
              defaultValue={shop?.bankDetails ?? ""}
              rows={2}
              maxLength={200}
              placeholder="BML 7730000123456 – Account name"
              required
              className="input"
            />
          </label>
        )}
        <p className="text-xs text-gray-500">Cash on delivery / pay at pickup is always available.</p>
      </section>

      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">
        {shop ? "Save changes" : "Create my shop"}
      </SubmitButton>
    </form>
  );
}
