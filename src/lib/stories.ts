import "server-only";
import { one, q } from "./db.ts";

export type Story = {
  id: string; created_at: string; status: string; featured: boolean; collection: string; title: string; body: string; lang: string; topic: string; topic_custom: string | null;
  county: string; townland_slug: string; townland_en: string; townland_ga: string | null; lat: number; lng: number;
  teller_name: string; teller_born: string | null; teller_relation: string | null; collector_name: string; collector_age: string | null;
  school: string | null; /** Not public: only the desk and the copybook select it (it narrows a child down too far). */ class_name?: string | null; words: number; has_audio: boolean; has_photo: boolean;
  /** A story from outside Ireland: the town or village and the country as the family wrote them (migrations/010). The townland is where it was collected. */
  from_place: string | null; from_country: string | null;
  /** lang 'other' names the language in lang_other; body_en is the machine's English of a story in another language. */
  lang_other: string | null; body_en: string | null;
  /** The written-out text of the recordings, as a person at the desk read it (src/lib/transcript.ts). */
  transcript_public: string | null;
  /** Set on an example from an existing archive, the 1937-38 Schools' Collection (migrations/011): link, volume and page, credit. */
  source_url: string | null; source_ref: string | null; source_credit: string | null;
};
export const PUBLIC_COLS = `id, created_at, status, featured, collection, title, body, lang, topic, topic_custom, county, townland_slug, townland_en, townland_ga, lat, lng, teller_name, teller_born, teller_relation, collector_name, collector_age, school, words, transcript_public, from_place, from_country, lang_other, body_en, source_url, source_ref, source_credit,
  EXISTS (SELECT 1 FROM media m WHERE m.story_id = stories.id AND m.kind = 'audio') AS has_audio, EXISTS (SELECT 1 FROM media m WHERE m.story_id = stories.id AND m.kind = 'photo') AS has_photo`;

export type Filter = { county?: string; townland?: string; country?: string; topic?: string; collection?: string; school?: string; teller?: string; q?: string; letter?: string; featured?: boolean; limit?: number; offset?: number };

export async function listStories(f: Filter = {}): Promise<Story[]> {
  const where = ["status = 'approved'"], p: unknown[] = [];
  if (f.county) { p.push(f.county); where.push(`county = $${p.length}`); }
  if (f.townland) { p.push(f.townland); where.push(`townland_slug = $${p.length}`); }
  if (f.country) { p.push(f.country); where.push(`lower(from_country) = lower($${p.length})`); }
  if (f.topic) { p.push(f.topic); where.push(`(topic = $${p.length} OR (topic = 'custom' AND lower(topic_custom) = lower($${p.length})))`); }
  if (f.collection === "photo") where.push("EXISTS (SELECT 1 FROM media m WHERE m.story_id = stories.id AND m.kind = 'photo')");
  else if (f.collection === "audio") where.push("EXISTS (SELECT 1 FROM media m WHERE m.story_id = stories.id AND m.kind = 'audio')");
  else if (f.collection) { p.push(f.collection); where.push(`collection = $${p.length}`); }
  if (f.school) { p.push(f.school); where.push(`school = $${p.length}`); }
  if (f.teller) { const [name, born, slug] = f.teller.split("|"); p.push(name, born || null, slug); where.push(`teller_name = $${p.length - 2} AND teller_born IS NOT DISTINCT FROM $${p.length - 1} AND townland_slug = $${p.length}`); }
  if (f.letter) { p.push(`${f.letter}%`); where.push(`upper(regexp_replace(title, '^(The|A|An) ', '', 'i')) ILIKE $${p.length}`); }
  if (f.featured) where.push("featured");
  if (f.q) { p.push(`%${f.q}%`); where.push(`(title ILIKE $${p.length} OR body ILIKE $${p.length} OR coalesce(transcript_public,'') ILIKE $${p.length} OR townland_en ILIKE $${p.length} OR teller_name ILIKE $${p.length} OR coalesce(school,'') ILIKE $${p.length} OR coalesce(topic_custom,'') ILIKE $${p.length} OR coalesce(from_place,'') ILIKE $${p.length} OR coalesce(from_country,'') ILIKE $${p.length})`); }
  p.push(Math.min(f.limit ?? 50, 500)); const lim = p.length; p.push(f.offset ?? 0);
  const order = f.letter ? "regexp_replace(title, '^(The|A|An) ', '', 'i')" : "featured DESC, created_at DESC";
  return q<Story>(`SELECT ${PUBLIC_COLS} FROM stories WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT $${lim} OFFSET $${p.length}`, p);
}
export const getStory = (id: string) => one<Story>(`SELECT ${PUBLIC_COLS} FROM stories WHERE id = $1`, [id]);

