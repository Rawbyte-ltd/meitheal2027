import "server-only";
import { one, q } from "./db.ts";
import { audit, canSee, type Actor } from "./auth.ts";
import { removeStory } from "./remove.ts";

/**
 * What each person at the desk may do to a story.
 *
 * Teacher "approve": publishes at once when every check came back safe (the photo and recording checks and the written
 * story's), unless AUTO_PUBLISH=off. Otherwise the story stays pending with second_look set, for a county reader or
 * the admin; the admin sees everything a teacher published under "Published without me".
 * Reader "approve": publishes (the reader is the person who read it). Admin: everything.
 * Publishing also publishes the story's written-out text as it stands (src/lib/transcript.ts).
 * "Send back": not published; the note is shown to the family on their keeper page.
 * "Book only": 'kept', printed in the class copybook and never on the website, for the rare family that asks the
 * teacher. The website is the default; there is no tick box for families. The checks only gate the website, so a
 * teacher's yes is enough. "Approve" on a kept story puts it online the usual way (a second look if a check wants one).
 */
export type Action = "approve" | "book" | "sendback" | "pending" | "feature" | "clearflags" | "remove";
const ALLOWED: Record<string, Action[]> = { teacher: ["approve", "book", "sendback"], reader: ["approve", "book", "sendback"], admin: ["approve", "book", "sendback", "pending", "feature", "clearflags", "remove"] };

const CLOSED = "This story was removed, so it can no longer be changed.";
/** Where "approve" may start from. Never from 'removed'; from 'rejected' only for the admin. */
export const APPROVE_FROM = ["pending", "kept", "approved"], APPROVE_FROM_ADMIN = [...APPROVE_FROM, "rejected"];
/** Run an UPDATE … RETURNING id; true when it changed a row. */
const changed = async (sql: string, params: unknown[]) => (await q(sql, params)).length > 0;

export const autoPublish = () => (process.env.AUTO_PUBLISH ?? "teacher") !== "off";

/** True when every check on the story and its media said "safe". A check that is off, skipped or failed is not safe. */
export async function checksSafe(id: string): Promise<boolean> {
  const s = await one<{ scan: string | null; transcript: string | null; transcript_by: string | null; transcript_scan: string | null }>("SELECT scan, transcript, transcript_by, transcript_scan FROM stories WHERE id = $1", [id]);
  if (!s?.scan?.startsWith("safe")) return false;
  // A family's written-out text has its own check (src/lib/transcript.ts); text typed at the desk is that person's own.
  if (s.transcript && s.transcript_by === "family" && !s.transcript_scan?.startsWith("safe")) return false;
  const bad = await one<{ n: number }>("SELECT count(*)::int AS n FROM media WHERE story_id = $1 AND (scan IS NULL OR scan NOT LIKE 'safe%')", [id]);
  return (bad?.n ?? 1) === 0;
}

export async function review(a: Actor, id: string, action: Action, note: string): Promise<{ ok: boolean; result: string }> {
  if (!ALLOWED[a.role]?.includes(action)) return { ok: false, result: "That is not yours to do." };
  if (!(await canSee(a, id))) return { ok: false, result: "That story is not on your desk." };
  const by = a.user?.id ?? null;
  const s = await one<{ status: string; school: string | null }>("SELECT status, school FROM stories WHERE id = $1", [id]);
  if (!s) return { ok: false, result: "No such story." };
  // A removed story is closed for good: the family was promised it, and removal has already cleared it (src/lib/remove.ts).
  // Every UPDATE below repeats the check, so a removal that lands after this page was loaded still wins.
  if (s.status === "removed") return { ok: false, result: CLOSED };
  if (action === "book") {
    if (!s.school?.trim()) return { ok: false, result: "Only a school story goes in a copybook. This one has no school." };
    // Taking a published story off the website is always allowed: it only makes it less public.
    if (!["pending", "approved", "kept"].includes(s.status)) return { ok: false, result: "That story is closed." };
    // The text the person just read goes in the book with it, as publishing does.
    if (!(await changed("UPDATE stories SET status = 'kept', book_only = true, second_look = false, reviewed_by = $2, reviewed_at = now(), review_note = NULL, note = coalesce(nullif($3, ''), note), transcript_public = transcript, updated_at = now() WHERE id = $1 AND status IN ('pending', 'approved', 'kept') RETURNING id", [id, by, note]))) return { ok: false, result: CLOSED };
    await audit(a, id, "book", note || undefined);
    return { ok: true, result: "In the class copybook, and not on the website." };
  }
  if (action === "approve") {
    // The family of a sent-back story was told it was not published; only the admin can change that.
    const from = a.role === "admin" ? APPROVE_FROM_ADMIN : APPROVE_FROM;
    if (!from.includes(s.status)) return { ok: false, result: s.status === "rejected" ? "This story was sent back to the family. Only the admin can publish it now." : CLOSED };
    if (a.role === "teacher" && !(autoPublish() && (await checksSafe(id)))) {
      // A kept story the teacher puts back online waits for the second look like any other.
      if (!(await changed("UPDATE stories SET status = 'pending', book_only = false, second_look = true, reviewed_by = $2, reviewed_at = now(), note = coalesce(nullif($3, ''), note), updated_at = now() WHERE id = $1 AND status IN ('pending', 'kept') RETURNING id", [id, by, note]))) return { ok: false, result: CLOSED };
      await audit(a, id, "approve:second_look", note || undefined);
      return { ok: true, result: "Thanks. A check wants a second person to look, so it has gone to the county reader before it is published." };
    }
    // Publishing a story publishes the written-out text the person just read with it.
    if (!(await changed("UPDATE stories SET status = 'approved', book_only = false, second_look = false, reviewed_by = $2, reviewed_at = now(), review_note = NULL, note = coalesce(nullif($3, ''), note), transcript_public = transcript, updated_at = now() WHERE id = $1 AND status = ANY($4) RETURNING id", [id, by, note, from]))) return { ok: false, result: CLOSED };
    await audit(a, id, "approve", note || undefined);
    return { ok: true, result: "Published." };
  }
  if (action === "sendback") {
    if (!(await changed("UPDATE stories SET status = 'rejected', second_look = false, reviewed_by = $2, reviewed_at = now(), review_note = nullif($3, ''), updated_at = now() WHERE id = $1 AND status <> 'removed' RETURNING id", [id, by, note]))) return { ok: false, result: CLOSED };
    await audit(a, id, "sendback", note || undefined);
    return { ok: true, result: note ? "Sent back with your note; the family will see it." : "Sent back." };
  }
  if (action === "pending") { if (!(await changed("UPDATE stories SET status = 'pending', updated_at = now() WHERE id = $1 AND status <> 'removed' RETURNING id", [id]))) return { ok: false, result: CLOSED }; }
  else if (action === "feature") { if (!(await changed("UPDATE stories SET featured = NOT featured, updated_at = now() WHERE id = $1 AND status <> 'removed' RETURNING id", [id]))) return { ok: false, result: CLOSED }; }
  else if (action === "clearflags") await q("DELETE FROM flags WHERE story_id = $1", [id]);
  else if (action === "remove") { try { await removeStory(id); } catch (e) { console.error("remove", id, e); return { ok: false, result: "Could not delete its files from storage, so nothing was removed. Try again in a minute." }; } }
  await audit(a, id, action, note || undefined);
  return { ok: true, result: action === "remove" ? "Removed, with its recordings and photos." : "Done." };
}
