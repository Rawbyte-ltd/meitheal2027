import type { Metadata, Viewport } from "next";
import { getDict } from "@/lib/lang";
import { ldJson, SITE } from "@/lib/seo";
import "./globals.css";


export async function generateMetadata(): Promise<Metadata> {
  const { lang, t } = await getDict();
  return {
    title: { default: t.meta.title, template: "%s · Meitheal 2027" },
    description: t.meta.description,
    openGraph: { title: "Meitheal 2027", description: t.meta.description, type: "website", locale: lang === "ga" ? "ga_IE" : "en_IE" },
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : process.env.RAILWAY_PUBLIC_DOMAIN ? new URL(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`) : undefined,
  };
}
export const viewport: Viewport = { themeColor: "#f7f2e8", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  return (
    <html lang={lang === "ga" ? "ga" : "en-IE"}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({ "@context": "https://schema.org", "@graph": [
          { "@type": "WebSite", "@id": `${SITE}/#site`, url: SITE, name: "Meitheal 2027", alternateName: "Meitheal 2027: the Schools' Collection, done again", inLanguage: ["en-IE", "ga"], description: t.meta.description, publisher: { "@id": `${SITE}/#rawbyte` } },
          { "@type": "Organization", "@id": `${SITE}/#rawbyte`, name: "RawByte", url: "https://rawbyte.ie", address: { "@type": "PostalAddress", addressLocality: "Cavan", addressCountry: "IE" } },
        ] })} />
        <header className="top">
          <div className="wrap row">
            <a href="/" className="logo">Meitheal <span>2027</span></a>
            <nav>
              <a href="/stories">{t.nav.stories}</a>
              <a href="/places" className="opt">{t.nav.places}</a>
              <a href="/people" className="opt">{t.nav.people}</a>
              <a href="/topics" className="opt">{t.nav.topics}</a>
              <a href="/map">{t.nav.map}</a>
              <a href="/collect">{t.nav.collect}</a>
              <a href="/schools">{t.nav.schools}</a>
              <a href="/about">{t.nav.about}</a>
              {/* A relative "?lang=" keeps the visitor on the same page; src/proxy.ts sets the cookie. */}
              <a href={`?lang=${t.nav.otherLang}`} className="keep lang-switch" hrefLang={t.nav.otherLang} lang={t.nav.otherLang} title={t.nav.otherLabel} aria-label={t.nav.other}><span className="long">{t.nav.other}</span><span className="short" aria-hidden="true">{t.nav.otherLang.toUpperCase()}</span></a>
              <a href="/submit" className="pill">{t.nav.add}</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="foot">
          <div className="wrap">
            <p>{t.foot.free}</p>
            <p>{t.foot.published} <a href="https://www.duchas.ie" rel="noopener">dúchas.ie</a>. {t.foot.photos} <a href="https://www.flickr.com/photos/nlireland/" rel="noopener">{t.foot.nli}</a>, {t.foot.photosTail} {t.foot.names} <a href="https://www.townlands.ie" rel="noopener">townlands.ie</a> (OpenStreetMap) {lang === "ga" ? "agus" : "and"} <a href="https://www.logainm.ie" rel="noopener">Logainm</a>. <a href="/privacy">{t.foot.privacy}</a> · <a href="/keep">{t.lost.foot}</a> · <a href="mailto:hello@rawbyte.ie?subject=Meitheal%202027">{t.foot.contact}</a></p>
            <p className="built">{t.foot.built} <a href="https://rawbyte.ie" rel="noopener">RawByte</a> {t.foot.builtTail}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
