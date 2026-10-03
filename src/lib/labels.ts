import type { ListingKind, ShopType } from "@/db/schema";

export const shopTypeLabels: Record<ShopType, string> = {
  shop: "Shop",
  restaurant: "Restaurant / Café",
  guest_house: "Guest house",
  micro_business: "Home business",
};

export const listingKindLabels: Record<ListingKind, string> = {
  product: "Product",
  menu_item: "Menu item",
  room: "Room",
  service: "Service",
};

export function defaultKindForShop(type: ShopType): ListingKind {
  if (type === "restaurant") return "menu_item";
  if (type === "guest_house") return "room";
  return "product";
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "shop"
  );
}