/**
 * Two kinds of count. A CLAIM says what Meitheal has collected or who takes part (the home page numbers, /api/health,
 * "Schools taking part"): it counts only real submissions, never the 1937 examples (migrations/011: "not Meitheal
 * submissions"). NAVIGATION says what there is to read here (county, townland, topic and collection chips): it counts
 * every published story, and each example is labelled 1937 wherever it shows.
 */
export const REAL = "source_url IS NULL";
export type Stats = { stories: number; townlands: number; counties: number; schools: number; tellers_oldest: string | null; words: number; audio: number; photos: number; examples: number };
export async function stats(): Promise<Stats> {
  const r = await one<Stats>(`SELECT count(*) FILTER (WHERE ${REAL})::int AS stories, count(DISTINCT county || '/' || townland_slug) FILTER (WHERE ${REAL})::int AS townlands, count(DISTINCT county) FILTER (WHERE ${REAL})::int AS counties,
    count(DISTINCT school) FILTER (WHERE ${REAL})::int AS schools, min(teller_born) FILTER (WHERE ${REAL}) AS tellers_oldest, coalesce(sum(words) FILTER (WHERE ${REAL}), 0)::int AS words,
    (SELECT count(*)::int FROM media m JOIN stories s ON s.id = m.story_id WHERE s.status = 'approved' AND s.${REAL} AND m.kind = 'audio') AS audio,
    (SELECT count(*)::int FROM media m JOIN stories s ON s.id = m.story_id WHERE s.status = 'approved' AND s.${REAL} AND m.kind = 'photo') AS photos,
    count(*) FILTER (WHERE NOT ${REAL})::int AS examples
    FROM stories WHERE status = 'approved'`);
  return r ?? { stories: 0, townlands: 0, counties: 0, schools: 0, tellers_oldest: null, words: 0, audio: 0, photos: 0, examples: 0 };
}
export const countyCounts = () => q<{ county: string; n: number }>(`SELECT county, count(*)::int AS n FROM stories WHERE status = 'approved' GROUP BY county ORDER BY county`);
export const townlandCounts = (county: string) => q<{ townland_slug: string; townland_en: string; townland_ga: string | null; n: number }>(`SELECT townland_slug, townland_en, min(townland_ga) AS townland_ga, count(*)::int AS n FROM stories WHERE status = 'approved' AND county = $1 GROUP BY townland_slug, townland_en ORDER BY townland_en`, [county]);
/** Countries the far stories are from, most first; the name as the first family wrote it. */
export const countryCounts = () => q<{ country: string; n: number }>(`SELECT min(from_country) AS country, count(*)::int AS n FROM stories WHERE status = 'approved' AND from_country IS NOT NULL GROUP BY lower(from_country) ORDER BY n DESC, 1`);
export const topicCounts = () => q<{ topic: string; topic_custom: string | null; n: number }>(`SELECT topic, CASE WHEN topic = 'custom' THEN topic_custom END AS topic_custom, count(*)::int AS n FROM stories WHERE status = 'approved' GROUP BY 1, 2 ORDER BY n DESC`);
export const collectionCounts = () => q<{ collection: string; n: number }>(`SELECT collection, count(*)::int AS n FROM stories WHERE status = 'approved' GROUP BY collection
  UNION ALL SELECT 'photo', count(DISTINCT s.id)::int FROM stories s JOIN media m ON m.story_id = s.id AND m.kind = 'photo' WHERE s.status = 'approved'
  UNION ALL SELECT 'audio', count(DISTINCT s.id)::int FROM stories s JOIN media m ON m.story_id = s.id AND m.kind = 'audio' WHERE s.status = 'approved'`);
