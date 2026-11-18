// Applies migrations/*.sql in order, once each. Runs on every start (see package.json).
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:5433/meitheal";
const client = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1|\.railway\.internal/.test(url) ? false : { rejectUnauthorized: false } });
await client.connect();
await client.query("CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
const done = new Set((await client.query("SELECT name FROM _migrations")).rows.map(r => r.name));
for (const file of readdirSync(new URL("../migrations/", import.meta.url)).filter(f => f.endsWith(".sql")).sort()) {
  if (done.has(file)) continue;
  const sql = readFileSync(new URL(`../migrations/${file}`, import.meta.url), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log("migrate: applied", file);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("migrate: failed", file, err);
    process.exit(1);
  }
}
await client.end();
