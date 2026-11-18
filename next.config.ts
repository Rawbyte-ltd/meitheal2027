import type { NextConfig } from "next";
import { MAX_REQUEST } from "./src/lib/limits";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
  // The proxy buffers request bodies (10 MB by default) and cuts off anything longer; a submission can be bigger.
  experimental: { proxyClientMaxBodySize: MAX_REQUEST },
  // Security headers (audit item 14). No full script CSP: Next's inline scripts would need a nonce on every page.
  headers() {
    return [
      { source: "/:path*", headers: [
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        // Nobody may frame the site: the keeper page and the desk have Remove buttons worth tricking someone into.
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        { key: "X-Frame-Options", value: "DENY" },
        // Uploaded audio is served with the type the browser sent; never let a browser guess it is a page.
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // The recorder on /submit is the only device use; photos come through a file input, which this does not govern.
        { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=(), interest-cohort=()" },
      ] },
      // Files in public/ keep their names when they change, so nothing is "immutable": fonts and the archive photos change
      // rarely and a stale one is only cosmetic (30 days); the map library's three files must match each other (1 day).
      { source: "/fonts/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
      { source: "/photos/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000" }] },
      { source: "/maplibre/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=86400" }] },
      // Keeper and desk links carry their secret in the URL: send no referrer at all from those pages.
      { source: "/keep/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/desk/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/desk", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default nextConfig;
