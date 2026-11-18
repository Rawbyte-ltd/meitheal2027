import { notFound } from "next/navigation";
import { deskActor, managesAdmins, scopeLabel, type User } from "@/lib/auth";
import { q } from "@/lib/db";
import { COUNTIES } from "@/lib/townlands";
export const dynamic = "force-dynamic";
export const metadata = { title: "People at the desk", robots: { index: false } };

export default async function Users({ searchParams }: { searchParams: Promise<{ key?: string; msg?: string }> }) {
  const sp = await searchParams, a = await deskActor(sp.key);
  if (!a || a.role !== "admin") notFound();
  const users = await q<User & { inviter: string | null; reviewed: number }>("SELECT u.*, (SELECT name FROM users i WHERE i.id = u.invited_by) AS inviter, (SELECT count(*) FROM stories s WHERE s.reviewed_by = u.id)::int AS reviewed FROM users u ORDER BY u.disabled, u.role, u.county NULLS FIRST, u.school, u.name");
  const owner = managesAdmins(a);
  const keyQs = a.key ? `?key=${encodeURIComponent(a.key)}` : "";
  const hidden = a.key ? <input type="hidden" name="key" value={a.key} /> : null;
  return (
    <main className="wrap">
      <section>
        <div className="kicker"><a href={`/desk${keyQs}`}>The reading desk</a> · People</div>
        <h1>Who <em>reads</em></h1>
        <p className="lead">Teachers approve their own class. County readers take the stories that came without a school, and anything a check wants a person to see. Everyone outside a school is nominated by a body that vouches for them (a library, the heritage office, a historical society): put that in, it is the safeguarding record.</p>
        {sp.msg && <p className="ok">{sp.msg}</p>}
      </section>

      <section className="copybook">
        <h2>Invite someone</h2>
        <form method="post" action="/api/desk/users" className="sheet">
          {hidden}<input type="hidden" name="action" value="invite" />
          <div className="two"><label>Name<input name="name" required maxLength={80} placeholder="Áine Ní Bhriain" /></label><label>Email<input name="email" type="email" required maxLength={120} /></label></div>
          <div className="two">
            <label>Role<select name="role" defaultValue="teacher"><option value="teacher">Teacher: approves their own class</option><option value="reader">County reader: stories without a school</option>{owner && <option value="admin">Admin: everything but managing admins</option>}</select></label>
            <label>County<select name="county" defaultValue="Cavan"><option value="">(none, for an admin)</option>{COUNTIES.map(c => <option key={c}>{c}</option>)}</select></label>
          </div>
          <div className="two"><label>School <small>teachers only, as families type it on the form</small><input name="school" maxLength={80} placeholder="Scoil Bhríde, Killeshandra" /></label><label>Class <small>optional; leave empty for the whole school</small><input name="class_name" maxLength={40} placeholder="5th class" /></label></div>
          <label>Nominated by <small>their school for a teacher; the library, heritage office or society for a reader</small><input name="nominated_by" maxLength={120} /></label>
          <button className="btn" type="submit">Invite and send their link</button>
        </form>
      </section>

      <section>
        <h2>On the desk</h2>
        {users.length ? <table className="lb"><thead><tr><th>Name</th><th>Role and scope</th><th>Nominated by</th><th>Last seen</th><th>Read</th><th></th></tr></thead><tbody>
          {users.map(u => <tr key={u.id} style={u.disabled ? { opacity: .55 } : undefined}>
            <td><b>{u.name}</b><div className="muted small">{u.email}</div></td>
            <td>{u.owner ? "owner" : u.role}<div className="muted small">{u.owner ? "everything, and the admins" : scopeLabel(u)}</div></td>
            <td className="small">{u.nominated_by ?? ""}{u.inviter ? <div className="muted">invited by {u.inviter}</div> : null}</td>
            <td className="small">{u.last_seen ? new Date(u.last_seen).toLocaleDateString("en-IE") : "not yet"}</td>
            <td>{u.reviewed}</td>
            <td><form method="post" action="/api/desk/users" className="chips" style={{ margin: 0, flexWrap: "nowrap" }}>{hidden}<input type="hidden" name="id" value={u.id} />
              {!u.disabled && <button className="btn ghost" name="action" value="resend" style={{ padding: "6px 10px" }}>New link</button>}
              {!u.owner && (u.role !== "admin" || owner) && u.id !== a.user?.id && <button className={u.disabled ? "btn ghost" : "btn red"} name="action" value={u.disabled ? "enable" : "disable"} style={{ padding: "6px 10px" }}>{u.disabled ? "Enable" : "Disable"}</button>}
            </form></td>
          </tr>)}
        </tbody></table> : <p className="muted">Nobody yet. Start by inviting yourself as an admin.</p>}
      </section>
    </main>
  );
}
