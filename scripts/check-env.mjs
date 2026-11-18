// Runs first in scripts/start.sh (house rule 11): in production, refuse to start on settings that would quietly make
// things worse. Not at build time: Railway builds without secrets. Prints names, never values.
const env = process.env, problems = [], notes = [];
const set = k => typeof env[k] === "string" && env[k].trim() !== "";
const has = k => { if (!set(k)) problems.push(`${k} is not set`); else if (env[k] !== env[k].trim()) problems.push(`${k} has spaces at the start or end`); };

if (env.NODE_ENV === "production" || env.RAILWAY_ENVIRONMENT) {
  has("DATABASE_URL");
  // The IP fingerprints stored with stories are salted hashes; with a known salt they can be reversed (all of IPv4 is
  // only 4 billion addresses), and /privacy promises a one-way fingerprint.
  has("MEITHEAL_SALT"); if (set("MEITHEAL_SALT") && env.MEITHEAL_SALT.length < 16) problems.push("MEITHEAL_SALT is shorter than 16 characters");
  has("NEXT_PUBLIC_SITE_URL");
  if (set("NEXT_PUBLIC_SITE_URL")) { try { const u = new URL(env.NEXT_PUBLIC_SITE_URL); if (u.protocol !== "https:") problems.push("NEXT_PUBLIC_SITE_URL is not https"); } catch { problems.push("NEXT_PUBLIC_SITE_URL is not a URL"); } }
  // All or nothing: half a mail or storage setup fails at the first send or upload instead of at boot.
  for (const [name, keys] of [["mail", ["MAIL_SMTP_HOST", "MAIL_SMTP_USER", "MAIL_SMTP_PASS"]], ["R2", ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]]]) {
    const n = keys.filter(set).length;
    if (n && n < keys.length) problems.push(`${name} is half set: missing ${keys.filter(k => !set(k)).join(", ")}`);
    if (!n) notes.push(`${name} is off`);
  }
  if (set("MAIL_SMTP_PORT") && !/^\d+$/.test(env.MAIL_SMTP_PORT)) problems.push("MAIL_SMTP_PORT is not a number");
  if (set("BRIEF_AT") && !/^\d\d:\d\d$/.test(env.BRIEF_AT)) problems.push("BRIEF_AT is not HH:MM");
  if (set("BRIEF_TO") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.BRIEF_TO)) problems.push("BRIEF_TO is not an email address");
}
if (notes.length) console.warn(`check-env: ${notes.join("; ")} (see /api/health)`);
if (problems.length) { console.error(`check-env: not starting:\n  - ${problems.join("\n  - ")}`); process.exit(1); }
console.log("check-env: ok");
