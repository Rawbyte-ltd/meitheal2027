/** Public origin for redirects. Behind Railway's proxy req.url is http://localhost:8080, so trust the forwarded headers. */
export function origin(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host && !/^localhost|^127\./.test(host)) return `${proto}://${host}`;
  return new URL(req.url).origin;
}
export const redirectTo = (req: Request, path: string, status = 303) => Response.redirect(new URL(path, origin(req)).toString(), status);
