import { BRIEF_TO, briefSchedule } from "@/lib/brief";
import { one } from "@/lib/db";
import { kvGet } from "@/lib/kv";
import { mailOn } from "@/lib/mail";
import { mediaBackend } from "@/lib/media";
import { scanOn } from "@/lib/scan";
import { stats } from "@/lib/stories";
export const dynamic = "force-dynamic";

/**
 * Railway's health check and the one place to see whether everything that runs quietly is running (house rule 6).
 * Stays 200 while the database answers, so a mail outage never fails a deploy; anything degraded is listed in warnings.
 * No secrets and no personal data: the brief's address is shown only by its domain.
 */
export async function GET() {
  try {
    const [s, lastRun, retentionRun, stuck] = await Promise.all([
      stats(),
      kvGet("brief_last_run"),
      kvGet("retention_last_run"),
      // A story's check runs just after it is sent; one that never finished (a restart mid-check) waits for a second look.
      one<{ n: number }>("SELECT count(*)::int AS n FROM stories WHERE scan IS NULL AND status IN ('pending', 'kept') AND created_at < now() - interval '15 minutes' AND source_url IS NULL"),
    ]);
    const brief = { schedule: briefSchedule(), to_domain: BRIEF_TO.split("@")[1] ?? null, last_run: lastRun ? JSON.parse(lastRun) : null };
    const checks = { text: !!process.env.ANTHROPIC_API_KEY, media: scanOn };
    const retention = retentionRun ? JSON.parse(retentionRun) as { at: string; accounts?: number; audit?: number; error?: string } : null;
    const warnings = [
      !mailOn && "mail is off: keeper links, sign-in links and the brief are only written to the log",
      mediaBackend !== "r2" && "recordings and photos are stored in Postgres, not R2",
      !checks.text && "the story check is off (no ANTHROPIC_API_KEY): every story waits for a person",
      !checks.media && "the photo and recording checks are off (no CLOUDFLARE_AI_TOKEN)",
      brief.schedule.startsWith("off") && `the daily brief is ${brief.schedule}`,
      brief.last_run && !brief.last_run.sent && brief.last_run.why !== "nothing_to_say" && `the last brief did not go out (${brief.last_run.why})`,
      retention?.error && `the retention job failed: ${retention.error}`,
      retention && Date.now() - new Date(retention.at).getTime() > 2 * 86400e3 && "the retention job has not run for two days",
      (stuck?.n ?? 0) > 0 && `${stuck!.n} waiting ${stuck!.n === 1 ? "story has" : "stories have"} no check result`,
    ].filter(Boolean);
    return Response.json({ ok: true, ...s, mail: mailOn, media: mediaBackend, checks, brief, retention, warnings }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) { console.error("health", e); return Response.json({ ok: false, error: "database" }, { status: 500 }); }
}
