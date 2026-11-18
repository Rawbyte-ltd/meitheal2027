import "server-only";
import { q } from "./db.ts";
import { keeperSecret, sha256 } from "./token.ts";

/** One keeper-link email per address per this long, known address or not (audit item 12). */
export const RESEND_EVERY = "1 hour";

/**
 * Claim this address's turn to be sent keeper links. Atomic, in the database, so it survives deploys and holds across
 * instances. The key is a hash of the address: an address nobody used is never stored in the clear.
 */
export async function claimResend(email: string): Promise<boolean> {
  return (await q(`INSERT INTO kv (k, v) VALUES ($1, 'resend') ON CONFLICT (k) DO UPDATE SET updated_at = now()
    WHERE kv.updated_at < now() - interval '${RESEND_EVERY}' RETURNING k`, [`resend:${sha256(email)}`])).length > 0;
}

/**
 * Reissue the keeper links for every story under this email. Only a hash of each secret is kept, so a lost link is
 * replaced, not resent, and the old one stops working: a family whose link leaked can kill it this way.
 * The new secrets are saved only after the email has gone. If sending fails, the old links still work.
 */
export async function reissueKeeperLinks(email: string, site: string, send: (links: { title: string; url: string }[]) => Promise<boolean>): Promise<"sent" | "failed"> {
  const rows = await q<{ id: string; title: string }>("SELECT id, title FROM stories WHERE contact_email = $1 AND status <> 'removed' ORDER BY created_at", [email]);
  const fresh = rows.map(r => ({ ...r, secret: keeperSecret() }));
  const ok = await send(fresh.map(r => ({ title: r.title, url: `${site}/keep/${r.id}?k=${encodeURIComponent(r.secret)}` })));
  if (!ok) return "failed";
  for (const r of fresh) await q("UPDATE stories SET secret_hash = $2, updated_at = now() WHERE id = $1 AND status <> 'removed'", [r.id, sha256(r.secret)]);
  return "sent";
}
