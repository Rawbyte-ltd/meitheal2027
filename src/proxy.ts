import { NextResponse, type NextRequest } from "next/server";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://meitheal2027.ie").replace(/\/$/, "");
const SITE_HOST = new URL(SITE).host;

/**
 * Site password while the project is private. Set SITE_PASSWORD on the server and the whole site asks for it once,
 * then sets a cookie for 30 days. Unset it to open the doors. Health, version and the gate itself stay open.
 */
export const config = { matcher: ["/((?!_next/|maplibre/|fonts/|robots.txt|sitemap.xml|icon.svg|favicon.ico|api/health|api/version|gate|api/gate).*)"] };

async function tag(pw: string): Promise<string> {
  const data = new TextEncoder().encode(`meitheal-gate:${pw}`);
  const h = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

export async function proxy(req: NextRequest) {
  // One address for search engines: www.meitheal2027.ie moves permanently to meitheal2027.ie, path and query kept.
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").toLowerCase();
  if (host === `www.${SITE_HOST}`) return NextResponse.redirect(`${SITE}${req.nextUrl.pathname}${req.nextUrl.search}`, 308);
  const pw = process.env.SITE_PASSWORD;
  if (!pw) return page(req);
  const want = await tag(pw);
  if (req.cookies.get("meitheal_gate")?.value === want) return page(req);
  const url = req.nextUrl.clone(); url.pathname = "/gate"; url.search = `?to=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

/** The request header that carries ?lang= to the page (src/lib/lang.ts). Set only here; one sent by a client is dropped. */
export const LANG_HEADER = "x-meitheal-lang";

/**
 * Every page has an English address (the path) and an Irish one (the path with ?lang=ga), so search engines can find
 * both. ?lang= is served in place, not redirected away, and remembered in the cookie for the pages that follow.
 * The Link header names the page's canonical address (no other query: filters, pages and map positions are views of
 * the same page) and both language versions; Google reads it like the <link> tags.
 */
function page(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get("lang");
  const headers = new Headers(req.headers); headers.delete(LANG_HEADER);
  if (lang === "en" || lang === "ga") headers.set(LANG_HEADER, lang);
  const res = NextResponse.next({ request: { headers } });
  if (lang === "en" || lang === "ga") res.cookies.set("lang", lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  if (req.nextUrl.pathname.startsWith("/api/")) return res;
  const en = `${SITE}${req.nextUrl.pathname === "/" ? "" : req.nextUrl.pathname}`, ga = `${SITE}${req.nextUrl.pathname}?lang=ga`;
  res.headers.set("Link", [`<${lang === "ga" ? ga : en}>; rel="canonical"`, `<${en}>; rel="alternate"; hreflang="en-IE"`, `<${ga}>; rel="alternate"; hreflang="ga"`, `<${en}>; rel="alternate"; hreflang="x-default"`].join(", "));
  return res;
}
