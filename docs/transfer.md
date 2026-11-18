# Transfer checklist

Everything that changes hands if Meitheal 2027 goes to a public body or a buyer (docs/handoff.md, paths A and B).
Tick each one with the new owner in the room. Before starting, take all three backups in `docs/runbook.md`.

| | What | How it moves | Done |
|---|---|---|---|
| 1 | **Domain** meitheal2027.ie (and www) | Registrar transfer to the new owner's account; then move the DNS zone (currently Cloudflare) or recreate the two CNAMEs Railway gives | ☐ |
| 2 | **Railway project** meitheal (app and Postgres) | Railway → project settings → transfer to their workspace; or they create a project and restore the database dump | ☐ |
| 3 | **Railway variables** | They set their own keys for everything in `docs/runbook.md`; nothing secret is handed over in writing | ☐ |
| 4 | **R2 bucket** `meitheal` (EU) | Copy to their Cloudflare account (`rclone sync`), point the R2 variables at it, then delete ours | ☐ |
| 5 | **Cloudflare** (DNS, Workers AI token) | Their own account and token | ☐ |
| 6 | **Anthropic** key | Their own key, or switch the text checks off | ☐ |
| 7 | **Mail** | A sending address of theirs (`MAIL_FROM`, SMTP settings) and `BRIEF_TO` for the daily brief | ☐ |
| 8 | **GitHub repository** | Transfer the repo, or they fork it; the code stays AGPL-3.0 either way | ☐ |
| 9 | **Copyright in the code and the name "Meitheal 2027"** | A short assignment in writing (the AGPL does not stop a transfer of copyright) | ☐ |
| 10 | **Apple and Google developer accounts / app listings** | The accounts belong to Kevin Van Haesendonck (Rawbyte's product designer and front-end developer, subcontracted), not to the company, so he does the app transfer in App Store Connect and Play Console to their accounts and must agree to it | ☐ |
| 11 | **The stories, with their consent records** | `scripts/export.mjs` for the NFC copy; the live database moves with the Railway project | ☐ |
| 12 | **Desk accounts** | Their admin invited; ours disabled on `/desk/users` once they have signed in | ☐ |
| 13 | **Data protection** | The new owner becomes controller: update the DPIA, the privacy text on /about and the schools' agreements; tell schools in writing | ☐ |
| 14 | **Child Safeguarding Statement** | They adopt their own; readers' vetting moves to their registered organisation | ☐ |
| 15 | **Support period** | As agreed (3 to 6 months in the plan): fixes and questions by email | ☐ |
