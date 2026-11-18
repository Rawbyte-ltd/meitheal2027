import { createHash } from "node:crypto";
import { origin, redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const fd = await req.formData(); const pw = String(fd.get("password") ?? ""), to = String(fd.get("to") ?? "/");
  const want = process.env.SITE_PASSWORD ?? "";
  const safeTo = to.startsWith("/") && !to.startsWith("//") ? to : "/";
  if (!want || pw !== want) return redirectTo(req, `/gate?wrong=1&to=${encodeURIComponent(safeTo)}`);
  const tag = createHash("sha256").update(`meitheal-gate:${want}`).digest("hex").slice(0, 32);
  const headers = new Headers({ Location: new URL(safeTo, origin(req)).toString() });
  headers.append("Set-Cookie", `meitheal_gate=${tag}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax; Secure`);
  return new Response(null, { status: 303, headers });
}
