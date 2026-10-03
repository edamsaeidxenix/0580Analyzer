"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart";

const items = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/cart", label: "Cart", icon: "🛒" },
  { href: "/orders", label: "Orders", icon: "📦" },
  { href: "/sell", label: "Sell", icon: "🏪" },
];

/** Bottom tab bar for phones. */
export function BottomNav() {
  const pathname = usePathname();
  const { count } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                  active ? "font-semibold text-brand-700" : "text-gray-500"
                }`}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
                {item.href === "/cart" && count > 0 && (
                  <span className="absolute top-1 left-1/2 ml-2 min-w-5 rounded-full bg-coral-500 px-1 text-center text-[10px] leading-5 font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Inline links for wider screens. */
export function DesktopNav() {
  const { count } = useCart();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.slice(1).map((item) => (
        <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
          {item.label}
          {item.href === "/cart" && count > 0 && (
            <span className="ml-1 rounded-full bg-coral-500 px-1.5 text-xs font-bold text-white">{count}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