/** Photographic Collection: one tile per photograph, like dúchas.ie's grid. */
export const photoGrid = (limit = 60, offset = 0) => q<{ media_id: number; caption: string | null; id: string; title: string; topic: string; topic_custom: string | null; county: string; townland_en: string; teller_born: string | null }>(`SELECT m.id AS media_id, m.caption, s.id, s.title, s.topic, s.topic_custom, s.county, s.townland_en, s.teller_born FROM media m JOIN stories s ON s.id = m.story_id WHERE s.status = 'approved' AND m.kind = 'photo' ORDER BY s.featured DESC, s.created_at DESC, m.id LIMIT $1 OFFSET $2`, [limit, offset]);
/** Audio Collection: one row per recording with its player. */
export const audioList = (limit = 60, offset = 0) => q<{ media_id: number; bytes: number; mime: string; id: string; title: string; topic: string; topic_custom: string | null; county: string; townland_en: string; teller_name: string; teller_born: string | null; collector_name: string; lang: string; body: string; created_at: string }>(`SELECT m.id AS media_id, m.bytes, m.mime, s.id, s.title, s.topic, s.topic_custom, s.county, s.townland_en, s.teller_name, s.teller_born, s.collector_name, s.lang, s.body, s.created_at FROM media m JOIN stories s ON s.id = m.story_id WHERE s.status = 'approved' AND m.kind = 'audio' ORDER BY s.featured DESC, s.created_at DESC, m.id LIMIT $1 OFFSET $2`, [limit, offset]);
/** Schools taking part: a claim, so real submissions only (the 1937 schools are not taking part). */
export const schoolList = () => q<{ school: string; n: number; county: string }>(`SELECT school, count(*)::int AS n, min(county) AS county FROM stories WHERE status = 'approved' AND ${REAL} AND school IS NOT NULL AND school <> '' GROUP BY school ORDER BY n DESC`);
export const tellerList = (letter?: string) => q<{ teller_name: string; teller_born: string | null; townland_slug: string; townland_en: string; county: string; n: number; archive: boolean }>(`SELECT teller_name, teller_born, townland_slug, min(townland_en) AS townland_en, min(county) AS county, count(*)::int AS n, bool_or(NOT ${REAL}) AS archive FROM stories WHERE status = 'approved' ${letter ? "AND upper(left(teller_name, 1)) = $1" : ""} GROUP BY teller_name, teller_born, townland_slug ORDER BY teller_name, teller_born`, letter ? [letter] : []);

/** Points for the map: approved stories only, no text. */
export const points = () => q<{ id: string; title: string; topic: string; collection: string; county: string; townland_en: string; lat: number; lng: number; archive: boolean }>(`SELECT id, title, topic, collection, county, townland_en, lat, lng, NOT ${REAL} AS archive FROM stories WHERE status = 'approved' ORDER BY created_at DESC LIMIT 20000`);

export function paragraphs(body: string): string[] { return body.replace(/\r/g, "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean); }
export const excerpt = (body: string, n = 260) => { const flat = body.replace(/\s+/g, " ").trim(); return flat.length <= n ? flat : flat.slice(0, n).replace(/\s+\S*$/, "") + "…"; };
/** Nine or more digits in a row: a phone number, kept out of anything published. The app (collect.dart) uses the same rule. */
export const PHONE = /\b(?:\d[ -]?){9,}\b/;
/**
 * A story id from a form or URL, or "" if it can't be one. Submitted ids are 10 characters (src/lib/token.ts); the 1937
 * examples are "d1937-" and a slug, up to 28 so far. Cutting at 20 used to turn those into ids that matched nothing.
 */
export const storyIdOf = (v: unknown): string => { const s = String(v ?? "").trim(); return /^[a-z0-9-]{1,60}$/.test(s) ? s : ""; };
export const clean = (s: unknown, max = 200) => String(s ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);
export const headingOf = (s: Pick<Story, "topic" | "topic_custom">, fallback: (slug: string) => string | undefined) => s.topic === "custom" ? (s.topic_custom ?? "Own heading") : (fallback(s.topic) ?? s.topic);
