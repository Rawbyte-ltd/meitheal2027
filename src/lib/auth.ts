import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers.js";
import { one, q } from "./db.ts";
import { escapeHtml, sendMail } from "./mail.ts";
import { adminOk, sha256 } from "./token.ts";

/**
 * The reading desk's people (migrations/006_roles.sql). Admins see everything; a teacher sees the pending stories of
 * their own school (and class, if set) in their county; a reader sees their county's pending stories that came without
 * a school, plus school stories a teacher passed but a check wants a person for.
 *
 * Sign-in: an emailed link, valid 15 minutes and used once, opens a page with a button (so mail scanners that follow
 * links cannot use it up); the button starts a 30-day session in the `desk` cookie. No passwords.
 *
 * The owner (users.owner, migrations/007_owner.sql) is the one admin who can invite, disable and re-enable admins.
 *
 * ADMIN_KEY still works as the admin (?key=) until the first admin user exists, so the desk can be set up and nobody is
 * locked out. After that, scripts/add-admin.mjs recovers access from the server.
 */
export type Role = "admin" | "teacher" | "reader";
export type User = { id: number; email: string; name: string; role: Role; county: string | null; school: string | null; class_name: string | null; nominated_by: string | null; disabled: boolean; owner: boolean; created_at: string; last_seen: string | null };
/** Who is at the desk. `user` is null when the admin key is being used. */
export type Actor = { user: User | null; role: Role; key: string | null };
/** May this person invite or switch off admins? The owner, or the key while the desk is being set up. */
export const managesAdmins = (a: Actor) => a.role === "admin" && (!a.user || a.user.owner);

const COOKIE = "desk";
const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://meitheal2027.ie").replace(/\/$/, "");
export const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[^a-z0-9áéíóú]+/g, "");

/** An admin who has signed in at least once. Until then the key keeps working, so inviting the first admin cannot lock anyone out. */
export const adminExists = async () => !!(await one<{ id: number }>("SELECT id FROM users WHERE role = 'admin' AND NOT disabled AND last_seen IS NOT NULL LIMIT 1"));

/** The person at the desk, from the session cookie, or the admin key while no admin user exists. */
export async function deskActor(key?: string | null): Promise<Actor | null> {
  const tok = (await cookies()).get(COOKIE)?.value;
  if (tok) {
    const u = await one<User>("SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = $1 AND s.expires_at > now() AND NOT u.disabled", [sha256(tok)]);
    if (u) {
      if (!u.last_seen || Date.now() - new Date(u.last_seen).getTime() > 3600e3) await q("UPDATE users SET last_seen = now() WHERE id = $1", [u.id]);
      return { user: u, role: u.role, key: null };
    }
  }
  if (key && adminOk(key) && !(await adminExists())) return { user: null, role: "admin", key };
  return null;
}

/** `norm` in SQL: a school or class name compared without case, spaces or punctuation. */
export const normSql = (col: string) => `regexp_replace(lower(coalesce(${col}, '')), '[^a-z0-9áéíóú]+', '', 'g')`;

/** SQL condition (on table alias s) and params for the stories this person may review. */
export function scopeSql(a: Actor, startAt = 1): { where: string; params: unknown[] } {
  if (a.role === "admin" || !a.user) return { where: "true", params: [] };
  const u = a.user, p: unknown[] = [];
  const $ = (v: unknown) => { p.push(v); return `$${startAt + p.length - 1}`; };
  if (u.role === "teacher") {
    // A teacher is scoped by school name and county (and class, if set). Without a county the name alone would match every
    // school of that name in Ireland, so it matches nothing instead. Two same-named schools in one county still share a
    // queue: the fix is a roll number on the school, which changes the family form (docs/AUDIT-2026-11-04.md, item 13).
    if (!u.county) return { where: "false", params: [] };
    const parts = [`${normSql("s.school")} = ${$(norm(u.school))}`, `${$(norm(u.school))} <> ''`, `s.county = ${$(u.county)}`];
    if (norm(u.class_name)) parts.push(`${normSql("s.class_name")} = ${$(norm(u.class_name))}`);
    parts.push("s.source_url IS NULL"); // the 1937 examples are not a class's stories (migrations/011)
    return { where: parts.join(" AND "), params: p };
  }
  // reader: their county; stories with no school, or school stories a teacher passed to a second look
  return { where: `s.county = ${$(u.county ?? "")} AND (coalesce(trim(s.school), '') = '' OR s.second_look) AND s.source_url IS NULL`, params: p };
}

