import { dict, isLang } from "@/lib/i18n";
import { claimResend, reissueKeeperLinks } from "@/lib/keeper";
import { escapeHtml, mailOn, sendMail } from "@/lib/mail";
import { SITE } from "@/lib/seo";
import { clean } from "@/lib/stories";
import { ipHash } from "@/lib/token";
import { redirectTo } from "@/lib/url";
export const dynamic = "force-dynamic";

const recent = new Map<string, number[]>();

/**
 * A lost keeper link: every story under the adult's email gets a new link, sent in one email (src/lib/keeper.ts).
 * The reply is the same whether or not the address is known, so it cannot be used to find out who took part. One email
 * per address an hour, held in the database, so nobody can keep cancelling and re-mailing a family's links.
 */
export async function POST(req: Request) {
  const fd = await req.formData();
  const ul = fd.get("ui_lang"), lang = isLang(ul) ? ul : "en", t = dict(lang).lost;
  const email = clean(fd.get("email"), 120).toLowerCase();
  const back = (what: string) => redirectTo(req, `/keep?${what}=1`);
  if (!mailOn) return back("nomail");
  const ip = ipHash(req), now = Date.now(), hits = (recent.get(ip) ?? []).filter(x => now - x < 3600e3);
  if (hits.length >= 5 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back("sent");
  hits.push(now); recent.set(ip, hits);
  if (!(await claimResend(email))) return back("sent");
  const r = await reissueKeeperLinks(email, SITE, async links => {
    const text = links.length ? `${t.mailIntro}\n\n${links.map(l => `${l.title}\n${l.url}`).join("\n\n")}` : t.mailNone;
    const html = links.length ? `<p>${escapeHtml(t.mailIntro)}</p>${links.map(l => `<p><b>${escapeHtml(l.title)}</b><br><a href="${l.url}">${l.url}</a></p>`).join("")}` : `<p>${escapeHtml(t.mailNone)}</p>`;
    return (await sendMail({ to: email, subject: t.mailSubject, text, html })).sent;
  });
  if (r === "failed") console.error("keep/resend: the email did not go; the old links still work");
  return back("sent");
}
