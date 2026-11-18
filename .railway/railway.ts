// Railway Infrastructure as Code, pulled from the live project with `railway config pull` on 12 October 2026.
// It replaces railway.json, which Railway retires on 1 December 2026. Check with `railway config plan`, change
// with `railway config apply`. Variables are preserve(): their values stay in Railway, never in this file.
// Pushes to master deploy automatically (GitHub source). The builder is Railpack, set on the service;
// railpack.json adds ffmpeg to the image for src/lib/scan.ts.
//
// Every service variable must be listed with preserve(), or apply deletes it; compare with
// `railway variables --kv | sed 's/=.*//'` after adding one. The Postgres volumes are left out on purpose: apply leaves
// unlisted volumes alone (checked with plan, 5 Nov 2026), and keeping them out means no edit here can reconfigure the
// database's disk. Run plan before every apply and expect 0 to destroy.
// On Windows with Git Bash the npm wrapper fails the CLI version check ("requires Railway CLI 5.42.1"). Call the
// binary itself instead: "$APPDATA/npm/node_modules/@railway/cli/bin/railway.exe" config plan
import { defineRailway, github, postgres, preserve, project, service } from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "europe-west4-drams3a" });
  const meitheal = service("meitheal", {
    source: github("Justyoureverydaynormalguybob/meitheal", { branch: "master", checkSuites: false }),
    start: "sh scripts/start.sh",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    replicas: { "europe-west4-drams3a": 1 },
    deploy: { drainingSeconds: 10 },
    domains: ["meitheal2027.ie", "www.meitheal2027.ie"],
    env: { ADMIN_KEY: preserve(), ANTHROPIC_API_KEY: preserve(), BRIEF_TO: preserve(), CLOUDFLARE_AI_TOKEN: preserve(), DATABASE_URL: preserve(), MAIL_FROM: preserve(), MAIL_SMTP_HOST: preserve(), MAIL_SMTP_PASS: preserve(), MAIL_SMTP_PORT: preserve(), MAIL_SMTP_USER: preserve(), MEITHEAL_SALT: preserve(), NEXT_PUBLIC_SITE_URL: preserve(), R2_ACCESS_KEY_ID: preserve(), R2_ACCOUNT_ID: preserve(), R2_BUCKET: preserve(), R2_JURISDICTION: preserve(), R2_SECRET_ACCESS_KEY: preserve(), RAILPACK_NODE_VERSION: preserve() },
  });

  return project("meitheal", {
    resources: [Postgres, meitheal],
  });
});
