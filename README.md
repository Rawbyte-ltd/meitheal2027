# Meitheal 2027

The Schools' Collection, done again. In 1937 a hundred thousand Irish schoolchildren wrote down their grandparents' stories under a set of headings, townland by townland. Ninety years on, children record or write a story from an elder, pick the townland, an adult consents, a person reads it, and it goes on the map. Free for every family and school; the collection is offered to the National Folklore Collection.

Web app in Next.js 16 with Postgres (this repo). Flutter client in `apps/mobile`. The hand-off plan is `docs/handoff.md` and the runbook is `docs/runbook.md`.

## Run

```sh
npm install
cp .env.example .env.local      # set DATABASE_URL and ADMIN_KEY
npm run migrate
npm run dev
```

On Termux build with `node node_modules/next/dist/bin/next build --webpack`. Local Postgres: `pg_ctl -D ~/pgdata -o "-p 5433 -k $PREFIX/tmp" start`, database `meitheal`.

## How it works

- `migrations/001_init.sql`: one `stories` table (first names only, consent recorded, audio as bytea up to 12 MB, keeper secret hashed) and `flags`.
- Submit: `POST /api/stories` multipart. Returns `{id, keeper}`; the keeper secret is shown once in the family's link `/keep/{id}?k=`. The family can print or remove the story with it. Only a hash of the secret is stored, so a lost link is reissued, not resent: `/keep` asks for the adult's email, `POST /api/keep/resend` mints a new secret for every story under that email and mails the new links (through Resend; the old links stop working). The written story is checked by Claude Haiku like a transcript (`scanText`), verdict in `stories.scan`.
- The reading desk: `/desk`. Teachers approve their own class, county readers the stories that come without a school, the admin everything; sign-in is by emailed link (`src/lib/auth.ts`, `migrations/006_roles.sql`). A teacher's approval publishes at once when every check is safe (set `AUTO_PUBLISH=off` to send them all to a reader); otherwise the story waits for a second look. Sending a story back shows the note to the family on their keeper page. `ADMIN_KEY` (`/desk?key=`) works until the first admin has signed in; after that `scripts/add-admin.mjs` recovers access from the server. `/admin` forwards to the desk. Nothing is public until approved; two public flags push a story back to pending.
- The daily brief (`src/lib/brief.ts`): at 7pm Irish time one email to `BRIEF_TO` lists the stories that arrived since the last brief, the pending total and anything a check flagged, one desk link each; nothing on a quiet day. A flag on a published story mails at once. Sent through Zoho SMTP (`MAIL_SMTP_*`; Resend's API if `RESEND_API_KEY` is set instead), otherwise written to the server log, which `/api/health` warns about. Signed in to the desk as an admin, `GET /api/brief` previews it and `POST` sends it now (`?key=ADMIN_KEY` works only until the first admin has signed in, as on the desk).
- Media checks (`src/lib/scan.ts`), run after a story is saved. They flag, never block; the reading desk shows each verdict, blurs flagged photos and shows each recording's transcript.
  - Photographs: Cloudflare Workers AI (LLaVA, the check MemoryMantle uses). Needs `CLOUDFLARE_AI_TOKEN`. It calls old black-and-white photographs unsafe more often than it should, which is why it only flags.
  - Recordings: ffmpeg cuts them into five-minute pieces (`railpack.json` installs it), Whisper on Workers AI transcribes them ($0.0005 a minute), and Claude Haiku reads the transcript for swearing, abuse and personal details (well under a cent a recording). Needs `ANTHROPIC_API_KEY` as well. Whisper has no Irish, so stories told in Irish are skipped and must be listened to.
- Public: `/stories`, `/story/{id}`, `/map` (`/api/points` GeoJSON, clustered), `/townland/{county}/{slug}`, `/county/{county}`, `/topic/{slug}`, `/collect`, `/schools`, `/about`.
- Townland search uses `data/townlands.json` from the Lios project (townlands.ie, ODbL) via `/api/townlands?q=`.
- Towns and villages (1,438 cities, towns and villages in the 26 counties) come from OpenStreetMap (ODbL) in `data/places.json`, built by `node scripts/build-places.mjs`; the search ranks a town above a townland of the same name, and finds other spellings (Ballinagh, officially Bellananagh).
- MapLibre is loaded at runtime from `public/maplibre/` (see the comment in `src/app/map/MapView.tsx`).

## Media storage

Recordings and photographs go to Cloudflare R2 when `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET` are set; otherwise they are stored in Postgres (fine to start, dear at scale). R2: 10 GB and 10 million reads a month free, no egress charge, then about $0.015 per GB-month. The bucket stays private; `/api/media/{id}` streams each file after checking the story is approved (or the keeper secret / admin key). Switching to R2 later is a config change: old rows keep their database blob, new ones go to R2.

Setup: Cloudflare dashboard → R2 → Create bucket `meitheal` (EU jurisdiction) → Manage R2 API Tokens → Create token, permission "Object Read & Write", scoped to the bucket → copy the Access Key ID and Secret Access Key, and the Account ID from the R2 overview → `railway variables --service meitheal --set R2_ACCOUNT_ID=… --set R2_ACCESS_KEY_ID=… --set R2_SECRET_ACCESS_KEY=… --set R2_BUCKET=meitheal`.

## Deploy

Railway with a Postgres service attached (`DATABASE_URL` is injected). `npm start` runs migrations then the server. Set `ADMIN_KEY` and `MEITHEAL_SALT`. `railpack.json` adds ffmpeg to the image so long recordings can be transcribed and checked. Service settings live in `.railway/railway.ts` (`railway config plan` / `apply`); pushes to master deploy automatically.

## Later

- A weekly digest to schools, from the same mailer as the daily brief.
- Printed bound copybooks per school, at cost.
- The rest of the plan (roles, the NFC export, the hand-over pack) is in `docs/handoff.md`.

## Licence

AGPL-3.0-only (see `LICENSE`). The code is free to use and change; anyone who runs a modified version as a service must publish their changes under the same licence. The stories belong to the families and are not covered by this licence.
