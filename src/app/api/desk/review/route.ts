import { deskActor } from "@/lib/auth";
import { review, type Action } from "@/lib/review";
import { clean, storyIdOf } from "@/lib/stories";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

/** The desk's story buttons: approve, send back, and for the admin pending, feature, clear flags, remove. */
export async function POST(req: Request) {
  const fd = await req.formData().catch(() => null);
  if (!fd) return new Response("Send the desk form", { status: 400 });
  const key = clean(fd.get("key"), 200) || null;
  const a = await deskActor(key);
  if (!a) return new Response("Sign in at /desk first", { status: 403 });
  const id = storyIdOf(fd.get("id")), action = clean(fd.get("action"), 20) as Action, note = clean(fd.get("note"), 500);
  const tab = clean(fd.get("tab"), 20) || "pending";
  const r = await review(a, id, action, note);
  const qs = new URLSearchParams({ tab, msg: r.result, ...(key ? { key } : {}) });
  return redirectTo(req, `/desk?${qs}`);
}
