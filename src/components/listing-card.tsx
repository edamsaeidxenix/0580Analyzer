import Link from "next/link";
import { formatMvr } from "@/lib/money";
import type { ListingCard as ListingCardData } from "@/lib/queries";

export function ListingImage({
  src,
  alt,
  icon,
  className = "",
}: {
  src: string | null | undefined;
  alt: string;
  icon: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- images are already resized on upload
    return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
  }
  return (
    <div className={`grid place-items-center bg-gradient-to-br from-brand-50 to-brand-100 ${className}`} aria-hidden>
      <span className="text-4xl">{icon}</span>
    </div>
  );
}

export function isSpecial(specialUntil: Date | null) {
  return specialUntil != null && specialUntil.getTime() > Date.now();
}

export function Price({
  priceLaari,
  compareAtLaari,
  unit,
  large = false,
}: {
  priceLaari: number;
  compareAtLaari?: number | null;
  unit?: string | null;
  large?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-bold text-gray-900 ${large ? "text-2xl" : "text-base"}`}>{formatMvr(priceLaari)}</span>
      {compareAtLaari != null && compareAtLaari > priceLaari && (
        <span className="text-sm text-gray-400 line-through">{formatMvr(compareAtLaari)}</span>
      )}
      {unit && <span className="text-xs text-gray-500">{unit}</span>}
    </div>
  );
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const special = isSpecial(listing.specialUntil);
  return (
    <Link
      href={`/l/${listing.id}`}
      className="card group flex flex-col overflow-hidden transition hover:border-brand-500 hover:shadow-sm"
    >
      <div className="relative">
        <ListingImage
          src={listing.imageUrls[0]}
          alt={listing.title}
          icon={listing.categoryIcon}
          className="aspect-square w-full"
        />
        {special && (
          <span className="absolute top-2 left-2 rounded-full bg-coral-500 px-2 py-0.5 text-xs font-bold text-white">
            Today&apos;s special
          </span>
        )}
        {!listing.inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-gray-900/70 py-1 text-center text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-gray-900">{listing.title}</h3>
        <Price priceLaari={listing.priceLaari} compareAtLaari={listing.compareAtLaari} unit={listing.unit} />
        <p className="mt-auto truncate text-xs text-gray-500">{listing.shopName}</p>
        {listing.catalogItemId && listing.offerCount > 1 && (
          <p className="text-xs font-medium text-brand-700">Compare {listing.offerCount} shops →</p>
        )}
      </div>
    </Link>
  );
}

export function ListingGrid({ listings, empty }: { listings: ListingCardData[]; empty?: React.ReactNode }) {
  if (listings.length === 0) {
    return <div className="card p-8 text-center text-sm text-gray-500">{empty ?? "Nothing here yet."}</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
