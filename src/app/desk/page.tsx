import { deskActor, scopeLabel, scopeSql, type Actor } from "@/lib/auth";
import ConfirmButton from "./ConfirmButton";
import { collectionBySlug } from "@/lib/collections";
import { q } from "@/lib/db";
import { listMedia, mediaBackend } from "@/lib/media";
import { autoPublish } from "@/lib/review";
import { scanOn } from "@/lib/scan";
import { farOf } from "@/lib/i18n";
import { headingOf, paragraphs, PUBLIC_COLS, type Story } from "@/lib/stories";
import { topicBySlug } from "@/lib/topics";
import { CHANGED_SQL, WRITTEN_COLS, type Written } from "@/lib/transcript";
import Media, { Verdict } from "@/app/Media";
export const dynamic = "force-dynamic";
export const metadata = { title: "The reading desk", robots: { index: false } };

type Row = Story & Written & { contact_email: string | null; consent_name: string; note: string | null; scan: string | null; scan_note: string | null; flags: number; second_look: boolean; review_note: string | null; reviewed_at: string | null; reviewer: string | null };
type Tab = { slug: string; label: string; where: string };

const TABS: Record<string, Tab[]> = {
  admin: [
    { slug: "pending", label: "Waiting", where: "s.status = 'pending' AND NOT s.second_look" },
    { slug: "second", label: "Second look", where: "s.status = 'pending' AND s.second_look" },
    { slug: "without", label: "Published without me", where: "s.status = 'approved' AND s.reviewed_by IS NOT NULL AND (SELECT role FROM users WHERE id = s.reviewed_by) <> 'admin'" },
    { slug: "approved", label: "Published", where: "s.status = 'approved'" },
    { slug: "kept", label: "Copybook only", where: "s.status = 'kept'" },
    { slug: "written", label: "Transcripts", where: CHANGED_SQL },
    { slug: "rejected", label: "Sent back", where: "s.status = 'rejected'" },
    { slug: "removed", label: "Removed", where: "s.status = 'removed'" },
  ],
  teacher: [
    { slug: "pending", label: "Waiting", where: "s.status = 'pending' AND NOT s.second_look" },
    { slug: "written", label: "Transcripts", where: CHANGED_SQL },
    { slug: "kept", label: "Copybook only", where: "s.status = 'kept'" },
    { slug: "done", label: "Done by me", where: "s.reviewed_by = $ME" },
  ],
  reader: [
    { slug: "pending", label: "Waiting", where: "s.status = 'pending'" },
    { slug: "written", label: "Transcripts", where: CHANGED_SQL },
    { slug: "done", label: "Done by me", where: "s.reviewed_by = $ME" },
  ],
};

function SignIn({ sent, expired, out }: { sent?: string; expired?: string; out?: string }) {
  return (
    <main className="wrap" style={{ maxWidth: 560, paddingTop: 50 }}>
      <div className="kicker">The reading desk</div>
      <h1>Sign <em>in</em></h1>
      <p className="lead">For teachers, county readers and the Meitheal team. Put in the email address you were invited with and a sign-in link will come to it.</p>
      {sent && <p className="ok">If that address is on the desk, a link is on its way. It works once, for 15 minutes.</p>}
      {expired && <p className="notice">That link has been used or has run out. Ask for a new one.</p>}
      {out && <p className="ok">Signed out.</p>}
      <form method="post" action="/api/desk/login" className="sheet copybook">
        <label>Email<input name="email" type="email" required autoComplete="email" /></label>
        <button className="btn" type="submit">Send me a link</button>
      </form>
    </main>
  );
}

