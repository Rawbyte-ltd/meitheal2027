import { townlands } from "@/lib/townlands";
const KIND_EN: Record<string, string> = { city: "City", town: "Town", village: "Village" };
export const dynamic = "force-dynamic";
export function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  // A town has no electoral division; `ed` says "Town" or "Village" instead, which is what the app (0.2.1) shows there.
  return Response.json(townlands().search(q.slice(0, 60)).map(t => ({ en: t.en, ga: t.ga, co: t.co, slug: t.slug, kind: t.kind, ed: t.kind === "townland" ? t.ed : KIND_EN[t.kind] })), { headers: { "Cache-Control": "public, max-age=3600" } });
}
