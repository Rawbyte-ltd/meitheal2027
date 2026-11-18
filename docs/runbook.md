# Runbook

How Meitheal 2027 runs, for whoever is looking after it. Written 13 October 2026; check anything here against
`.railway/railway.ts` and the code, which win if they disagree.

## What is where

| Part | Where | Notes |
|---|---|---|
| Website and API | Railway project **meitheal**, service **meitheal** (EU West, Netherlands) | Next.js 16, `sh scripts/start.sh`; migrations run on every start (`scripts/migrate.mjs`) |
| Database | Railway project **meitheal**, service **Postgres** | Stories, media index, users, audit, the brief's marker |
| Recordings and photos | Cloudflare R2 bucket `meitheal`, EU jurisdiction | Private; served only through `/api/media/{id}` |
| Photo and recording checks | Cloudflare Workers AI (LLaVA, Whisper) and Anthropic (Claude Haiku) | `src/lib/scan.ts`; they flag, never block |
| Mail | Zoho SMTP as meitheal@rawbyte.ie | Daily brief, flag alerts, sign-in links, keeper-link resends |
| Domain | meitheal2027.ie and www, DNS on Cloudflare | Certificates by Railway (Let's Encrypt) |
| Code | GitHub `Justyoureverydaynormalguybob/meitheal`, AGPL-3.0 | A push to `master` deploys |
| Phone app | `apps/mobile` (Flutter) | Android APK built locally; iPhone build via `.github/workflows/ios.yml` |

## Deploying

Push to `master`. Railway builds with Railpack (`railpack.json` adds ffmpeg), runs the migrations, starts the server
and checks `/api/health`. Watch with `railway deployment list` until SUCCESS, then check that `/api/version` shows the
commit you pushed (`git rev-parse HEAD`). The previous container gets 10 seconds to finish (`drainingSeconds`), so the
"deployment crashed" email should not come.

Service settings live in `.railway/railway.ts`. Every variable must be listed there as `preserve()`, or
`railway config apply` deletes it. Check with `railway config plan` before applying.

## Settings (Railway variables)

`scripts/check-env.mjs` runs first on every start and refuses to start on a missing salt, database or https site address,
or on half-set mail or R2 settings; the deploy log says which. `/api/health` lists anything running degraded under
`warnings` (mail off, checks off, a brief that did not go out, a story whose check never finished).

| Variable | What it does | Without it |
|---|---|---|
| `DATABASE_URL` | Postgres, injected by Railway | nothing works |
| `ADMIN_KEY` | Admin access to `/desk?key=` until the first admin signs in | the desk needs a signed-in admin |
| `MEITHEAL_SALT` | Salts the IP fingerprints kept with stories and flags; 16+ characters | the site will not start (a known salt makes the fingerprints reversible) |
| `NEXT_PUBLIC_SITE_URL` | `https://meitheal2027.ie`, used in links in emails and share cards | links point at Railway's own address |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_JURISDICTION` | Media storage | media goes into Postgres instead |
| `CLOUDFLARE_AI_TOKEN` | Photo check, recording transcription | photos and recordings are not checked |
| `ANTHROPIC_API_KEY` | Reads transcripts and written stories | they are not checked; desk says "not checked" |
| `MAIL_SMTP_HOST`, `MAIL_SMTP_PORT`, `MAIL_SMTP_USER`, `MAIL_SMTP_PASS`, `MAIL_FROM` | Outgoing mail through Zoho | mail is written to the log instead |
| `BRIEF_TO` | Who gets the 19:00 brief and flag alerts (meitheal@rawbyte.ie) | hello@rawbyte.ie |
| `BRIEF_AT` | Time of the brief, Europe/Dublin | 19:00 |
| `AUTO_PUBLISH` | `off` sends every teacher approval to a reader | teacher approvals publish when every check is safe |
| `SITE_PASSWORD` | Puts the whole site behind a password page | the site is open (it is, since 12 October 2026) |

`MAIL_SMTP_PASS` is a Zoho app password shared with other Rawbyte services; copy it between them without printing it.

## Every day

- 19:00: the brief arrives at meitheal@rawbyte.ie with new stories, what is waiting and anything a check flagged, each
  with a link to the desk. No brief on a day with nothing to say. A flag on a published story emails at once.
- The desk (`/desk`): teachers approve their class; county readers take the rest and the "second look" stories; the
  admin checks "Published without me" now and then.
- The Transcripts tab: a family has changed the written-out text of a story that is already published. The story page
  keeps the version that was read until someone saves the new one. The brief counts them.

## Written out, and the copybook

- **Written out** (`src/lib/transcript.ts`): every recording gets a machine transcript for the check. The family sees it
  on their keeper page as a first draft, corrects it and saves. Irish recordings have no machine version, so the family
  writes it out from scratch. Teachers and readers can edit it on the desk too. Publishing a story publishes its saved
  text; text saved at the desk on a published story goes public at once. A family's text gets the same check as a
  story, and a teacher's approval only auto-publishes when that check is clean.
- **Another language** (migrations/010): a story marked as being in another language (Polish, Portuguese, Yoruba) is
  transcribed as heard and the check also puts it into English, kept beside the original and marked machine-made on
  the desk and the story page. A story can name a far place (town and country) beside its townland; the places page
  lists the countries. English recordings are still transcribed as English, Irish ones still skipped.
- **The copybook** (`/desk/copybook`): a teacher or admin picks a class and gets its published stories laid out as A5
  pages: a cover, the contents, one story per page with a QR code to its page (where the recording plays), and the
  townlands. Print it from the browser, or save it as a PDF for the printer (A5, margins Default, headers and footers
  off). `?lang=ga` gives Irish labels. Long written-out texts are cut to about 600 words unless "in full" is chosen.
- **Copybook only** (status `kept`, `src/lib/review.ts`): the website is the default and families get no tick box. The
  rare family that doesn't want a story online tells the teacher, who presses "Copybook only" on the desk (it takes a
  published story off at once). It prints in the copybook with no QR code and never shows on the website, the map,
  search or the API. It does go in the NFC export, marked `online: false`. "Put it on the website" on the desk's
  Copybook only tab undoes it, with a second look if a check wants one.

