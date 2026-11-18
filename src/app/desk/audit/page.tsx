import { notFound } from "next/navigation";
import { deskActor } from "@/lib/auth";
import { q } from "@/lib/db";
export const dynamic = "force-dynamic";
export const metadata = { title: "Audit trail", robots: { index: false } };

export default async function Audit({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const sp = await searchParams, a = await deskActor(sp.key);
  if (!a || a.role !== "admin") notFound();
  const rows = await q<{ id: number; at: string; who: string | null; role: string | null; story_id: string | null; title: string | null; action: string; detail: string | null }>(
    "SELECT a.id, a.at, u.name AS who, u.role, a.story_id, s.title, a.action, a.detail FROM audit a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN stories s ON s.id = a.story_id ORDER BY a.at DESC LIMIT 300");
  const keyQs = a.key ? `?key=${encodeURIComponent(a.key)}` : "";
  return (
    <main className="wrap">
      <section>
        <div className="kicker"><a href={`/desk${keyQs}`}>The reading desk</a> · Audit trail</div>
        <h1>Who did <em>what</em></h1>
        <p className="lead">Every decision on the desk, newest first: approvals, sending back, removals, invitations and sign-ins.</p>
      </section>
      {rows.length ? <table className="lb"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Story</th><th>Detail</th></tr></thead><tbody>
        {rows.map(r => <tr key={r.id}><td className="small">{new Date(r.at).toLocaleString("en-IE")}</td><td>{r.who ?? (r.action.endsWith(":family") ? "the family" : "admin key")}{r.role ? <div className="muted small">{r.role}</div> : null}</td><td>{r.action}</td><td>{r.title ?? r.story_id ?? ""}</td><td className="muted small">{r.detail ?? ""}</td></tr>)}
      </tbody></table> : <p className="muted">Nothing yet.</p>}
    </main>
  );
}
