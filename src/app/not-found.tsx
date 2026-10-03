import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-4 pt-10 text-center">
      <p className="text-5xl">🏝️</p>
      <h1 className="text-xl font-bold">Page not found</h1>
      <p className="text-sm text-gray-600">This item or shop may have been removed.</p>
      <Link href="/" className="btn-primary">
        Back to the market
      </Link>
    </div>
  );
}
