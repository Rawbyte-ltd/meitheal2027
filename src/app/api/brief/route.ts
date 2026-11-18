import { deskActor } from "@/lib/auth";
import { buildBrief, sendBrief } from "@/lib/brief";
export const dynamic = "force-dynamic";

/**
 * The daily brief, for an admin signed in to the desk. GET shows today's brief as text without sending it; POST sends it
 * now (and moves the marker). ADMIN_KEY works only while no admin account exists, as on the desk itself (src/lib/auth.ts):
 * it used to work here for good, in the URL, and the brief lists children's details from stories still waiting.
 */
const admin = async (req: Request) => (await deskActor(new URL(req.url).searchParams.get("key")))?.role === "admin";

export async function GET(req: Request) {
  if (!(await admin(req))) return new Response("Sign in at /desk as an admin first", { status: 403 });
  const b = await buildBrief(new URL(req.url).searchParams.get("since") ?? undefined);
  return new Response(`${b.subject}

${b.text}

(since ${b.since}; ${b.empty ? "would not be sent" : "would be sent"} at the usual time)`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
export async function POST(req: Request) {
  if (!(await admin(req))) return new Response("Sign in at /desk as an admin first", { status: 403 });
  const r = await sendBrief(new URL(req.url).searchParams.get("force") === "1");
  return Response.json({ sent: r.sent, why: r.why, subject: r.brief.subject, fresh: r.brief.fresh, pending: r.brief.pending });
}