function Buttons({ s, a, tab }: { s: Row; a: Actor; tab: string }) {
  const admin = a.role === "admin", open = s.status === "pending", kept = s.status === "kept";
  // Copybook only is the teacher's, for a family that asks; the same person can put it back on the website.
  const approveLabel = kept ? "Put it on the website" : a.role === "teacher" ? "Approve" : "Publish";
  // A removed story is closed for good (src/lib/review.ts); there is nothing left to act on.
  if (s.status === "removed") return <p className="muted small">Removed for good: its text, names and files are gone.</p>;
  return (
    <form method="post" action="/api/desk/review" className="chips" style={{ margin: 0 }}>
      {a.key && <input type="hidden" name="key" value={a.key} />}
      <input type="hidden" name="id" value={s.id} /><input type="hidden" name="tab" value={tab} />
      <input name="note" placeholder={admin ? "note (sent back: the family sees it)" : "note for the family if you send it back"} maxLength={500} style={{ padding: "7px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit", minWidth: 0, flex: "1 1 220px" }} />
      {(open || kept || admin) && s.status !== "approved" && <button className="btn" name="action" value="approve" style={{ padding: "9px 12px" }}>{approveLabel}</button>}
      {!!s.school?.trim() && (s.status === "approved" || open) && <button className="btn ghost" name="action" value="book" style={{ padding: "9px 12px" }} title="In the class copybook, not on the website">Copybook only</button>}
      {(open || admin) && s.status !== "rejected" && <button className="btn ghost" name="action" value="sendback" style={{ padding: "9px 12px" }}>Send back</button>}
      {admin && s.status !== "pending" && <button className="btn ghost" name="action" value="pending" style={{ padding: "9px 12px" }}>Back to waiting</button>}
      {admin && <button className="btn ghost" name="action" value="feature" style={{ padding: "9px 12px" }}>{s.featured ? "Unfeature" : "Feature"}</button>}
      {admin && s.flags > 0 && <button className="btn ghost" name="action" value="clearflags" style={{ padding: "9px 12px" }}>Clear flags</button>}
      {admin && s.status !== "removed" && <ConfirmButton ask="Remove this story for good? Its recordings, photos, text and names are deleted and cannot be brought back. If it raises a concern about a child, report it to the Designated Liaison Person first: the concern record is kept separately, not here." className="btn red" name="action" value="remove" style={{ padding: "9px 12px" }}>Remove</ConfirmButton>}
    </form>
  );
}

/** The written-out text of a story's recordings (src/lib/transcript.ts): the family's, or the machine's to start from. */
function WrittenOut({ s, a, tab, machine }: { s: Row; a: Actor; tab: string; machine: string }) {
  const published = s.status === "approved", kept = s.status === "kept", changed = (published || kept) && s.transcript !== s.transcript_public;
  const by = s.transcript_by === "family" ? "the family" : s.transcript_by ? `the ${s.transcript_by}` : null;
  const status = s.transcript === null
    ? (machine ? "Nobody has written it out yet. The machine's version is in the box: fix it and save, or leave it for the family." : "Nobody has written it out yet, and there is no machine version (Irish, or still being made).")
    : `${by ? `Written out by ${by}` : "Written out"}${s.transcript_at ? `, ${new Date(s.transcript_at).toLocaleString("en-IE")}` : ""}.${changed ? ` Changed since it was read: the ${kept ? "copybook prints" : "story page shows"} the earlier version until you save.` : ""}`;
  return (
    <form method="post" action="/api/desk/transcript" className="sheet" style={{ marginTop: 14 }}>
      {a.key && <input type="hidden" name="key" value={a.key} />}
      <input type="hidden" name="id" value={s.id} /><input type="hidden" name="tab" value={tab} />
      <label htmlFor={`w-${s.id}`}><b>Written out</b> <span className="muted small">{status}</span></label>
      {s.transcript !== null && s.transcript_by === "family" && <Verdict m={{ kind: "text", scan: s.transcript_scan, scan_note: s.transcript_scan_note }} />}
      <textarea id={`w-${s.id}`} name="text" defaultValue={s.transcript ?? machine} maxLength={20000} style={{ minHeight: 180 }} />
      <div className="chips" style={{ marginTop: 8 }}>
        <button className="btn" type="submit" style={{ padding: "9px 12px" }}>{published ? "Save and publish" : "Save"}</button>
        <span className="muted small">{published ? "It goes on the story page as soon as you save." : kept ? "The copybook prints it as soon as you save." : "Save before you approve: approving publishes the saved text with the story."}</span>
      </div>
    </form>
  );
}

