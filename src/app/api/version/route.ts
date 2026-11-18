export const dynamic = "force-dynamic";
/** The commit this deploy was built from: after a push, check it matches `git rev-parse HEAD`. "local" off Railway. */
export function GET() {
  const e = process.env;
  return Response.json({ commit: e.RAILWAY_GIT_COMMIT_SHA || "local", branch: e.RAILWAY_GIT_BRANCH || null, deployment: e.RAILWAY_DEPLOYMENT_ID || null });
}
