import type { MetadataRoute } from "next";
import { COLLECTIONS } from "@/lib/collections";
import { q } from "@/lib/db";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Every public page worth finding: the fixed pages, every approved story, and the county, townland and heading pages that have stories. */
/** Each address in both languages: the path is English, ?lang=ga is Irish (src/proxy.ts). */
const both = (url: string) => ({ url, alternates: { languages: { "en-IE": url, ga: `${url === SITE ? `${SITE}/` : url}?lang=ga` } } });

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [stories, places, topics] = await Promise.all([
    q<{ id: string; updated_at: Date }>("SELECT id, updated_at FROM stories WHERE status = 'approved' ORDER BY updated_at DESC"),
    q<{ county: string; townland_slug: string; last: Date }>("SELECT county, townland_slug, max(updated_at) AS last FROM stories WHERE status = 'approved' GROUP BY county, townland_slug"),
    q<{ topic: string; last: Date }>("SELECT topic, max(updated_at) AS last FROM stories WHERE status = 'approved' AND topic <> 'custom' GROUP BY topic"),
  ]);
  const newest = stories[0]?.updated_at ?? new Date();
  const fixed: MetadataRoute.Sitemap = ["", "/stories", "/map", "/places", "/people", "/topics", "/titles", "/schools", "/collect", "/about", "/privacy", "/submit"]
    .map((p, i) => ({ ...both(`${SITE}${p}`), lastModified: newest, changeFrequency: "weekly", priority: i === 0 ? 1 : 0.7 }));
  const counties = new Map<string, Date>();
  for (const p of places) { const d = counties.get(p.county); if (!d || p.last > d) counties.set(p.county, p.last); }
  return [
    ...fixed,
    ...COLLECTIONS.map(c => ({ ...both(`${SITE}/collections/${c.slug}`), lastModified: newest, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...[...counties].map(([co, last]) => ({ ...both(`${SITE}/county/${co.toLowerCase()}`), lastModified: last, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...places.map(p => ({ ...both(`${SITE}/townland/${p.county.toLowerCase()}/${p.townland_slug}`), lastModified: p.last, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...topics.map(t => ({ ...both(`${SITE}/topic/${t.topic}`), lastModified: t.last, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...stories.map(s => ({ ...both(`${SITE}/story/${s.id}`), lastModified: s.updated_at, changeFrequency: "monthly" as const, priority: 0.9 })),
  ];
}