export default async function Desk({ searchParams }: { searchParams: Promise<{ key?: string; tab?: string; msg?: string; sent?: string; expired?: string; out?: string; status?: string }> }) {
  const sp = await searchParams;
  const a = await deskActor(sp.key);
  if (!a) return <SignIn sent={sp.sent} expired={sp.expired} out={sp.out} />;
  const tabs = TABS[a.role], tab = tabs.find(t => t.slug === (sp.tab ?? sp.status)) ?? tabs[0];
  const me = a.user?.id ?? 0;
  // Each tab's condition and its parameters: $1 is the reviewer when the tab uses it, then the scope's own. "Done by me" has no scope.
  const build = (t: Tab) => {
    const usesMe = t.where.includes("$ME"), sc = scopeSql(a, usesMe ? 2 : 1), scoped = t.slug !== "done";
    return { where: `(${t.where.replace("$ME", "$1")})${scoped ? ` AND (${sc.where})` : ""}`, params: [...(usesMe ? [me] : []), ...(scoped ? sc.params : [])] };
  };
  const { where, params } = build(tab);
  const rows = await q<Row>(`SELECT ${PUBLIC_COLS.replaceAll("stories.id", "s.id")}, s.class_name, ${WRITTEN_COLS.split(", ").map(c => `s.${c}`).join(", ")}, s.contact_email, s.consent_name, s.note, s.scan, s.scan_note, s.second_look, s.review_note, s.reviewed_at,
      (SELECT name FROM users WHERE id = s.reviewed_by) AS reviewer, (SELECT count(*) FROM flags f WHERE f.story_id = s.id)::int AS flags
    FROM stories s WHERE ${where} ORDER BY ${tab.slug === "pending" || tab.slug === "second" ? "s.created_at ASC" : "coalesce(s.reviewed_at, s.updated_at) DESC"} LIMIT 100`, params);
  const counts = await Promise.all(tabs.map(async t => { const b = build(t); return (await q<{ n: number }>(`SELECT count(*)::int AS n FROM stories s WHERE ${b.where}`, b.params))[0].n; }));
  const media = await Promise.all(rows.map(r => listMedia(r.id)));
  const keyQs = a.key ? `&key=${encodeURIComponent(a.key)}` : "";
  const size = a.role === "admin" ? (await q<{ mb: number }>("SELECT coalesce(sum(bytes),0)/1048576.0 AS mb FROM media"))[0]?.mb ?? 0 : 0;
  return (
    <main className="wrap">
      <section>
        <div className="kicker">The reading desk · {a.user ? `${a.user.name}, ${a.role} (${scopeLabel(a.user)})` : "admin key"}{a.role === "admin" && ` · media on ${mediaBackend}, ${Number(size).toFixed(1)} MB · checks ${scanOn ? (process.env.ANTHROPIC_API_KEY ? "on" : "photos only") : "off"} · teacher approvals ${autoPublish() ? "publish when every check is safe" : "always go to a reader"}`}</div>
        <h1>The reading <em>desk</em></h1>
        {a.role === "teacher" && <p className="lead">Your class&apos;s stories, waiting for you. Approve one and it goes on the map, as long as every automatic check came back clean; otherwise a county reader looks too. Send one back with a note and the family sees the note.</p>}
        {a.role === "reader" && <p className="lead">Stories from your county that came without a school, and school stories a teacher approved that a check wants a person to see. Publish, or send back with a note for the family.</p>}
        {!a.user && <p className="notice">You are in with the admin key. Invite yourself as an admin under <a href={`/desk/users?key=${encodeURIComponent(a.key!)}`}>People</a>; once you have signed in with the link, the key stops working here.</p>}
        {sp.msg && <p className="ok">{sp.msg}</p>}
        <div className="chips">
          {tabs.map((t, i) => <a key={t.slug} href={`/desk?tab=${t.slug}${keyQs}`} className={t.slug === tab.slug ? "on" : undefined}>{t.label} · {counts[i]}</a>)}
          {a.role !== "reader" && <a href={`/desk/copybook?x=1${keyQs}`}>Make the copybook</a>}
          {a.role === "admin" && <><a href={`/desk/users?x=1${keyQs}`}>People</a><a href={`/desk/audit?x=1${keyQs}`}>Audit trail</a></>}
          {a.user && <form method="post" action="/api/desk/session" style={{ display: "inline" }}><button className="btn ghost" name="signout" value="1" style={{ padding: "7px 12px" }}>Sign out</button></form>}
        </div>
      </section>
      {rows.map((s, i) => (
        <div key={s.id} id={s.id} className="copybook" style={{ marginBottom: 18, scrollMarginTop: 16 }}>
          <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0, flex: "1 1 320px" }}>
              <div className="kicker">{collectionBySlug(s.collection)?.name} · {headingOf(s, slug => topicBySlug(slug)?.name)} · {s.townland_en}, Co. {s.county}{farOf(s) ? ` · from ${farOf(s)}` : ""}{s.lang === "other" ? ` · in ${s.lang_other ?? "another language"}` : s.lang === "ga" ? " · in Irish" : s.lang === "both" ? " · Irish and English" : ""} · {new Date(s.created_at).toLocaleString("en-IE")} {s.flags ? <span className="tag" style={{ color: "var(--margin-ink)" }}>{s.flags} flag{s.flags > 1 ? "s" : ""}</span> : null} {s.featured && <span className="tag">featured</span>} {s.second_look && <span className="tag" style={{ color: "var(--gold-ink)" }}>teacher approved, needs a second look</span>} {media[i].filter(m => m.scan?.startsWith("unsafe")).map(m => <span key={m.id} className="tag" style={{ color: "var(--margin-ink)" }}>{m.kind === "photo" ? "photo" : "recording"} flagged</span>)}{s.scan?.startsWith("unsafe") && <span className="tag" style={{ color: "var(--margin-ink)" }}>story flagged</span>}</div>
              <h3>{s.title}</h3>
              <p className="muted small">Told by {s.teller_name} ({s.teller_born ?? "?"}, {s.teller_relation ?? "?"}) to {s.collector_name} ({s.collector_age ?? "?"}){s.school ? `, ${s.school} ${s.class_name ?? ""}` : ""}. Consent: {s.consent_name}{a.role === "admin" && s.contact_email ? ` <${s.contact_email}>` : ""}. {s.words} words.{s.reviewer ? ` Reviewed by ${s.reviewer}${s.reviewed_at ? `, ${new Date(s.reviewed_at).toLocaleDateString("en-IE")}` : ""}.` : ""}{s.review_note ? ` Note to the family: "${s.review_note}"` : ""}{a.role === "admin" && s.note ? ` Private note: ${s.note}` : ""}</p>
            </div>
            <Buttons s={s} a={a} tab={tab.slug} />
          </div>
          <Media items={media[i]} admin={a.key ?? undefined} review />
          <Verdict m={{ kind: "text", scan: s.scan, scan_note: s.scan_note }} />
          <article className="story" style={{ fontSize: "1.05rem" }}>{paragraphs(s.body).map((p, j) => <p key={j}>{p}</p>)}</article>
          {s.body_en && <details className="small" open><summary>In English (machine-made; the original above is the record)</summary><article className="story" style={{ fontSize: "1.05rem" }}>{paragraphs(s.body_en).map((p, j) => <p key={j}>{p}</p>)}</article></details>}
          {s.lang === "other" && !s.body_en && <p className="small muted">In {s.lang_other ?? "another language"}; the English is still being made, or the check is off.</p>}
          {s.has_audio && ["pending", "approved", "kept"].includes(s.status) && <WrittenOut s={s} a={a} tab={tab.slug} machine={media[i].filter(m => m.kind === "audio" && m.transcript).map(m => m.transcript!.trim()).join("\n\n")} />}
        </div>
      ))}
      {!rows.length && <p className="muted">{tab.slug === "pending" ? "Nothing waiting. " : "Nothing here. "}{a.role === "teacher" && tab.slug === "pending" ? "When your pupils add stories with your school's name, they appear here." : ""}</p>}
    </main>
  );
}
