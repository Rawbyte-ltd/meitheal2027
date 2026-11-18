import { test } from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_COLS } from "../src/lib/stories.ts";

// PUBLIC_COLS feeds /api/stories, /api/story/[id] and the public story page. These never go public: the class narrows
// a child down too far (the About page promises first name, age band and school, not class); the rest are private by
// design (docs/data-protection.md §2).
const cols = PUBLIC_COLS.split(/[\s,]+/).map(c => c.trim());
for (const c of ["class_name", "contact_email", "consent_name", "ip_hash", "secret_hash", "note", "scan_note", "review_note"]) {
  test(`${c} is not a public column`, () => assert.ok(!cols.includes(c), `${c} must not be in PUBLIC_COLS`));
}
test("what the About page promises is public", () => {
  for (const c of ["teller_name", "teller_born", "collector_name", "collector_age", "school", "townland_en"]) assert.ok(cols.includes(c), c);
});

import { storyIdOf } from "../src/lib/stories.ts";
// Audit item 11: ids were cut at 20 characters, so the longer 1937 example ids matched nothing at the desk or the flag form.
test("storyIdOf keeps every id the site uses, whole", () => {
  for (const id of ["4dnrmysdhz", "d1937-holy-wells", "d1937-a-ghost-story-kilkelly", "d1937-how-we-spend-christmas"]) assert.equal(storyIdOf(id), id);
});
test("storyIdOf refuses what can't be an id", () => {
  for (const v of ["", " ", "x'; DROP TABLE stories;--", "../etc", "ABC", null, undefined, "a".repeat(61)]) assert.equal(storyIdOf(v), "");
});

import { clientIp } from "../src/lib/token.ts";
// Audit item 29: one helper for the visitor's address; Railway's edge sets X-Real-IP.
test("clientIp prefers X-Real-IP, then the first X-Forwarded-For entry", () => {
  assert.equal(clientIp(new Request("http://x", { headers: { "x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9, 1.2.3.4" } })), "1.2.3.4");
  assert.equal(clientIp(new Request("http://x", { headers: { "x-forwarded-for": "5.6.7.8, 10.0.0.1" } })), "5.6.7.8");
  assert.equal(clientIp(new Request("http://x")), "local");
});
