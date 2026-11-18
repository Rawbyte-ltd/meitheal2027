import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Runs against a real, migrated Postgres, never a mock (the bug was in what the SQL cleared). Start one with:
//   docker run -d --name meitheal-test-pg -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=meitheal -p 5433:5432 postgres:16.4-alpine
//   DATABASE_URL=postgres://postgres@127.0.0.1:5433/meitheal node scripts/migrate.mjs
// then: TEST_DATABASE_URL=postgres://postgres@127.0.0.1:5433/meitheal npm test
const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "set TEST_DATABASE_URL to a migrated test database (see the top of tests/remove.test.ts)";
if (url) process.env.DATABASE_URL = url;

/** Columns a removed story keeps, and why. Every other column must be cleared by REMOVED_SET. */
const KEPT: Record<string, string> = {
  id: "the number the family's link points at", created_at: "when", updated_at: "when it was removed", status: "'removed'",
  topic: "the heading", collection: "which collection", lang: "the language", county: "the county", townland_slug: "the townland",
  townland_en: "the townland", townland_ga: "the townland", lat: "the townland's centre, not a house", lng: "the townland's centre",
  consent: "that consent was given", consent_version: "which wording", secret_hash: "a hash of a random secret, so the link says 'removed'",
  book_only: "a flag, no data", scan: "the check's verdict word, no text", reviewed_by: "which desk account acted (accountability)",
  reviewed_at: "when", source_url: "1937 archive link (not personal)", source_ref: "1937 volume and page", source_credit: "1937 credit",
};

let db: typeof import("../src/lib/db.ts"), rm: typeof import("../src/lib/remove.ts");
before(async () => { if (url) { db = await import("../src/lib/db.ts"); rm = await import("../src/lib/remove.ts"); } });
after(async () => { if (url) await db.pool.end(); });

test("migration 013 clears with exactly REMOVED_SET", { skip: false }, async () => {
  const { REMOVED_SET } = await import("../src/lib/remove.ts");
  const sql = readFileSync(new URL("../migrations/013_clear_removed_stories.sql", import.meta.url), "utf8").replace(/\r\n/g, "\n");
  assert.ok(sql.includes(`UPDATE stories SET ${REMOVED_SET}\nWHERE status = 'removed';`), "migrations/013 must use the same SET as src/lib/remove.ts");
});

test("every stories column is either cleared on removal or kept on purpose", { skip }, async () => {
  const cols = (await db.q<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_name = 'stories'")).map(r => r.column_name);
  const cleared = new Set([...rm.REMOVED_SET.matchAll(/(\w+) = /g)].map(m => m[1]));
  const neither = cols.filter(c => !cleared.has(c) && !(c in KEPT));
  assert.deepEqual(neither, [], `decide for each: clear it in REMOVED_SET (src/lib/remove.ts and migrations/013) or add it to KEPT here with a reason`);
});

test("removeStory clears every personal detail and deletes media and flags", { skip }, async () => {
  const id = `t-${Date.now()}`;
  await db.q(`INSERT INTO stories (id, title, body, lang, topic, topic_custom, county, townland_slug, townland_en, lat, lng, teller_name, teller_born, teller_relation,
      collector_name, collector_age, school, class_name, contact_email, consent_name, consent, words, secret_hash, ip_hash, note, scan, scan_note, review_note,
      transcript, transcript_public, transcript_by, transcript_scan_note, from_place, from_country, lang_other, body_en, consent_version, status)
    VALUES ($1, 'Granny Murphy and the fair', 'She said Seán Murphy of Ballyconnell...', 'other', 'custom', 'Our family', 'Cavan', 'killyrann', 'Killyrann', 54.1, -7.6, 'Mary', '1940s', 'grandmother',
      'Aoife Murphy', '9-10', 'Scoil Mhuire', '4th class', 'parent@example.ie', 'Siobhán', true, 7, 'hash', 'iphash', 'private', 'mild:personal_info', 'Seán Murphy', 'note to family',
      'machine words', 'public words', 'family', 'scan note', 'Lublin', 'Poland', 'Polish', 'English version', 'web-2026-11-04:en', 'approved')`, [id]);
  await db.q("INSERT INTO media (story_id, kind, mime, bytes, caption, blob, transcript) VALUES ($1, 'audio', 'audio/webm', 3, 'kitchen', '\\x010203', 'words'), ($1, 'photo', 'image/jpeg', 3, 'the house', '\\x010203', NULL)", [id]);
  await db.q("INSERT INTO flags (story_id, reason, ip_hash) VALUES ($1, 'names a neighbour', 'flagger')", [id]);

  await rm.removeStory(id);

  const s = (await db.q<Record<string, unknown>>("SELECT * FROM stories WHERE id = $1", [id]))[0];
  assert.equal(s.status, "removed");
  for (const c of ["title", "body"]) assert.equal(s[c], "[removed]", c);
  for (const c of ["teller_name", "collector_name", "consent_name"]) assert.equal(s[c], "", c);
  for (const c of ["teller_born", "teller_relation", "collector_age", "school", "class_name", "contact_email", "ip_hash", "note", "scan_note", "review_note",
    "transcript", "transcript_public", "transcript_by", "transcript_scan_note", "from_place", "from_country", "lang_other", "body_en", "topic_custom"]) assert.equal(s[c], null, c);
  assert.equal(s.words, 0);
  assert.equal(s.county, "Cavan"); assert.equal(s.consent_version, "web-2026-11-04:en"); assert.equal(s.secret_hash, "hash");
  const left = JSON.stringify(s);
  for (const word of ["Murphy", "Aoife", "Siobhán", "Scoil Mhuire", "parent@", "Lublin", "4th class"]) assert.ok(!left.includes(word), `"${word}" survived removal`);
  assert.equal((await db.q("SELECT 1 FROM media WHERE story_id = $1", [id])).length, 0, "media rows");
  assert.equal((await db.q("SELECT 1 FROM flags WHERE story_id = $1", [id])).length, 0, "flags");
  await db.q("DELETE FROM stories WHERE id = $1", [id]);
});
