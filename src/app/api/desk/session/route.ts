import { audit, signOut, useLoginToken } from "@/lib/auth";
import { clean } from "@/lib/stories";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

/** POST t=<token> from the sign-in page starts a session; POST with signout=1 ends it. */
export async function POST(req: Request) {
  const fd = await req.formData();
  if (fd.get("signout")) { await signOut(); return redirectTo(req, "/desk?out=1"); }
  const u = await useLoginToken(clean(fd.get("t"), 100));
  if (!u) return redirectTo(req, "/desk?expired=1");
  await audit({ user: u, role: u.role, key: null }, null, "signin");
  return redirectTo(req, "/desk");
}
