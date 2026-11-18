import "server-only";
import { cookies, headers } from "next/headers";
import { dict, isLang, type Lang } from "./i18n.ts";

/**
 * The page's language: ?lang= on this address first (src/proxy.ts passes it in a request header, so /x?lang=ga is the
 * Irish page for search engines too), then the `lang` cookie the switch sets, then English.
 */
export async function getLang(): Promise<Lang> {
  const fromUrl = (await headers()).get("x-meitheal-lang");
  if (isLang(fromUrl)) return fromUrl;
  const v = (await cookies()).get("lang")?.value;
  return isLang(v) ? v : "en";
}
export async function getDict() { const lang = await getLang(); return { lang, t: dict(lang) }; }
