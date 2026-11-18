import type { Metadata } from "next";

/** The one address search engines should use. www and the Railway domain redirect or point here (src/proxy.ts). */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://meitheal2027.ie").replace(/\/$/, "");

/** Title and description for a page; og:title and og:description follow them. The canonical link is set in src/proxy.ts. */
export const pageMeta = (title: string, description: string): Metadata => ({ title, description, openGraph: { title, description, images: [{ url: "/opengraph-image", width: 1200, height: 630 }] } });

/**
 * A list page with nothing published on it (a county, townland, heading or collection with no stories yet) asks search
 * engines not to index it: an empty "0 stories so far" page reads as a soft 404, and every townland in Ireland has one.
 * Links on it are still followed. Pass whether the page has any story, the 1937 examples included.
 */
export const unlessEmpty = (meta: Metadata, hasAny: boolean): Metadata => hasAny ? meta : { ...meta, robots: { index: false, follow: true } };

/** One line of plain text from a longer one, cut at a word, for a meta description. */
export const describe = (text: string, n = 158) => { const flat = text.replace(/\s+/g, " ").trim(); return flat.length <= n ? flat : flat.slice(0, n).replace(/\s+\S*$/, "") + "…"; };

/** JSON-LD in a script tag; "<" escaped so a story's text can never close the tag. */
export const ldJson = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
