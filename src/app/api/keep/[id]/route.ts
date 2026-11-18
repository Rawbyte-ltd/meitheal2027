import { one } from "@/lib/db";
import { getDict } from "@/lib/lang";
import { removeStory } from "@/lib/remove";
import { sha256 } from "@/lib/token";
import { saveFamily } from "@/lib/transcript";
export const dynamic = "force-dynamic";

const keeper = async (id: string, k: unknown) => {
  const r = await one<{ secret_hash: string }>("SELECT secret_hash FROM stories WHERE id = $1", [id]);
  return !!r && typeof k === "string" && sha256(k) === r.secret_hash;
};

/** The family's own controls: delete (remove) their story with the keeper secret. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const k = new URL(req.url).searchParams.get("k") ?? "";
  if (!(await keeper(id, k))) return Response.json({ error: "Wrong link" }, { status: 403 });
  try { await removeStory(id); } catch (e) { console.error("keep: remove", id, e); return Response.json({ error: (await getDict()).t.keep.removeFailed }, { status: 503 }); }
  return Response.json({ ok: true });
}

/** The family saves the written-out text of their recording: { k, text }. It is public only once a person has read it. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => null) as { k?: unknown; text?: unknown } | null;
  if (!b || !(await keeper(id, b.k))) return Response.json({ error: "Wrong link" }, { status: 403 });
  const r = await saveFamily(id, b.text);
  if (r.ok) return Response.json({ ok: true });
  const { t } = await getDict();
  return Response.json({ error: t.keep.trErrors[r.error] }, { status: r.error === "closed" ? 409 : 400 });
}
