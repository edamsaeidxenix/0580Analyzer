import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { CartProvider } from "@/components/cart";
import { BottomNav, DesktopNav } from "@/components/nav";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Milandhoo Market", template: "%s · Milandhoo Market" },
  description:
    "Buy from Milandhoo's shops, restaurants, guest houses and home businesses. Search, compare prices and order in one place.",
  applicationName: "Milandhoo Market",
  appleWebApp: { capable: true, title: "Milandhoo Market", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#0d8576",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <CartProvider>
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
              <Link href="/" className="flex items-center gap-2 font-bold text-brand-700">
                <span className="grid size-8 place-items-center rounded-lg bg-brand-600 text-lg text-white">M</span>
                <span>Milandhoo Market</span>
              </Link>
              <div className="flex items-center gap-2">
                <DesktopNav />
                {user?.role === "admin" && (
                  <Link href="/admin" className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
                    Admin
                  </Link>
                )}
                {user ? (
                  <Link href="/account" className="rounded-lg px-2 py-1 text-sm text-gray-600 hover:bg-gray-100">
                    Account
                  </Link>
                ) : (
                  <Link href="/login" className="btn-primary px-3 py-1.5">
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-24 md:pb-10">{children}</main>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
