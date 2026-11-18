// Loads the example stories from the 1937-38 Schools' Collection (data/demo-1937.json) as approved stories, so the site
// shows what Meitheal gathers before the first class has added any. Each one carries its dúchas.ie page, volume and page,
// and the transcriber's credit (migrations/011); the story page shows them with the CC BY-NC 4.0 licence.
// Run again to update them in place. `--remove` deletes every one of them (ids start with d1937-).
//   DATABASE_URL=... node scripts/seed-1937.mjs [--remove]
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/meitheal";
const db = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1|\.railway\.internal/.test(url) ? false : { rejectUnauthorized: false } });
await db.connect();

if (process.argv.includes("--remove")) {
  const r = await db.query("DELETE FROM stories WHERE id LIKE 'd1937-%' AND source_url IS NOT NULL");
  console.log(`seed-1937: removed ${r.rowCount}`);
  await db.end(); process.exit(0);
}

const stories = JSON.parse(readFileSync(new URL("../data/demo-1937.json", import.meta.url), "utf8"));
// Written down over the winter of 1937-38; dated before anything a family adds, so real stories always list first.
const when = "1938-01-01T12:00:00Z";
for (const s of stories) {
  const words = s.body.split(/\s+/).filter(Boolean).length;
  const secret = createHash("sha256").update(randomBytes(32)).digest("hex"); // no keeper link: nobody can open or delete it as a family
  await db.query(`INSERT INTO stories (id, created_at, updated_at, status, collection, title, body, lang, topic, topic_custom, county, townland_slug, townland_en, townland_ga, lat, lng,
      teller_name, teller_born, collector_name, collector_age, school, consent_name, consent, words, secret_hash, source_url, source_ref, source_credit)
    VALUES ($1, $2, now(), 'approved', 'schools', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'Dúchas, CC BY-NC 4.0', false, $19, $20, $21, $22, $23)
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, topic = EXCLUDED.topic, topic_custom = EXCLUDED.topic_custom,
      townland_slug = EXCLUDED.townland_slug, townland_en = EXCLUDED.townland_en, townland_ga = EXCLUDED.townland_ga, lat = EXCLUDED.lat, lng = EXCLUDED.lng,
      teller_name = EXCLUDED.teller_name, teller_born = EXCLUDED.teller_born, collector_name = EXCLUDED.collector_name, collector_age = EXCLUDED.collector_age,
      school = EXCLUDED.school, words = EXCLUDED.words, source_url = EXCLUDED.source_url, source_ref = EXCLUDED.source_ref, source_credit = EXCLUDED.source_credit, updated_at = now()`,
    [s.id, when, s.title, s.body, s.lang, s.topic, s.topic_custom, s.county, s.townland_slug, s.townland_en, s.townland_ga, s.lat, s.lng,
     s.teller_name, s.teller_born, s.collector_name, s.collector_age, s.school, words, secret, s.source_url, s.source_ref, s.source_credit]);
  console.log("seed-1937:", s.id);
}
await db.end();
