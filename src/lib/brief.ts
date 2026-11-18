import "server-only";
import { q } from "./db";
import { kvClaim, kvGet, kvSet } from "./kv";
import { escapeHtml, mailOn, sendMail } from "./mail";

/**
 * The daily brief: one email a day at BRIEF_AT (Europe/Dublin, default 19:00) to BRIEF_TO (default hello@rawbyte.ie)
 * with the stories that arrived since the last brief, the pending total and anything a check flagged, one link per
 * story to the reading desk. Nothing goes out on a day with nothing new, nothing pending and nothing flagged.
 *
 * The scheduler (startBriefScheduler, started from src/instrumentation.ts) checks once a minute and sends on the first
 * minute at or after BRIEF_AT; if the server was down at that time it sends on the next start that day. The day is
 * claimed in the kv table first, so two servers cannot both send. /api/brief previews or sends it on demand.
 */
const TZ = "Europe/Dublin";
export const BRIEF_TO = process.env.BRIEF_TO || "hello@rawbyte.ie";
const AT = process.env.BRIEF_AT ?? "19:00";
const AT_OK = /^\d\d:\d\d$/.test(AT);
/** Whether the scheduler runs, and if not why (shown in /api/health). */
export const briefSchedule = () => AT_OK ? `daily at ${AT} Irish time` : `off: BRIEF_AT "${AT}" is not HH:MM`;
/** A failed send is tried again after this long, until the day is over. */
const RETRY_MS = 15 * 60e3;
const site =() => (process.env.NEXT_PUBLIC_SITE_URL || "https://meitheal2027.ie").replace(/\/$/, "");

function dublin(now = new Date()): { day: string; hm: string } {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hm: `${p.hour === "24" ? "00" : p.hour}:${p.minute}` };
}

type Row = { id: string; created_at: string; status: string; title: string; county: string; townland_en: string; teller_name: string; collector_name: string; collector_age: string | null; school: string | null; class_name: string | null; lang: string; lang_other: string | null; from_place: string | null; from_country: string | null; words: number; flags: number; audio: number; photos: number; verdicts: string[] };

export type Brief = { subject: string; text: string; html: string; since: string; fresh: number; pending: number; flagged: number; empty: boolean };

