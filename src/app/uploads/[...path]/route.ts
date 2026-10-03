import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

/** Serves images saved by the "local" storage driver. */
export async function GET(_request: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const parts = (await ctx.params).path;
  const target = path.resolve(LOCAL_UPLOAD_DIR, ...parts);
  if (!target.startsWith(LOCAL_UPLOAD_DIR + path.sep) || !target.endsWith(".webp")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readFile(target);
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
