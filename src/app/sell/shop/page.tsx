import type { Metadata } from "next";
import Link from "next/link";
import { requireSeller } from "@/lib/auth";
import { ShopForm } from "../shop-form";

export const metadata: Metadata = { title: "Shop details" };

export default async function EditShopPage() {
  const { user, shop } = await requireSeller("/sell/shop");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/sell" className="text-sm text-brand-700">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-bold">Shop details</h1>
      <ShopForm shop={shop} defaultPhone={user.phone} />
    </div>
  );
}
