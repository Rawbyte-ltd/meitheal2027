import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Against a real migrated Postgres (see tests/remove.test.ts for the docker command).
const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "set TEST_DATABASE_URL to a migrated test database (see tests/remove.test.ts)";
if (url) process.env.DATABASE_URL = url;

let db: typeof import("../src/lib/db.ts"), fl: typeof import("../src/lib/flags.ts");
before(async () => { if (url) { db = await import("../src/lib/db.ts"); fl = await import("../src/lib/flags.ts"); } });
after(async () => { if (url) await db.pool.end(); });

async function published(): Promise<string> {
  const id = `f-${Math.random().toString(36).slice(2, 10)}`;
  await db.q(`INSERT INTO stories (id, title, body, topic, county, townland_slug, townland_en, lat, lng, teller_name, collector_name, consent_name, consent, words, secret_hash, status)
    VALUES ($1, 'T', 'B', 'custom', 'Cavan', 'x', 'X', 54, -7, 'Mary', 'Aoife', 'S', true, 1, 'h', 'approved')`, [id]);
  return id;
}
const statusOf = async (id: string) => (await db.q<{ status: string }>("SELECT status FROM stories WHERE id = $1", [id]))[0].status;
const who = () => `sender-${Math.random().toString(36).slice(2, 10)}`;

test("one person flagging twice does not take a story down", { skip }, async () => {
  const id = await published(), me = who();
  assert.deepEqual(await fl.recordFlag(id, "rude", me), { added: true, n: 1 });
  assert.deepEqual(await fl.recordFlag(id, "rude again", me), { added: false, n: 1 });
  assert.equal(await statusOf(id), "approved");
});

test("two different people take it off the map", { skip }, async () => {
  const id = await published();
  await fl.recordFlag(id, "rude", who());
  assert.deepEqual(await fl.recordFlag(id, "names a neighbour", who()), { added: true, n: 2 });
  assert.equal(await statusOf(id), "pending");
});

test("one sender is capped per day across stories", { skip }, async () => {
  const me = who();
  for (let i = 0; i < fl.FLAGS_PER_DAY; i++) assert.equal((await fl.recordFlag(await published(), "x", me)).added, true);
  assert.equal((await fl.recordFlag(await published(), "x", me)).added, false);
});
