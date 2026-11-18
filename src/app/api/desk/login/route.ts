import { sendLoginLink } from "@/lib/auth";
import { clean } from "@/lib/stories";
import { ipHash } from "@/lib/token";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

/** Ask for a sign-in link. The answer is the same whether or not the address is on the list. */
export async function POST(req: Request) {
  const ip = ipHash(req), now = Date.now(), hits = (recent.get(ip) ?? []).filter(t => now - t < 3600e3);
  if (hits.length < 10) {
    hits.push(now); recent.set(ip, hits);
    const email = clean((await req.formData()).get("email"), 120);
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) await sendLoginLink(email);
  }
  return redirectTo(req, "/desk?sent=1");
}
