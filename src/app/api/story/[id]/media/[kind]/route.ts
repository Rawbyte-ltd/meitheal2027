import { one } from "@/lib/db";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

/** Convenience for clients: the first recording or photo of an approved story, by redirect. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (kind !== "audio" && kind !== "photo") return new Response("audio or photo", { status: 400 });
  const m = await one<{ id: number }>("SELECT m.id FROM media m JOIN stories s ON s.id = m.story_id WHERE s.id = $1 AND s.status = 'approved' AND m.kind = $2 ORDER BY m.id LIMIT 1", [id, kind]);
  if (!m) return new Response("None", { status: 404 });
  return redirectTo(req, `/api/media/${m.id}`, 302);
}
