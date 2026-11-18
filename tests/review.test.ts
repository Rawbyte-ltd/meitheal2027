import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Against a real migrated Postgres, like tests/remove.test.ts (see its header for the docker command).
const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "set TEST_DATABASE_URL to a migrated test database (see tests/remove.test.ts)";
if (url) process.env.DATABASE_URL = url;

let db: typeof import("../src/lib/db.ts"), rv: typeof import("../src/lib/review.ts"), rm: typeof import("../src/lib/remove.ts");
before(async () => {
  if (!url) return;
  db = await import("../src/lib/db.ts"); rv = await import("../src/lib/review.ts"); rm = await import("../src/lib/remove.ts");
  reader.user.id = (await db.q<{ id: number }>("INSERT INTO users (email, name, role, county) VALUES ($1, 'Reader', 'reader', 'Cavan') RETURNING id", [reader.user.email]))[0].id;
});
after(async () => { if (url) await db.pool.end(); });

const admin = { user: null, role: "admin" as const, key: "test" };
const reader = { user: { id: 0 /* set in before() */, email: `r-${Date.now()}@test`, name: "Reader", role: "reader" as const, county: "Cavan", school: null, class_name: null, nominated_by: null, disabled: false, owner: false, created_at: "", last_seen: null }, role: "reader" as const, key: null };

async function story(status: string): Promise<string> {
  const id = `r-${status}-${Math.random().toString(36).slice(2, 8)}`;
  await db.q(`INSERT INTO stories (id, title, body, topic, county, townland_slug, townland_en, lat, lng, teller_name, collector_name, consent_name, consent, words, secret_hash, status)
    VALUES ($1, 'T', 'B', 'custom', 'Cavan', 'x', 'X', 54, -7, 'Mary', 'Aoife', 'Siobhán', true, 1, 'h', $2)`, [id, status]);
  return id;
}
const statusOf = async (id: string) => (await db.q<{ status: string }>("SELECT status FROM stories WHERE id = $1", [id]))[0].status;

test("no desk action brings back a story the family removed", { skip }, async () => {
  const id = await story("approved");
  await rm.removeStory(id);
  for (const action of ["approve", "pending", "sendback", "book", "feature"] as const) {
    const r = await rv.review(admin, id, action, "");
    assert.equal(r.ok, false, `${action} on a removed story must be refused`);
    assert.equal(await statusOf(id), "removed", `${action} changed a removed story`);
  }
});

test("a sent-back story is published again only by the admin", { skip }, async () => {
  const id = await story("rejected");
  assert.equal((await rv.review(reader, id, "approve", "")).ok, false);
  assert.equal(await statusOf(id), "rejected");
  assert.equal((await rv.review(admin, id, "approve", "")).ok, true);
  assert.equal(await statusOf(id), "approved");
});

test("a waiting story is published by a reader", { skip }, async () => {
  const id = await story("pending");
  assert.equal((await rv.review(reader, id, "approve", "")).ok, true);
  assert.equal(await statusOf(id), "approved");
});

test("a teacher with no county sees nothing, not every school of that name in Ireland", { skip }, async () => {
  const { scopeSql } = await import("../src/lib/auth.ts");
  const t = { ...reader, role: "teacher" as const, user: { ...reader.user, role: "teacher" as const, county: null, school: "Scoil Mhuire" } };
  assert.equal(scopeSql(t).where, "false");
  const withCounty = scopeSql({ ...t, user: { ...t.user, county: "Cavan" } });
  assert.match(withCounty.where, /s\.county = /);
});
