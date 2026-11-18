import { after } from "next/server";
import { flagMail } from "@/lib/brief";
import { one } from "@/lib/db";
import { recordFlag } from "@/lib/flags";
import { clean, storyIdOf } from "@/lib/stories";
import { ipHash } from "@/lib/token";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

/** A flag on a published story (src/lib/flags.ts has the rule). Only published stories can be flagged. */
export async function POST(req: Request) {
  const fd = await req.formData(); const id = storyIdOf(fd.get("id")), reason = clean(fd.get("reason"), 500);
  if (!id || !reason) return Response.json({ error: "Say what is wrong" }, { status: 400 });
  const story = await one<{ id: string; title: string; status: string }>("SELECT id, title, status FROM stories WHERE id = $1", [id]);
  if (!story || story.status !== "approved") return Response.json({ error: "No such story" }, { status: 404 });
  const { added, n } = await recordFlag(id, reason, ipHash(req));
  if (!added) console.info("flag: not recorded (a repeat, or past the day's limit)", id);
  // A flag on a published story is the one thing that does not wait for the evening brief.
  else after(() => flagMail(story, reason, n));
  // The same answer either way: a repeat or a flag past the day's limit looks like any other.
  return redirectTo(req, `/story/${id}?flagged=1`);
}
