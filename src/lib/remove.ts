import "server-only";
import { q } from "./db.ts";
import { deleteStoryMedia } from "./media.ts";

/**
 * What a removed story keeps: its id, dates, status, heading, county and townland, the consent tick and its version, and
 * the keeper hash (so the family's link still says "removed"). Everything that could say who it was, or what they said,
 * is cleared. The About page promises the email goes; the keeper page says "for good"; /privacy lists what remains.
 * migrations/013 runs the same SET once over stories removed before this existed. Keep the two the same.
 */
export const REMOVED_SET = `status = 'removed', featured = false, second_look = false,
  title = '[removed]', body = '[removed]', words = 0, topic_custom = NULL, lang_other = NULL, body_en = NULL,
  teller_name = '', teller_born = NULL, teller_relation = NULL, collector_name = '', collector_age = NULL, school = NULL, class_name = NULL,
  contact_email = NULL, consent_name = '', ip_hash = NULL, from_place = NULL, from_country = NULL,
  note = NULL, scan_note = NULL, review_note = NULL,
  transcript = NULL, transcript_public = NULL, transcript_by = NULL, transcript_at = NULL, transcript_scan = NULL, transcript_scan_note = NULL,
  updated_at = now()`;

/** Remove a story for good: its files first (this throws if storage would not delete one, and then nothing is marked removed), then its flags, then the details. */
export async function removeStory(id: string): Promise<void> {
  await deleteStoryMedia(id);
  await q("DELETE FROM flags WHERE story_id = $1", [id]);
  await q(`UPDATE stories SET ${REMOVED_SET} WHERE id = $1`, [id]);
}
