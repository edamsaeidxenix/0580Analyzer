import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : "/";
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto max-w-sm space-y-6 pt-6">
      <div>
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="text-sm text-gray-600">Use your phone number to order, track orders and sell.</p>
      </div>
      <div className="card p-5">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
