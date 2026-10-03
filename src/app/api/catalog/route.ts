import { getCurrentUser } from "@/lib/auth";
import { searchCatalog } from "@/lib/queries";

/** Catalogue suggestions for the listing form. */
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return Response.json([], { status: 401 });
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) ?? "";
  if (q.length < 3) return Response.json([]);
  return Response.json(await searchCatalog(q, 6));
}
