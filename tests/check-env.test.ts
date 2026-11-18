import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// scripts/check-env.mjs runs first in start.sh: production must not start on settings that quietly make things worse.
const run = (env: Record<string, string>) => spawnSync(process.execPath, ["scripts/check-env.mjs"], { env: { PATH: process.env.PATH ?? "", ...env }, encoding: "utf8" });
const good = { NODE_ENV: "production", DATABASE_URL: "postgres://x", MEITHEAL_SALT: "a-long-enough-salt-value", NEXT_PUBLIC_SITE_URL: "https://meitheal2027.ie" };

test("a complete production setup starts", () => assert.equal(run(good).status, 0));
test("no salt: refuses (the IP fingerprints could be reversed)", () => { const r = run({ ...good, MEITHEAL_SALT: "" }); assert.equal(r.status, 1); assert.match(r.stderr, /MEITHEAL_SALT/); });
test("a short salt: refuses", () => assert.equal(run({ ...good, MEITHEAL_SALT: "salt" }).status, 1));
test("half a mail setup: refuses, naming what is missing", () => { const r = run({ ...good, MAIL_SMTP_HOST: "smtp" }); assert.equal(r.status, 1); assert.match(r.stderr, /MAIL_SMTP_USER/); });
test("a site address that is not https: refuses", () => assert.equal(run({ ...good, NEXT_PUBLIC_SITE_URL: "http://meitheal2027.ie" }).status, 1));
test("a value with a trailing space: refuses", () => assert.equal(run({ ...good, DATABASE_URL: "postgres://x " }).status, 1));
test("development is not checked", () => assert.equal(run({ NODE_ENV: "development" }).status, 0));
