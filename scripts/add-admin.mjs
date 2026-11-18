// Recovery: make someone an admin and the owner, and print a one-use sign-in link, from the server itself.
//   railway ssh "cd /app && node scripts/add-admin.mjs you@example.ie 'Your Name'"
// Use it if every admin is locked out (the admin key stops working once an admin has signed in).
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

const [email, name = "Admin"] = process.argv.slice(2);
if (!email?.includes("@")) { console.error("usage: node scripts/add-admin.mjs email [name]"); process.exit(1); }
const url = process.env.DATABASE_URL;
const c = new pg.Client({ connectionString: url, ssl: /localhost|127\.0\.0\.1|\.railway\.internal/.test(url ?? "") ? false : { rejectUnauthorized: false } });
await c.connect();
// Whoever can run this has the server, so they become the owner (there is one owner).
await c.query("UPDATE users SET owner = false WHERE owner AND email <> $1", [email.toLowerCase()]);
const u = (await c.query("INSERT INTO users (email, name, role, owner) VALUES ($1, $2, 'admin', true) ON CONFLICT (email) DO UPDATE SET role = 'admin', owner = true, disabled = false RETURNING id", [email.toLowerCase(), name])).rows[0];
const token = randomBytes(24).toString("base64url");
await c.query("INSERT INTO logins (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '15 minutes')", [createHash("sha256").update(token).digest("hex"), u.id]);
await c.query("INSERT INTO audit (user_id, action, detail) VALUES ($1, 'add-admin script', $2)", [u.id, email]);
await c.end();
console.log(`${email} is an admin. Sign in within 15 minutes: ${(process.env.NEXT_PUBLIC_SITE_URL || "https://meitheal2027.ie").replace(/\/$/, "")}/desk/login?t=${token}`);
