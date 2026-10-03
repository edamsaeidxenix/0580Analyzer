export function ShopAvatar({ name, logoUrl, size = "size-12" }: { name: string; logoUrl: string | null; size?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" className={`${size} rounded-xl object-cover`} />;
  }
  return (
    <div className={`${size} grid place-items-center rounded-xl bg-brand-100 text-lg font-bold text-brand-700`}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
