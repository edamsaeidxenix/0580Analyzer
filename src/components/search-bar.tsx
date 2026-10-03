export function SearchBar({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" role="search" className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" aria-hidden>
        🔍
      </span>
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Search Milo, cake, fried rice, phone charger…"
        aria-label="Search products"
        className="input rounded-full py-3 pl-10"
      />
    </form>
  );
}