/** Everything since `since` (default: the last brief, or 24 hours). */
export async function buildBrief(since?: string): Promise<Brief> {
  const from = since ?? (await kvGet("brief_last_at")) ?? new Date(Date.now() - 864e5).toISOString();
  const fresh = await q<Row>(`SELECT s.id, s.created_at, s.status, s.title, s.county, s.townland_en, s.teller_name, s.collector_name, s.collector_age, s.school, s.class_name, s.lang, s.lang_other, s.from_place, s.from_country, s.words,
      (SELECT count(*) FROM flags f WHERE f.story_id = s.id)::int AS flags,
      (SELECT count(*) FROM media m WHERE m.story_id = s.id AND m.kind = 'audio')::int AS audio,
      (SELECT count(*) FROM media m WHERE m.story_id = s.id AND m.kind = 'photo')::int AS photos,
      coalesce((SELECT array_agg(m.kind || ' ' || m.scan ORDER BY m.id) FROM media m WHERE m.story_id = s.id AND m.scan IS NOT NULL AND m.scan NOT LIKE 'safe%'), '{}')
        || CASE WHEN s.scan IS NOT NULL AND s.scan NOT LIKE 'safe%' THEN ARRAY['text ' || s.scan] ELSE '{}'::text[] END AS verdicts
    FROM stories s WHERE s.created_at > $1 AND s.status <> 'removed' ORDER BY s.created_at`, [from]);
  const pending = (await q<{ n: number }>("SELECT count(*)::int AS n FROM stories WHERE status = 'pending'"))[0]?.n ?? 0;
  const flaggedRows = await q<{ id: string; title: string; n: number }>("SELECT s.id, s.title, count(f.*)::int AS n FROM stories s JOIN flags f ON f.story_id = s.id WHERE s.status = 'approved' GROUP BY s.id, s.title ORDER BY n DESC LIMIT 20");
  const desk = (s: { id: string; status: string }) => `${site()}/desk?tab=${s.status === "approved" ? "approved" : "pending"}#${s.id}`;

  const lines: string[] = [], hlines: string[] = [];
  const title = `${fresh.length} new ${fresh.length === 1 ? "story" : "stories"}, ${pending} waiting${flaggedRows.length ? `, ${flaggedRows.length} flagged` : ""}`;
  lines.push(`Meitheal 2027, the reading desk. ${title}.`, "");
  hlines.push(`<p><b>Meitheal 2027, the reading desk.</b> ${escapeHtml(title)}.</p>`);
  for (const s of fresh) {
    const who = `${s.teller_name} to ${s.collector_name}${s.collector_age ? ` (${s.collector_age})` : ""}${s.school ? `, ${s.school}${s.class_name ? ` ${s.class_name}` : ""}` : ", family"}`;
    const bits = [`${s.words} words`, s.audio ? `${s.audio} recording${s.audio > 1 ? "s" : ""}` : "", s.photos ? `${s.photos} photo${s.photos > 1 ? "s" : ""}` : "", s.lang === "ga" ? "in Irish" : s.lang === "both" ? "Irish and English" : s.lang === "other" ? `in ${s.lang_other ?? "another language"}` : "", s.from_country ? `from ${[s.from_place, s.from_country].filter(Boolean).join(", ")}` : ""].filter(Boolean).join(", ");
    const warn = s.verdicts.map(v => v.replace(/^(audio|photo|text) /, (_, k) => (k === "audio" ? "recording " : k === "text" ? "story " : "photo ")).replace(/_/g, " ")).join("; ");
    const when = new Date(s.created_at).toLocaleString("en-IE", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit" });
    lines.push(`• ${s.title} — ${s.townland_en}, Co. ${s.county} — ${who}`, `  ${bits}. ${when}${s.status !== "pending" ? `, ${s.status}` : ""}${warn ? `. CHECK: ${warn}` : ""}`, `  ${desk(s)}`, "");
    hlines.push(`<p><a href="${desk(s)}"><b>${escapeHtml(s.title)}</b></a> — ${escapeHtml(s.townland_en)}, Co. ${escapeHtml(s.county)} — ${escapeHtml(who)}<br><span style="color:#666">${escapeHtml(bits)}. ${when}${s.status !== "pending" ? `, ${s.status}` : ""}</span>${warn ? `<br><span style="color:#b3261e">Check: ${escapeHtml(warn)}</span>` : ""}</p>`);
  }
  if (!fresh.length) { lines.push("Nothing new since the last brief.", ""); hlines.push("<p>Nothing new since the last brief.</p>"); }
  if (flaggedRows.length) {
    lines.push("Published stories readers have flagged:", ...flaggedRows.map(f => `• ${f.title} (${f.n}) ${desk({ id: f.id, status: "approved" })}`), "");
    hlines.push(`<p><b>Published stories readers have flagged</b></p>${flaggedRows.map(f => `<p><a href="${desk({ id: f.id, status: "approved" })}">${escapeHtml(f.title)}</a> (${f.n})</p>`).join("")}`);
  }
  if (pending) { lines.push(`${pending} waiting on the desk: ${site()}/desk`); hlines.push(`<p><a href="${site()}/desk">${pending} waiting on the desk</a></p>`); }
  // Families' changes to the written-out text of published stories (src/lib/transcript.ts, CHANGED_SQL).
  const written = (await q<{ n: number }>("SELECT count(*)::int AS n FROM stories WHERE status = 'approved' AND transcript IS DISTINCT FROM transcript_public"))[0]?.n ?? 0;
  if (written) { lines.push(`${written} written-out ${written === 1 ? "text" : "texts"} to read: ${site()}/desk?tab=written`); hlines.push(`<p><a href="${site()}/desk?tab=written">${written} written-out ${written === 1 ? "text" : "texts"} to read</a></p>`); }
  return { subject: `Meitheal: ${title}`, text: lines.join("\n"), html: hlines.join("\n"), since: from, fresh: fresh.length, pending, flagged: flaggedRows.length, empty: !fresh.length && !pending && !flaggedRows.length && !written };
}

/** Build and send today's brief, then move the "since" marker. Returns what happened. */
export async function sendBrief(force = false): Promise<{ sent: boolean; why?: string; brief: Brief }> {
  const started = new Date().toISOString();
  const brief = await buildBrief();
  let r: { sent: boolean; why?: string } = { sent: false, why: "nothing_to_say" };
  if (!brief.empty || force) r = await sendMail({ to: BRIEF_TO, subject: brief.subject, text: brief.text, html: brief.html });
  if (r.sent || !mailOn || r.why === "nothing_to_say") await kvSet("brief_last_at", started);
  return { ...r, brief };
}

/** A reader flagged a published story: say so now rather than at seven. */
export async function flagMail(story: { id: string; title: string; status: string }, reason: string, n: number): Promise<void> {
  if (story.status !== "approved" && story.status !== "pending") return;
  const link = `${site()}/desk?tab=${n >= 2 ? "pending" : "approved"}#${story.id}`;
  await sendMail({ to: BRIEF_TO, subject: `Meitheal: "${story.title}" flagged${n >= 2 ? " and taken down" : ""}`, text: `A reader flagged a published story${n >= 2 ? "; it is the second flag, so it is back to pending and off the map" : ""}.\n\n${story.title}\nReason: ${reason}\n\n${link}`, html: `<p>A reader flagged a published story${n >= 2 ? "; it is the second flag, so it is back to pending and off the map" : ""}.</p><p><a href="${link}"><b>${escapeHtml(story.title)}</b></a><br>Reason: ${escapeHtml(reason)}</p>` });
}

export function startBriefScheduler(): void {
  const g = globalThis as unknown as { __brief?: boolean };
  if (g.__brief) return;
  if (!AT_OK) { console.error(`brief: ${briefSchedule()}; the daily brief will not go out`); return; }
  g.__brief = true;
  const tick = async () => {
    const { day, hm } = dublin();
    if (hm < AT) return;
    try {
      if (Date.now() < Number((await kvGet("brief_retry_at")) ?? 0)) return;
      if (!(await kvClaim("brief_day", day))) return;
      const r = await sendBrief();
      // Every run is recorded for /api/health (house rule: every job shows its last run).
      await kvSet("brief_last_run", JSON.stringify({ at: new Date().toISOString(), day, sent: r.sent, why: r.why ?? null }));
      console.log(`brief: ${day} ${r.sent ? "sent" : "not sent"}${r.why ? ` (${r.why})` : ""}: ${r.brief.subject}`);
      // A send that failed (not a quiet day, not mail switched off) gives the day back, to be tried again in 15 minutes.
      if (!r.sent && mailOn && r.why !== "nothing_to_say") { await kvSet("brief_day", `failed:${day}`); await kvSet("brief_retry_at", String(Date.now() + RETRY_MS)); }
    } catch (e) { console.error("brief", e); }
  };
  setTimeout(tick, 15000).unref();
  setInterval(tick, 60000).unref();
}
