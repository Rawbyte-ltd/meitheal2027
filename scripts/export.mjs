// The collection for the National Folklore Collection (docs/handoff.md, phase 2): one folder per published story (and
// per copybook-only story, marked online: false, since the family asked that it is not put online) with
// story.json (every field, the consent record, the review trail), story.txt, its recordings and photographs, and a
// manifest.json at the top. Private things stay out: the adult's email, the keeper secret, IP hashes, moderator notes.
//
//   node scripts/export.mjs [out-dir] [--all]      (default ./export-YYYY-MM-DD, published and copybook-only)
// On Railway: railway ssh "cd /app && node scripts/export.mjs /tmp/nfc" then
//             railway service files download /tmp/nfc ./nfc     (or tar it first: tar czf /tmp/nfc.tgz -C /tmp nfc)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import pg from "pg";

const args = process.argv.slice(2), all = args.includes("--all");
const out = args.find(a => !a.startsWith("--")) ?? `export-${new Date().toISOString().slice(0, 10)}`;
const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/meitheal";
const db = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1|\.railway\.internal/.test(url) ? false : { rejectUnauthorized: false } });
const e = process.env;
const r2 = e.R2_ACCOUNT_ID && e.R2_ACCESS_KEY_ID && e.R2_SECRET_ACCESS_KEY && e.R2_BUCKET
  ? new S3Client({ region: "auto", endpoint: `https://${e.R2_ACCOUNT_ID}.${e.R2_JURISDICTION ? e.R2_JURISDICTION + "." : ""}r2.cloudflarestorage.com`, credentials: { accessKeyId: e.R2_ACCESS_KEY_ID, secretAccessKey: e.R2_SECRET_ACCESS_KEY } })
  : null;

// What the consenting adult agreed to on the form (src/lib/i18n.ts form.consent), kept with every story.
const CONSENT = {
  version: "2026-10",
  text_en: "I am an adult. The person who told this knows it will be published with their first name, decade of birth and townland, and is happy with that. No living person is named by surname and nobody is photographed without agreeing. It may be offered to the National Folklore Collection and kept for a hundred years.",
  terms: ["first names only", "published after a person has read it", "offered to the National Folklore Collection", "removed on request by the family"],
};
const ext = mime => /mp4|m4a/.test(mime) ? "m4a" : /ogg/.test(mime) ? "ogg" : /wav/.test(mime) ? "wav" : /webm/.test(mime) ? "webm" : /png/.test(mime) ? "png" : /webp/.test(mime) ? "webp" : "jpg";

await db.connect();
const stories = (await db.query(`SELECT s.id, s.created_at, s.updated_at, s.status, s.collection, s.title, s.body, s.lang, s.topic, s.topic_custom, s.county, s.townland_slug, s.townland_en, s.townland_ga, s.lat, s.lng,
    s.teller_name, s.teller_born, s.teller_relation, s.collector_name, s.collector_age, s.school, s.class_name, s.consent_name, s.consent, s.words, s.featured,
    s.transcript_public AS written_out, s.lang_other, s.from_place, s.from_country, s.body_en AS body_english_machine,
    s.reviewed_at, u.name AS reviewed_by, u.role AS reviewer_role
  FROM stories s LEFT JOIN users u ON u.id = s.reviewed_by WHERE s.source_url IS NULL AND ${all ? "s.status <> 'removed'" : "s.status IN ('approved', 'kept')"} ORDER BY s.created_at`)).rows;
mkdirSync(out, { recursive: true });
const manifest = { exported_at: new Date().toISOString(), source: "Meitheal 2027 (meitheal2027.ie)", scope: all ? "every story not removed" : "published stories, and copybook-only stories (online: false)", consent: CONSENT, stories: [] };

for (const s of stories) {
  const dir = join(out, s.id); mkdirSync(dir, { recursive: true });
  const media = (await db.query("SELECT id, kind, mime, bytes, caption, transcript, transcript_en, r2_key, blob FROM media WHERE story_id = $1 ORDER BY kind, id", [s.id])).rows;
  const trail = (await db.query("SELECT a.at, a.action, a.detail, u.name, u.role FROM audit a LEFT JOIN users u ON u.id = a.user_id WHERE a.story_id = $1 ORDER BY a.at", [s.id])).rows;
  const files = [];
  for (const m of media) {
    let body = m.blob;
    if (!body && m.r2_key && r2) { const o = await r2.send(new GetObjectCommand({ Bucket: e.R2_BUCKET, Key: m.r2_key })); body = Buffer.from(await o.Body.transformToByteArray()); }
    if (!body) { files.push({ kind: m.kind, missing: true }); continue; }
    const name = `${m.kind}-${m.id}.${ext(m.mime)}`;
    writeFileSync(join(dir, name), body);
    files.push({ file: name, kind: m.kind, mime: m.mime, bytes: body.length, caption: m.caption, transcript_machine: m.transcript ?? null, transcript_english_machine: m.transcript_en ?? null });
  }
  const online = s.status === "approved";
  const record = {
    ...s, online, place: { townland: s.townland_en, townland_ga: s.townland_ga, county: s.county, lat: s.lat, lng: s.lng, from: s.from_country ? { place: s.from_place, country: s.from_country } : null },
    consent_record: { given: s.consent, by_first_name: s.consent_name, at: s.created_at, version: CONSENT.version },
    review: { by: s.reviewed_by, role: s.reviewer_role, at: s.reviewed_at, trail: trail.map(t => ({ at: t.at, action: t.action, by: t.name ?? "admin key", role: t.role, detail: t.detail })) },
    media: files,
  };
  writeFileSync(join(dir, "story.json"), JSON.stringify(record, null, 2));
  writeFileSync(join(dir, "story.txt"), `${s.title}\n\nTold by ${s.teller_name}${s.teller_born ? `, born in the ${s.teller_born}` : ""}, to ${s.collector_name}${s.school ? `, ${s.school}` : ""}.\n${s.from_country ? `From ${[s.from_place, s.from_country].filter(Boolean).join(", ")}. ` : ""}${s.townland_en}${s.townland_ga ? ` (${s.townland_ga})` : ""}, Co. ${s.county}.${s.lang === "other" && s.lang_other ? ` Told in ${s.lang_other}.` : ""} Collected ${new Date(s.created_at).toISOString().slice(0, 10)}.\n${online ? "" : "The family asked that this story is kept in the class copybook and not put online.\n"}\n${s.body}\n${s.written_out ? `\nWritten out from the recording, checked by a person:\n\n${s.written_out}\n` : ""}`);
  manifest.stories.push({ id: s.id, folder: s.id, title: s.title, county: s.county, townland: s.townland_en, collected: s.created_at, lang: s.lang, collection: s.collection, online, files: files.filter(f => f.file).map(f => f.file) });
}
writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
await db.end();
console.log(`${stories.length} stor${stories.length === 1 ? "y" : "ies"} written to ${out}`);