## What the checks say

| On the desk | Means | Do |
|---|---|---|
| Check: nothing found | Every check ran and found nothing | read it as normal |
| Mild: language | Mild swearing or upsetting but not graphic | usually fine for a folklore collection; your call |
| Flagged … (blurred photo) | The model thinks it is unsuitable or names a living person's details | look before publishing; old photos are often flagged wrongly |
| Not checked: no Irish | Whisper has no Irish | listen to it |
| Check failed (…) | The service was down, the file was odd, or no speech was heard | look at it yourself |
| Story not checked | No Anthropic key, or the check is still running | read it |

## Removing a story

The family can remove it from their keeper page at any time. An admin can press Remove on the desk. Either way the
recordings and photos are deleted from R2 and the text, names, school, class, email and IP fingerprint are cleared;
the id, dates, heading, townland and the consent record stay (`src/lib/remove.ts`, /privacy). If R2 will not delete a
file, nothing is removed and the desk says to try again. A removed story cannot be brought back by any desk button. For a removal request by email, find the story on the desk
(search the title on `/stories` first) and remove it there; reply to say it is done.

## Backups

- **The collection, readable:** `railway ssh "cd /app && node scripts/export.mjs /tmp/nfc && tar czf /tmp/nfc.tgz -C /tmp nfc"`,
  then `railway service files download /tmp/nfc.tgz ./nfc.tgz` (the app service is the linked one). This is the NFC
  hand-over format and a good monthly copy.
- **The database, restorable** (tested 13 October 2026: dump, copy and restore all check out). Dump to a file on the
  Postgres service, then bring it back as one line of base64; piping the dump straight through `railway ssh` loses data.

  ```sh
  railway ssh -s Postgres 'pg_dump -Fc -U $PGUSER $PGDATABASE > /tmp/d && sha256sum /tmp/d && base64 -w0 /tmp/d; echo; rm -f /tmp/d' > dump.txt
  sed -n 2p dump.txt | tr -d '
 ' | base64 -d > meitheal.dump && sha256sum meitheal.dump   # the two sums must match
  ```

  Restore with `pg_restore --clean --no-owner -d <DATABASE_URL> meitheal.dump`.
- **Media:** the R2 bucket. Copy with `rclone sync` or `aws s3 sync --endpoint-url https://<account>.eu.r2.cloudflarestorage.com s3://meitheal ./meitheal-media`.

Do all three before any hand-over and once a month during the school year.

## People and access

- One admin is the **owner** (steven@rawbyte.ie): only the owner can invite, disable or re-enable admins, and nobody can disable the owner. Other admins run everything else.
- Invite teachers and readers on `/desk/users`. A nominator is required for everyone but admins: it is the
  safeguarding record (who vouches for this person).
- Disable someone on the same page; their sessions end at once.
- Every decision is on `/desk/audit`.
- Locked out (no admin can sign in): `railway ssh "cd /app && node scripts/add-admin.mjs you@example.ie 'Your Name'"`
  prints a sign-in link valid for 15 minutes and makes that person the owner.

## Rotating keys

| Key | How |
|---|---|
| `ADMIN_KEY` | Only matters before the first admin signs in. Set a new random value with `railway variable set`. |
| R2 | Cloudflare dashboard → R2 → API tokens: make a new token for the bucket, set both R2 variables, delete the old token. |
| `CLOUDFLARE_AI_TOKEN` | Cloudflare → API tokens: new token with Workers AI · Read, set it, revoke the old one. |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys: new key, set it, disable the old one. |
| Zoho app password | Zoho → Security → App passwords. It is shared with other Rawbyte services: update all of them. |
| A desk session | Disable and re-enable the person, or delete their rows in `sessions`. |

## Costs (October 2026)

| Thing | Cost |
|---|---|
| Railway (app always on, Postgres) | small at this traffic: $0.16 for the first three days; check `railway usage projects` |
| Cloudflare R2 | free to 10 GB and 10 million reads a month, no egress; then about $0.015 per GB-month |
| Workers AI | 10,000 neurons a day free (about 200 minutes of transcription), then $0.011 per 1,000 neurons; transcription is about $0.0005 a minute |
| Anthropic (Claude Haiku 5.5) | about $0.0003 per ten-minute recording or written story |
| Zoho | the existing mailbox |
| Apple Developer Program | $99 a year, once the iPhone app goes to families |
| Google Play | a one-off registration fee, once the Android app goes to the store |


## The phone app

Test builds come from `gh workflow run android.yml` (Android) and `ios.yml` (iPhone); see apps/mobile/README.md. Android builds are signed with one steady test key held in the repository secrets, so they install over each other; the Play Store key is separate and is covered in docs/transfer.md.
