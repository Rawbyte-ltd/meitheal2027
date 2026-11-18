import "server-only";
import { q } from "./db.ts";

/** Flags one sender may raise in a day, across all stories. Past it, a flag is quietly not recorded and sends no email. */
export const FLAGS_PER_DAY = 10;

/**
 * "Anyone can flag a story. Two flags take it off the map until it is read again" (About). Two flags means two people:
 * one flag per story per sender (migrations/014), and the count is of senders. The caller checks the story is published.
 * Returns whether this flag was recorded, and how many people have now flagged the story.
 */
export async function recordFlag(storyId: string, reason: string, sender: string): Promise<{ added: boolean; n: number }> {
  const today = (await q<{ n: number }>("SELECT count(*)::int AS n FROM flags WHERE ip_hash = $1 AND created_at > now() - interval '1 day'", [sender]))[0].n;
  const added = today < FLAGS_PER_DAY && (await q("INSERT INTO flags (story_id, reason, ip_hash) VALUES ($1, $2, $3) ON CONFLICT (story_id, ip_hash) DO NOTHING RETURNING id", [storyId, reason, sender])).length > 0;
  const n = (await q<{ n: number }>("SELECT count(DISTINCT ip_hash)::int AS n FROM flags WHERE story_id = $1", [storyId]))[0].n;
  if (added && n >= 2) await q("UPDATE stories SET status = 'pending' WHERE id = $1 AND status = 'approved'", [storyId]);
  return { added, n };
}
