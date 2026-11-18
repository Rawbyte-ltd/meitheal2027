import "server-only";
import { after } from "next/server";
import { audit, canSee, type Actor } from "./auth";
import { BRIEF_TO } from "./brief";
import { one, q } from "./db";
import { escapeHtml, sendMail } from "./mail";
import { classify } from "./scan";
import { clean, PHONE } from "./stories";

/**
 * The written-out version of a story's recordings (migrations/008_transcripts.sql). Most children record rather than
 * write, and the copybook needs words, so the machine's transcript (media.transcript, made for the safety check) is
 * offered to the family as a first draft: they listen back, fix what it misheard, take out surnames, and save.
 *
 * Nothing a family types is public until someone at the desk has read it. On a story still waiting, the text is read
 * with the story and published with it. On a published story, a family's change waits in the desk's Transcripts tab
 * while the story page keeps showing the version that was read (transcript_public). Text saved at the desk is the
 * reader's own, so on a published story it goes public at once. Every saved text gets the same check as the story.
 * A story kept for the copybook only (status 'kept', src/lib/review.ts) works the same way, with the book in place of
 * the story page: transcript_public is the text the copybook prints.
 */
export const WRITERS = ["family", "teacher", "reader", "admin"] as const;
export const MAX = 20000;
export type Written = { transcript: string | null; transcript_public: string | null; transcript_by: string | null; transcript_at: string | null; transcript_scan: string | null; transcript_scan_note: string | null };
export const WRITTEN_COLS = "transcript, transcript_public, transcript_by, transcript_at, transcript_scan, transcript_scan_note";
/** The desk condition for "the family has changed the written-out text since it was read" (stories alias s). */
export const CHANGED_SQL = "s.status IN ('approved', 'kept') AND s.transcript IS DISTINCT FROM s.transcript_public";

/** Line endings, stray control characters and runs of blank lines tidied; an empty box is null. */
export const tidy = (t: unknown) => clean(t, MAX).replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim() || null;

/** The machine's text for a story: its recordings' transcripts, in order. Empty when there is none (Irish, or not made yet). */
export async function machineText(storyId: string): Promise<string> {
  const rows = await q<{ transcript: string }>("SELECT transcript FROM media WHERE story_id = $1 AND kind = 'audio' AND transcript IS NOT NULL ORDER BY id", [storyId]);
  return rows.map(r => r.transcript.trim()).filter(Boolean).join("\n\n");
}

/** Run the check on a saved text and keep its verdict, unless the text has changed again since. A published text it flags is mailed at once. */
async function check(id: string, text: string) {
  const v = await classify(text);
  try {
    const s = await one<{ title: string; status: string; transcript_public: string | null }>("UPDATE stories SET transcript_scan = $2, transcript_scan_note = $3 WHERE id = $1 AND transcript = $4 RETURNING title, status, transcript_public", [id, v.scan, v.note, text]);
    if (s && s.transcript_public === text && v.scan.startsWith("unsafe")) {
      const link = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://meitheal2027.ie").replace(/\/$/, "")}/desk?tab=${s.status === "kept" ? "kept" : "approved"}#${id}`;
      await sendMail({ to: BRIEF_TO, subject: `Meitheal: the written-out text of "${s.title}" was flagged`, text: `The check flagged a written-out text that is public (${v.scan}).\n\n${s.title}\n${v.note ?? ""}\n\n${link}`, html: `<p>The check flagged a written-out text that is public (${escapeHtml(v.scan)}).</p><p><a href="${link}"><b>${escapeHtml(s.title)}</b></a><br>${escapeHtml(v.note ?? "")}</p>` });
    }
  } catch (e) { console.error("transcript: check", id, e); }
}

export type SaveResult = { ok: true } | { ok: false; error: "closed" | "phone" | "no_audio" };

/** The family's text, from the keeper page. Allowed while the story is waiting or published, and only on a story with a recording. */
export async function saveFamily(id: string, raw: unknown): Promise<SaveResult> {
  const text = tidy(raw);
  if (text && PHONE.test(text)) return { ok: false, error: "phone" };
  const s = await one<{ status: string; audio: boolean }>("SELECT status, EXISTS (SELECT 1 FROM media m WHERE m.story_id = stories.id AND m.kind = 'audio') AS audio FROM stories WHERE id = $1", [id]);
  if (!s || !["pending", "approved", "kept"].includes(s.status)) return { ok: false, error: "closed" };
  if (!s.audio) return { ok: false, error: "no_audio" };
  await q("UPDATE stories SET transcript = $2, transcript_by = 'family', transcript_at = now(), transcript_scan = NULL, transcript_scan_note = NULL, updated_at = now() WHERE id = $1", [id, text]);
  await audit(null, id, "transcript:family", text ? `${text.split(/\s+/).length} words` : "cleared");
  if (text) after(() => check(id, text));
  return { ok: true };
}

/** Text saved at the desk. The person saving it has read it, so on a published story it is public at once. */
export async function saveDesk(a: Actor, id: string, raw: unknown): Promise<{ ok: boolean; result: string }> {
  if (!(await canSee(a, id))) return { ok: false, result: "That story is not on your desk." };
  const text = tidy(raw);
  if (text && PHONE.test(text)) return { ok: false, result: "Take the phone number out first." };
  const s = await one<{ status: string }>(`UPDATE stories SET transcript = $2, transcript_by = $3, transcript_at = now(), transcript_public = CASE WHEN status IN ('approved', 'kept') THEN $2 ELSE transcript_public END,
      transcript_scan = NULL, transcript_scan_note = NULL, updated_at = now() WHERE id = $1 AND status IN ('pending', 'approved', 'kept') RETURNING status`, [id, text, a.role]);
  if (!s) return { ok: false, result: "Only a story that is waiting or published can be written out." };
  await audit(a, id, "transcript", text ? `${text.split(/\s+/).length} words` : "cleared");
  if (text) after(() => check(id, text));
  return { ok: true, result: s.status === "approved" ? "Saved, and it is on the story page now." : s.status === "kept" ? "Saved, and the copybook prints it now." : "Saved. It is published with the story when the story is approved." };
}
