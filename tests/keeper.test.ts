import { test, before, after } from "node:test";
import assert from "node:assert/strict";

// Against a real migrated Postgres (see tests/remove.test.ts for the docker command). The mailer is passed in, so a
// failed send can be made on purpose; the database is real.
const url = process.env.TEST_DATABASE_URL;
const skip = url ? false : "set TEST_DATABASE_URL to a migrated test database (see tests/remove.test.ts)";
if (url) process.env.DATABASE_URL = url;

let db: typeof import("../src/lib/db.ts"), kp: typeof import("../src/lib/keeper.ts"), tk: typeof import("../src/lib/token.ts");
before(async () => { if (url) { db = await import("../src/lib/db.ts"); kp = await import("../src/lib/keeper.ts"); tk = await import("../src/lib/token.ts"); } });
after(async () => { if (url) await db.pool.end(); });

async function storyWith(email: string, secret: string): Promise<string> {
  const id = `k-${Math.random().toString(36).slice(2, 10)}`;
  await db.q(`INSERT INTO stories (id, title, body, topic, county, townland_slug, townland_en, lat, lng, teller_name, collector_name, consent_name, consent, words, secret_hash, contact_email, status)
    VALUES ($1, 'T', 'B', 'custom', 'Cavan', 'x', 'X', 54, -7, 'Mary', 'Aoife', 'S', true, 1, $2, $3, 'approved')`, [id, tk.sha256(secret), email]);
  return id;
}
const hashOf = async (id: string) => (await db.q<{ secret_hash: string }>("SELECT secret_hash FROM stories WHERE id = $1", [id]))[0].secret_hash;
const addr = () => `p-${Math.random().toString(36).slice(2, 10)}@example.ie`;

test("if the email fails, the family's old link still works", { skip }, async () => {
  const email = addr(), id = await storyWith(email, "old-secret");
  assert.equal(await kp.reissueKeeperLinks(email, "https://x", async () => false), "failed");
  assert.equal(await hashOf(id), tk.sha256("old-secret"));
});

test("once the email has gone, the new link works and the old one does not", { skip }, async () => {
  const email = addr(), id = await storyWith(email, "old-secret");
  let sent = "";
  assert.equal(await kp.reissueKeeperLinks(email, "https://x", async links => { sent = links[0].url; return true; }), "sent");
  const k = new URL(sent).searchParams.get("k")!;
  assert.equal(await hashOf(id), tk.sha256(k));
  assert.notEqual(await hashOf(id), tk.sha256("old-secret"));
});

test("one resend per address an hour, held in the database", { skip }, async () => {
  const email = addr();
  assert.equal(await kp.claimResend(email), true);
  assert.equal(await kp.claimResend(email), false);
  assert.equal(await kp.claimResend(addr()), true, "another address is not held up");
  const stored = await db.q<{ k: string }>("SELECT k FROM kv WHERE k LIKE 'resend:%' AND k LIKE $1", [`%${email}%`]);
  assert.equal(stored.length, 0, "the address itself is not stored");
});
