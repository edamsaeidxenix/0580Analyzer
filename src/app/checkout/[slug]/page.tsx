import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage(props: PageProps<"/checkout/[slug]">) {
  const { slug } = await props.params;
  const user = await requireUser(`/checkout/${slug}`);
  const [shop] = await db.select().from(shops).where(eq(shops.slug, slug)).limit(1);
  if (!shop || shop.status !== "approved") notFound();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">{shop.type === "guest_house" ? "Booking request" : "Checkout"}</h1>
      <CheckoutForm
        shop={{
          slug: shop.slug,
          name: shop.name,
          type: shop.type,
          offersPickup: shop.offersPickup,
          offersDelivery: shop.offersDelivery,
          deliveryFeeLaari: shop.deliveryFeeLaari,
          acceptsBankTransfer: shop.acceptsBankTransfer,
          bankDetails: shop.bankDetails,
          address: shop.address,
        }}
        defaultName={user.name ?? ""}
        isOwnShop={shop.ownerId === user.id}
      />
    </div>
  );
}
