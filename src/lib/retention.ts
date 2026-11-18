import "server-only";
import { q } from "./db.ts";
import { kvClaim, kvSet } from "./kv.ts";

/**
 * Retention for the reading desk (docs/data-protection.md §2), run once a day:
 * - A teacher or reader account is anonymised 12 months after it was last used (or invited, if never used). Stories and
 *   the audit trail point at the account, so the row stays as "[deleted]" and the decisions stay accountable; every
 *   personal detail on it goes, and so do its sign-ins. The owner's account is never touched.
 * - Audit rows older than 3 years are deleted.
 * Each run is recorded for /api/health.
 */
export const ACCOUNT_MONTHS = 12, AUDIT_YEARS = 3;

export async function runRetention(): Promise<{ accounts: number; audit: number }> {
  const gone = await q<{ id: number }>(`UPDATE users SET email = 'deleted-' || id || '@deleted.invalid', name = '[deleted]', county = NULL, school = NULL,
      class_name = NULL, nominated_by = NULL, disabled = true
    WHERE NOT owner AND email NOT LIKE 'deleted-%@deleted.invalid' AND coalesce(last_seen, created_at) < now() - interval '${ACCOUNT_MONTHS} months'
    RETURNING id`);
  if (gone.length) { const ids = gone.map(g => g.id); await q("DELETE FROM sessions WHERE user_id = ANY($1)", [ids]); await q("DELETE FROM logins WHERE user_id = ANY($1)", [ids]); }
  const audit = await q(`DELETE FROM audit WHERE at < now() - interval '${AUDIT_YEARS} years' RETURNING id`);
  return { accounts: gone.length, audit: audit.length };
}

export function startRetentionScheduler(): void {
  const g = globalThis as unknown as { __retention?: boolean };
  if (g.__retention) return;
  g.__retention = true;
  const tick = async () => {
    const day = new Date().toISOString().slice(0, 10);
    try {
      if (!(await kvClaim("retention_day", day))) return;
      const r = await runRetention();
      await kvSet("retention_last_run", JSON.stringify({ at: new Date().toISOString(), ...r }));
      if (r.accounts || r.audit) console.log(`retention: ${r.accounts} desk account(s) anonymised, ${r.audit} audit row(s) deleted`);
    } catch (e) { console.error("retention", e); await kvSet("retention_last_run", JSON.stringify({ at: new Date().toISOString(), error: String(e).slice(0, 200) })); }
  };
  setTimeout(tick, 30000).unref();
  setInterval(tick, 3600e3).unref();
}
