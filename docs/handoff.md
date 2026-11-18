# Hand-off plan

Written 12 October 2026; facts corrected 5 November 2026 (audit item 22). **Status, 5 November:** no demonstration class
yet, and the hand-over conversations are kept with the outreach notes, which are not in the public copy. The plan below is kept as written.

The site is built. The plan is one demonstration school in Cavan this term, then an owner
from January 2027. Steven works full time and will not be the reader for a county, let alone a country. In 1937 the
teachers read and selected and the Commission archived; the software has to make reading a role, not a person.

## Paths

| | A. Give it to a public body | B. Sell it | C. Keep hosting, hand off the reading |
|---|---|---|---|
| Who | Gaois (DCU) with the National Folklore Collection; or Cavan County Council library and heritage service | An educational publisher, a heritage or genealogy company, a university, or a council through procurement | Rawbyte hosts; teachers approve their own classes; county readers do the rest |
| Money | A fixed-fee handover contract: roles build, hand-over pack, 3 to 6 months of support. Under €50k on three quotes, under €5k on one | A small sum plus a support contract. The value is the idea, the timing and a working product | A yearly fee per county for hosting and support |
| You keep | Credit, reuse of the code, nothing to run | Money and credit | Ownership, an hour or two a week of flags and fixes |
| Risk | Slow decisions; start now for a spring answer | A buyer may not appear | The roles build must come first |

Recommendation: aim for A with Gaois and the NFC, run C in Cavan meanwhile so the demonstration happens either way,
keep B as the fallback. All three need the roles build and the hand-over pack first.

What transfers in any path: copyright in the code (the AGPL keeps the code open; it does not stop a transfer of
copyright, name, domain or accounts), the Meitheal 2027 name and domain, the Flutter app and its store listings (the Apple and Google developer accounts are Kevin Van Haesendonck's, so the app transfer needs his agreement), the hosting
accounts, and the stories with their consent records. The consent terms travel with the stories: archive copy to the
NFC, removal on request, first names only.

## Phase 0: before the demonstration school (done 12 October 2026)

- Daily brief at 19:00 Europe/Dublin to `BRIEF_TO` (meitheal@rawbyte.ie): stories received today, pending total,
  anything a check flagged, one link per story to the reading desk. No email on a day with nothing new and nothing
  pending. A public flag on a published story sends at once. It runs inside the web service (`src/instrumentation.ts`
  starts the clock; no cron service), mail goes through Zoho SMTP, and each run shows in `/api/health`.
- Keeper-link resend: `POST /api/keep/resend` with the adult's email; sends the `/keep/{id}?k=` link for every story
  with that email. The form already promises this.
- The written story goes through the Haiku check used for transcripts (`src/lib/scan.ts`), result in a new
  `stories.scan` / `stories.scan_note`; the desk shows one verdict per story.

## Phase 1: roles (done 13 October 2026)

Schema (`migrations/006_roles.sql`):

- `users(id, email unique, name, role 'admin'|'teacher'|'reader', county, school, class_name, invited_by, created_at, last_seen)`
- `logins(token_hash, user_id, expires_at, used_at)` for magic links
- `stories.reviewed_by`, `stories.reviewed_at`, `stories.review_note`
- `audit(id, at, user_id, story_id, action, detail)`

Login: email a magic link (Zoho SMTP), 15-minute single-use token, cookie session. No passwords. Admin invites by email
from the desk; the invite names the role and scope.

Queues on the desk (`/desk`, replacing `/admin?key=`; the key keeps working for the admin until the first admin user has signed in):

- Teacher: pending stories where `school`, `county` and, if set, `class_name` match theirs (names compared without case or
  punctuation; see the audit, item 13, for why a roll number would be better). Approve, or send back with a note the family
  sees on the keeper page. Cannot feature, remove or see other schools.
- Reader: pending stories in their county with no school. Same actions as a teacher.
- Admin: everything, flags, feature, remove, user management, and the audit trail.

Auto-publish rule (on unless `AUTO_PUBLISH=off`): a story approved by its teacher whose media checks are all `safe` and whose
text check is `safe` goes live at once. Anything `mild`, `unsafe`, `skipped` (Irish) or `error`, and any story without
a school, waits for a reader or the admin. The admin sees a "published without me" list for spot checks.

Safeguarding: teachers are vetted through their school. Readers outside a school are vetted through the partner body
(library, heritage office, historical society) that nominates them; the invite records who nominated.

Stories from elsewhere (migrations/010, 15 October 2026): one person in five in Ireland was born abroad, so a story can
name a far place (town and country) beside its townland, and can be in a language other than English or Irish. The
transcriber hears which language a recording is in, and the check puts the text into English beside the original
(marked as machine-made) so a reader without Polish or Portuguese can still read it; the original is the record. A
story that touches on why a family left a country is marked `mild` by the check so a person reads it with care; the
safeguarding statement says what that care is. A 2027 heading, Coming to Ireland, asks the question directly.

## Phase 2: hand-over pack (done 13 October 2026: `scripts/export.mjs`, `docs/runbook.md`, `docs/data-protection.md`, `docs/child-safeguarding-statement.md`, `docs/transfer.md`; the legal drafts need a qualified read)

- NFC export (`scripts/export.mjs`): one folder per story with `story.json` (all fields, consent record, review trail),
  the text as `.txt`, media files, and a top-level `manifest.json`. Runs against R2 or Postgres blobs.
- Runbook (`docs/runbook.md`): deploy, environment keys, backups and restore, monthly costs, what each check verdict
  means, how to remove a story and its media, how to rotate keys.
- Data protection impact assessment, a data processing agreement for schools, and a Child Safeguarding Statement
  template, in `docs/`.
- Transfer checklist: domain, Railway project, R2 bucket, Cloudflare account, Anthropic key, Apple and Google developer
  accounts, GitHub repo, the Zoho mailbox alias meitheal@rawbyte.ie.

## Phase 3: only for path C (about 5 days)

- `counties(slug, name, logo, admin_user)` with per-county pages carrying the county's name and logo.
- County admin role: manages that county's teachers and readers.
- One invoice a year per county; no billing system.

## Order

Phase 0 before the demonstration class submits. Phase 1 before any second school, because a teacher approving her own
pupils' stories is the demonstration. Phase 2 before the first handover meeting with a taker, since the pack is what
they will ask for. Phase 3 only if path C is the one that lands.
