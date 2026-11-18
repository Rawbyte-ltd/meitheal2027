import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Against a real migrated Postgres (see tests/remove.test.ts for the docker command).
const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "set TEST_DATABASE_URL to a migrated test database (see tests/remove.test.ts)";
if (url) process.env.DATABASE_URL = url;

let db: typeof import("../src/lib/db.ts"), rt: typeof import("../src/lib/retention.ts");
before(async () => { if (url) { db = await import("../src/lib/db.ts"); rt = await import("../src/lib/retention.ts"); } });
after(async () => { if (url) await db.pool.end(); });

const tag = Math.random().toString(36).slice(2, 8);
async function user(lastSeen: string | null, created: string, owner = false): Promise<number> {
  const id = (await db.q<{ id: number }>(`INSERT INTO users (email, name, role, county, school, nominated_by, owner, last_seen, created_at)
    VALUES ($1, 'Máire Teacher', 'teacher', 'Cavan', 'Scoil Mhuire', 'Cavan Library', $2, $3::timestamptz, $4::timestamptz) RETURNING id`,
    [`t-${tag}-${Math.random().toString(36).slice(2, 8)}@school.ie`, owner, lastSeen, created]))[0].id;
  await db.q("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')", [`s-${id}`, id]);
  return id;
}
const daysAgo = (n: number) => new Date(Date.now() - n * 86400e3).toISOString();
const row = async (id: number) => (await db.q<Record<string, unknown>>("SELECT * FROM users WHERE id = $1", [id]))[0];

test("an account unused for 12 months is anonymised; a recent one and the owner's are not", { skip }, async () => {
  const old = await user(daysAgo(400), daysAgo(500));
  const neverUsed = await user(null, daysAgo(400));
  const recent = await user(daysAgo(30), daysAgo(400));
  const owner = await user(daysAgo(400), daysAgo(500), true);
  // A story the old account approved keeps pointing at it.
  await db.q(`INSERT INTO stories (id, title, body, topic, county, townland_slug, townland_en, lat, lng, teller_name, collector_name, consent_name, consent, words, secret_hash, status, reviewed_by)
    VALUES ($1, 'T', 'B', 'custom', 'Cavan', 'x', 'X', 54, -7, 'M', 'A', 'S', true, 1, 'h', 'approved', $2)`, [`ret-${tag}`, old]);

  await rt.runRetention();

  for (const id of [old, neverUsed]) {
    const u = await row(id);
    assert.equal(u.name, "[deleted]"); assert.match(String(u.email), /^deleted-\d+@deleted\.invalid$/);
    for (const c of ["county", "school", "nominated_by"]) assert.equal(u[c], null, c);
    assert.equal(u.disabled, true);
    assert.equal((await db.q("SELECT 1 FROM sessions WHERE user_id = $1", [id])).length, 0, "signed out");
  }
  assert.equal((await row(recent)).name, "Máire Teacher");
  assert.equal((await row(owner)).name, "Máire Teacher", "the owner is never anonymised");
  assert.equal((await db.q<{ reviewed_by: number }>("SELECT reviewed_by FROM stories WHERE id = $1", [`ret-${tag}`]))[0].reviewed_by, old, "the decision stays accountable");
});

test("audit rows older than 3 years go; newer ones stay", { skip }, async () => {
  const oldId = (await db.q<{ id: number }>("INSERT INTO audit (at, action, detail) VALUES (now() - interval '3 years 1 day', 'approve', $1) RETURNING id", [`old ${tag}`]))[0].id;
  const newId = (await db.q<{ id: number }>("INSERT INTO audit (at, action, detail) VALUES (now() - interval '2 years', 'approve', $1) RETURNING id", [`new ${tag}`]))[0].id;
  await rt.runRetention();
  assert.equal((await db.q("SELECT 1 FROM audit WHERE id = $1", [oldId])).length, 0);
  assert.equal((await db.q("SELECT 1 FROM audit WHERE id = $1", [newId])).length, 1);
});
