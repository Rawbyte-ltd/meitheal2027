import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Against a real migrated Postgres (see tests/remove.test.ts for the docker command).
const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "set TEST_DATABASE_URL to a migrated test database (see tests/remove.test.ts)";
if (url) process.env.DATABASE_URL = url;

let db: typeof import("../src/lib/db.ts"), st: typeof import("../src/lib/stories.ts");
before(async () => { if (url) { db = await import("../src/lib/db.ts"); st = await import("../src/lib/stories.ts"); } });
after(async () => { if (url) await db.pool.end(); });

const school = `Scoil Test ${Math.random().toString(36).slice(2, 7)}`;
async function add(archive: boolean): Promise<string> {
  const id = `c-${Math.random().toString(36).slice(2, 10)}`;
  await db.q(`INSERT INTO stories (id, title, body, topic, county, townland_slug, townland_en, lat, lng, teller_name, collector_name, consent_name, consent, words, secret_hash, status, school, source_url)
    VALUES ($1, 'T', 'one two three', 'custom', 'Cavan', 'x', 'X', 54, -7, 'Mary', 'Aoife', 'S', true, 3, 'h', 'approved', $2, $3)`, [id, school, archive ? "https://www.duchas.ie/en/cbes/1" : null]);
  return id;
}

test("a 1937 example changes no claim: not the story count, the words, or the schools taking part", { skip }, async () => {
  const before = await st.stats();
  const id = await add(true);
  const after = await st.stats();
  assert.equal(after.stories, before.stories); assert.equal(after.words, before.words); assert.equal(after.schools, before.schools);
  assert.equal(after.examples, before.examples + 1);
  assert.ok(!(await st.schoolList()).some(s => s.school === school), "a 1937 school is not 'taking part'");
  assert.equal((await st.points()).find(p => p.id === id)?.archive, true, "the map marks it");
});

test("a real story is counted", { skip }, async () => {
  const before = await st.stats();
  await add(false);
  const after = await st.stats();
  assert.equal(after.stories, before.stories + 1); assert.equal(after.words, before.words + 3);
  assert.ok((await st.schoolList()).some(s => s.school === school));
});
