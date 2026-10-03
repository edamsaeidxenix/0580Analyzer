import type { Metadata } from "next";
import Link from "next/link";
import { getShopForOwner, requireUser } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { logoutAction } from "../login/actions";
import { NameForm } from "./name-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage(props: PageProps<"/account">) {
  const user = await requireUser("/account");
  const sp = await props.searchParams;
  const welcome = sp.welcome === "1";
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : null;
  const shop = await getShopForOwner(user.id);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{welcome ? "Welcome! 👋" : "Your account"}</h1>
      <div className="card space-y-4 p-5">
        <p className="text-sm text-gray-600">
          Signed in as <strong>{formatPhone(user.phone)}</strong>
        </p>
        <NameForm defaultName={user.name ?? ""} next={next} welcome={welcome} />
      </div>
      <div className="card divide-y divide-gray-100">
        <Link href="/orders" className="block p-4 hover:bg-gray-50">
          📦 My orders
        </Link>
        <Link href="/sell" className="block p-4 hover:bg-gray-50">
          🏪 {shop ? `Manage ${shop.name}` : "Open a shop"}
        </Link>
      </div>
      <form action={logoutAction}>
        <button className="btn-secondary w-full">Sign out</button>
      </form>
    </div>
  );
}
