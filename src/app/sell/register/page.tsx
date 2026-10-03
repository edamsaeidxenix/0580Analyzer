import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getShopForOwner, requireUser } from "@/lib/auth";
import { ShopForm } from "../shop-form";

export const metadata: Metadata = { title: "Open your shop" };

export default async function RegisterShopPage() {
  const user = await requireUser("/sell/register");
  if (await getShopForOwner(user.id)) redirect("/sell");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Open your shop</h1>
        <p className="text-sm text-gray-600">
          Free for Milandhoo sellers. Post your items once — they stay visible and searchable until you remove them.
        </p>
      </div>
      <ShopForm defaultPhone={user.phone} />
    </div>
  );
}
