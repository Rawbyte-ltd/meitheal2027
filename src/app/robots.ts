import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/keep/", "/admin", "/api/", "/desk", "/gate"] }, sitemap: `${SITE}/sitemap.xml`, host: SITE };
}
