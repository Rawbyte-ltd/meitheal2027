import { deskActor } from "@/lib/auth";
import { clean, storyIdOf } from "@/lib/stories";
import { saveDesk } from "@/lib/transcript";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

/** The desk saves a story's written-out text. On a published story it is public at once: the person saving it read it. */
export async function POST(req: Request) {
  const fd = await req.formData().catch(() => null);
  if (!fd) return new Response("Send the desk form", { status: 400 });
  const key = clean(fd.get("key"), 200) || null;
  const a = await deskActor(key);
  if (!a) return new Response("Sign in at /desk first", { status: 403 });
  const id = storyIdOf(fd.get("id")), tab = clean(fd.get("tab"), 20) || "pending";
  const r = await saveDesk(a, id, fd.get("text"));
  const qs = new URLSearchParams({ tab, msg: r.result, ...(key ? { key } : {}) });
  return redirectTo(req, `/desk?${qs}#${id}`);
}
