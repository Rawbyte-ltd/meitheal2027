import { audit, deskActor, managesAdmins, scopeLabel, sendLoginLink, type Role } from "@/lib/auth";
import { one, q } from "@/lib/db";
import { clean } from "@/lib/stories";
import { COUNTIES } from "@/lib/townlands";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

/** Admin only: invite someone (and email their link), disable, enable, or resend a link. Only the owner touches admins. */
export async function POST(req: Request) {
  const fd = await req.formData(), key = clean(fd.get("key"), 200) || null;
  const a = await deskActor(key);
  if (!a || a.role !== "admin") return new Response("Admins only", { status: 403 });
  const back = (msg: string) => redirectTo(req, `/desk/users?${new URLSearchParams({ msg, ...(key ? { key } : {}) })}`);
  const action = clean(fd.get("action"), 20);

  if (action === "invite") {
    const email = clean(fd.get("email"), 120).toLowerCase(), name = clean(fd.get("name"), 80), role = clean(fd.get("role"), 10) as Role;
    const county = COUNTIES.find(c => c === clean(fd.get("county"), 30)) ?? null, school = clean(fd.get("school"), 80) || null, cls = clean(fd.get("class_name"), 40) || null, nominated = clean(fd.get("nominated_by"), 120) || null;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !name) return back("An email address and a name are needed.");
    if (!["admin", "teacher", "reader"].includes(role)) return back("Pick a role.");
    if (role === "admin" && !managesAdmins(a)) return back("Only the owner can invite admins.");
    if (role === "teacher" && (!school || !county)) return back("A teacher needs a school and a county.");
    if (role === "reader" && !county) return back("A reader needs a county.");
    if (role !== "admin" && !nominated) return back("Say who nominated them (their school, library, heritage office or society): it is the safeguarding record.");
    if (await one("SELECT id FROM users WHERE email = $1", [email])) return back(`${email} is already on the desk.`);
    // The first admin invited while setting up with the key becomes the owner.
    const owner = role === "admin" && !a.user && !(await one("SELECT id FROM users WHERE owner"));
    const u = await one<{ id: number }>("INSERT INTO users (email, name, role, county, school, class_name, nominated_by, invited_by, owner) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id", [email, name, role, county, school, cls, nominated, a.user?.id ?? null, owner]);
    await audit(a, null, "invite", `${email} as ${role} (${scopeLabel({ role, county, school, class_name: cls })}), nominated by ${nominated ?? "-"}`);
    await sendLoginLink(email, { by: a.user?.name ?? "The Meitheal 2027 team", role, scope: scopeLabel({ role, county, school, class_name: cls }) });
    return back(`Invited ${name}. Their sign-in link is on its way (user ${u!.id}).`);
  }
  const id = Number(fd.get("id"));
  const target = await one<{ id: number; email: string; name: string; role: Role; owner: boolean }>("SELECT id, email, name, role, owner FROM users WHERE id = $1", [id]);
  if (!target) return back("No such person.");
  if (action === "disable" || action === "enable") {
    if (action === "disable" && target.id === a.user?.id) return back("You cannot disable yourself.");
    if (target.owner) return back("The owner cannot be disabled.");
    if (target.role === "admin" && !managesAdmins(a)) return back("Only the owner can disable or re-enable an admin.");
    await q("UPDATE users SET disabled = $2 WHERE id = $1", [id, action === "disable"]);
    if (action === "disable") await q("DELETE FROM sessions WHERE user_id = $1", [id]);
    await audit(a, null, action, target.email);
    return back(action === "disable" ? `${target.name} can no longer sign in.` : `${target.name} can sign in again.`);
  }
  if (action === "resend") {
    await sendLoginLink(target.email);
    await audit(a, null, "resend", target.email);
    return back(`A new sign-in link is on its way to ${target.email}.`);
  }
  return back("Nothing done.");
}
