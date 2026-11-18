# Irish for a native speaker to check

Audit item 31 (`docs/AUDIT-2026-11-04.md`). Nothing here has been read by a native speaker. Corrections go straight into
the files named; the English beside each line is what it has to say.

## Written on 5 November 2026 (machine-written, unread)

| Where | Irish | Has to say |
|---|---|---|
| `src/lib/i18n.ts`, `form.consent` (ga), and `apps/mobile/lib/strings.dart`, `consent` (ga) | the whole consent box, especially "Ainmnítear an páiste a bhailigh é lena chéadainm, a aoisghrúpa agus a scoil, más ann di." and "Seiceálann meaisín é agus léann duine é sula mbíonn aon rud poiblí." | The child who collected it is named by first name, age band and school, if there is one. It is checked by machine and read by a person before anything is public. **This is consent wording: if it changes, bump `CONSENT_VERSION` and `kConsentVersion`.** |
| `src/lib/i18n.ts`, `form.consentLink` (ga) | "Conas a thugaimid aire dó" | How we look after it (link to the privacy page) |
| `src/app/privacy/page.tsx` (ga) | the whole page | The English version beside it. Legal terms to check: "rialaitheoir" (controller), "RGCS" (GDPR), "leasanna dlisteanacha" (legitimate interests), "clásail chonarthacha chaighdeánacha" (standard contractual clauses), "Creat Príobháideachta Sonraí AE-SAM" (EU-US Data Privacy Framework), "an Coimisiún um Chosaint Sonraí", "anaithniú" (anonymise), "méarlorg aontreo" (one-way fingerprint) |
| `src/app/about/page.tsx`, last privacy line (ga) | "Go dtí go n-aontaítear é sin, coinnímidne é. Ritheann seiceálacha meaisín air sula léann duine é, cuid acu lasmuigh den AE; …" | Until that is agreed, we hold it. Machine checks run on it before a person reads it, some of them outside the EU; the privacy page says who handles what, and where. |
| `src/lib/i18n.ts`, `home.examplesH`, `home.firstYet` (ga) | "Samplaí ó Bhailiúchán na Scol 1937"; "Tá na chéad scéalta ar an mbealach. …" | Examples from the 1937 Schools' Collection; the first stories are on their way… not counted as Meitheal's. |
| `src/lib/i18n.ts`, `county.examples` (ga) | "Thíos freisin: N sampla/samplaí ó Bhailiúchán na Scol 1937, marcáilte 1937." | Shown below as well: N examples from the 1937 Schools' Collection, marked 1937. (Check the counting form after numbers.) |
| `src/lib/i18n.ts`, `keep.removeFailed` (ga) | "Níorbh fhéidir é a bhaint díreach anois, mar sin níor athraíodh faic. …" | It could not be removed just now, so nothing was changed. Try again in a minute, or email us and we will do it. |

## Found by the audit (older copy)

- `src/app/about/page.tsx`, `free` (ga): "Saor in aisce, agus maoinithe conas" reads as a word-for-word calque of
  "Free, and funded how".
- "i 1937" (story page) and "in 1937" (About): pick one.
- The collection is called both "Bailiúchán na Scol" and "Bailiúchán Béaloideasa na Scol": pick one, or say where
  each is right.
- English-only messages a visitor can see from the API: "Say what is wrong", "No such story" (`src/app/api/flag/route.ts`)
  and "Wrong link" (`src/app/api/keep/[id]/route.ts`). These need an Irish version as well as a check.
