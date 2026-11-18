import { readMedia } from "@/lib/media";
import { canSee, deskActor } from "@/lib/auth";
import { sha256 } from "@/lib/token";
export const dynamic = "force-dynamic";

/** A recording or photo. Public once the story is approved; otherwise with the keeper secret, or for someone at the desk
 *  who may see that story (signed in, or the admin key while no admin has signed in). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const u = new URL(req.url), k = u.searchParams.get("k");
  const m = await readMedia(Number(id)); if (!m) return new Response("Not found", { status: 404 });
  if (m.meta.status !== "approved" && !(k && sha256(k) === m.meta.secret_hash)) {
    const a = await deskActor(u.searchParams.get("admin"));
    if (!a || !(await canSee(a, m.meta.story_id))) return new Response("Not public", { status: 403 });
  }
  return new Response(new Uint8Array(m.body) as Uint8Array<ArrayBuffer>, { headers: { "Content-Type": m.meta.mime, "Cache-Control": m.meta.status === "approved" ? "public, max-age=300, must-revalidate" : "private, max-age=600", "Content-Length": String(m.body.byteLength) } });
}