/** Can this person see this story (and its media) before it is published? */
export async function canSee(a: Actor, storyId: string): Promise<boolean> {
  if (a.role === "admin") return true;
  // Their queue, plus anything they reviewed themselves (the "done by me" list).
  const sc = scopeSql(a, 3);
  return !!(await one<{ id: string }>(`SELECT s.id FROM stories s WHERE s.id = $1 AND ((${sc.where}) OR s.reviewed_by = $2)`, [storyId, a.user?.id ?? 0, ...sc.params]));
}

export async function audit(a: Actor | null, storyId: string | null, action: string, detail?: string) {
  await q("INSERT INTO audit (user_id, story_id, action, detail) VALUES ($1, $2, $3, $4)", [a?.user?.id ?? null, storyId, action, detail ?? null]);
}

/** Email a sign-in link if the address belongs to an active user. Says nothing either way to the caller. */
export async function sendLoginLink(email: string, invite?: { by: string; role: Role; scope: string }): Promise<boolean> {
  const u = await one<User>("SELECT * FROM users WHERE email = $1 AND NOT disabled", [email.trim().toLowerCase()]);
  if (!u) return false;
  const recent = await one<{ n: number }>("SELECT count(*)::int AS n FROM logins WHERE user_id = $1 AND created_at > now() - interval '15 minutes'", [u.id]);
  if ((recent?.n ?? 0) >= 3) return false;
  const token = randomBytes(24).toString("base64url");
  await q("INSERT INTO logins (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '15 minutes')", [sha256(token), u.id]);
  const link = `${site()}/desk/login?t=${token}`;
  const what = u.role === "teacher" ? "approve your class's stories" : u.role === "reader" ? "read stories for your county" : "run the reading desk";
  const head = invite ? `${invite.by} has asked you to ${what} on Meitheal 2027 (${invite.scope}).` : `Here is your link to the Meitheal 2027 reading desk.`;
  const text = `${head}\n\nSign in (the link works once, for 15 minutes):\n${link}\n\nIf it has run out, ask for a new one at ${site()}/desk.\n\nMeitheal 2027: the Schools' Collection, done again.`;
  const html = `<p>${escapeHtml(head)}</p><p><a href="${link}"><b>Sign in to the reading desk</b></a></p><p style="color:#6b6457">The link works once, for 15 minutes. If it has run out, ask for a new one at <a href="${site()}/desk">${site().replace(/^https?:\/\//, "")}/desk</a>.</p>`;
  await sendMail({ to: u.email, subject: invite ? "You're invited to the Meitheal 2027 reading desk" : "Your Meitheal 2027 sign-in link", text, html });
  return true;
}

/** Use a sign-in token: start a session and set the cookie. Returns the user, or null if the link is used or old. */
export async function useLoginToken(token: string): Promise<User | null> {
  const row = await one<{ user_id: number }>("UPDATE logins SET used_at = now() WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() RETURNING user_id", [sha256(token)]);
  if (!row) return null;
  const u = await one<User>("SELECT * FROM users WHERE id = $1 AND NOT disabled", [row.user_id]);
  if (!u) return null;
  const session = randomBytes(32).toString("base64url");
  await q("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '30 days')", [sha256(session), u.id]);
  (await cookies()).set(COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600 });
  await q("UPDATE users SET last_seen = now() WHERE id = $1", [u.id]);
  return u;
}

export async function signOut() {
  const c = await cookies(), tok = c.get(COOKIE)?.value;
  if (tok) await q("DELETE FROM sessions WHERE token_hash = $1", [sha256(tok)]);
  c.delete(COOKIE);
}

export const scopeLabel = (u: Pick<User, "role" | "county" | "school" | "class_name">) =>
  u.role === "admin" ? "everything" : u.role === "teacher" ? [u.school, u.class_name, u.county && `Co. ${u.county}`].filter(Boolean).join(", ") : `Co. ${u.county ?? "?"}, stories without a school`;
