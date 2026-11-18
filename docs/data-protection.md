# Data protection

**Draft, 13 October 2026.** A data protection impact assessment (DPIA) for Meitheal 2027 and a short agreement for
schools. Written from what the code does; have it read by someone qualified before the first school signs, and check it
against the Data Protection Commission's *Fundamentals for a Child-Oriented Approach to Data Processing*. Square brackets
are for you to fill in.

The public notice built from this is meitheal2027.ie/privacy (`src/app/privacy/page.tsx`). Change both together.

## Part 1: Data protection impact assessment

A DPIA is needed because the project processes children's data, recordings of voices and, at scale, older people's
memories, some of which may touch on health, religion or politics.

### 1. Who is responsible

- **Controller:** MemoryMantle Ireland Ltd (CRO 817937), trading as RawByte, Derrycramph, Cavan, H12 C925.
- **Contact:** hello@rawbyte.ie.
- **Data protection lead:** [name].

### 2. What is collected, and why

| Data | From whom | Why | Kept |
|---|---|---|---|
| The story text, title, heading, townland | the collector | it is the collection | for good, as an archive, unless the family removes it |
| Teller's first name, decade of birth, relation to the collector | the collector | attribution, as in 1937 | as the story |
| Collector's first name and age band, school and class | the collector | attribution; decides which teacher reviews it | as the story |
| A recording of the teller's voice, photographs of things and places | the collector | part of the story | as the story |
| A machine transcript of the recording | made by the service | to check the recording for problems, and as a first draft for the family to correct | as the story; not public (shown only on the family's private page and the desk) |
| The written-out text of the recording | the family, or a teacher or reader at the desk | so a recorded story can be read and printed in the class copybook | as the story; public only once a person at the desk has read that version |
| The copybook-only choice | the adult, through the teacher | the story goes in the class copybook and the NFC export (marked not for online use), and not on the website | as the story; the family asks the teacher to change it |
| Consenting adult's first name, the consent tick, and which consent wording and language they saw (`consent_version`, from 4 Nov 2026) | the adult | proof of consent | as the story |
| Consenting adult's email (optional) | the adult | to resend the private link | deleted when the story is removed |
| A hash of the sender's IP address | automatic | rate limiting | as the story; not public |
| Teacher and reader accounts: name, email, school, county, nominator | the admin | to run the reading desk | while in use; anonymised 12 months after last use (or after the invite, if never used), signed out, the row kept as "[deleted]" so past decisions stay accountable; the owner's account excepted (`src/lib/retention.ts`, daily) |
| An audit of desk decisions | automatic | accountability | 3 years, then deleted (`src/lib/retention.ts`, daily) |

Not collected, by design: surnames, addresses, dates of birth, health details, photographs of children.

### 3. Lawful basis

- **Stories, recordings, photographs:** consent (Article 6(1)(a)), given by an adult for the collector and the teller,
  recorded per story. For archiving in the public interest, Article 89 safeguards apply.
- **Special category data that a story may contain** (health, beliefs): explicit consent (Article 9(2)(a)), and the
  check plus a human reader before anything is public.
- **Desk accounts and the audit:** legitimate interests in running and safeguarding the service (Article 6(1)(f)).

### 4. Who it is shared with (processors)

| Processor | What | Where |
|---|---|---|
| Railway | hosting the website and database | EU (Netherlands); Railway Corp. is a US company |
| Cloudflare | R2 storage (media), Workers AI (photo check, transcription), DNS | R2 in the EU jurisdiction; Workers AI may run outside the EU |
| Anthropic | reads transcripts and written stories for problems | US; covered by [the EU-US Data Privacy Framework / standard contractual clauses] |
| Zoho | email | EU |
| GitHub | the code only; no stories | US |
| OpenFreeMap | map tiles, fetched by the visitor's browser on /map; sees the visitor's IP address, no story data | [check] |

Action: confirm each processor's data processing terms and the transfer mechanism for Cloudflare Workers AI and Anthropic.
If a school or the NFC asks for EU-only processing, the checks can be turned off (`CLOUDFLARE_AI_TOKEN`, `ANTHROPIC_API_KEY`)
and every story is still read by a person.

### 5. Risks and what reduces them

| Risk | Likelihood / harm | Measures |
|---|---|---|
| A child or teller is identifiable | possible / medium | first names only; townland, not address; decade, not date; surnames sent back; no photos of children |
| A story names or defames a living person | possible / medium | the Claude check flags personal details and abuse; a person reads every story; families and the public can flag; two flags take it down |
| Unsuitable images or language | unlikely / medium | automatic checks, then a person; flagged photos stay blurred on the desk |
| A desk account is misused | unlikely / high | sign-in links, no passwords; scope by school or county; nominator recorded; audit trail; disable ends sessions at once |
| Data breach at a processor | unlikely / medium | minimal data; media private; keys rotatable (`docs/runbook.md`) |
| Consent was not really given | possible / medium | adult ticks and names themselves; teachers send the note home (`/schools`); the family can remove at any time with no questions |
| Data kept forever without need | certain / low | it is an archive by consent; email deleted on removal; desk accounts reviewed yearly |

### 6. Rights

Families remove a story themselves from the keeper page. Access, correction and erasure requests go to hello@rawbyte.ie
and are answered within a month. Removal deletes the recording and photos from storage; a copy already given to the NFC
is removed on request to them.

### 7. Sign-off

Assessed by [name], [date]. Review before the national launch and every year after.

## Part 2: Agreement with a school

A one-page agreement a principal can sign. **Draft.**

**Between** MemoryMantle Ireland Ltd, trading as RawByte ("Meitheal 2027"), and [school name, roll number] ("the school").

1. **What the school does.** Lets pupils take part in Meitheal 2027 as a class project; sends home the parents' note
   (meitheal2027.ie/schools); nominates the teacher who reviews the class's stories.
2. **What Meitheal 2027 does.** Runs the website and app free of charge; holds the stories, recordings and photographs
   under the consent given by each family; publishes nothing until a person has read it; offers the collection to the
   National Folklore Collection; removes any story on request.
3. **The teacher's account.** Is used only by the named teacher to review that class's stories, and is disabled when the
   teacher leaves the class or the school asks.
4. **Data.** Meitheal 2027 is the controller of the stories and the accounts. It collects only what is in the DPIA
   above, keeps it in the EU where it can (see the processors list), and tells the school without delay of any breach
   affecting its pupils.
5. **Safeguarding.** Teachers act under the school's Child Safeguarding Statement; Meitheal 2027's own statement covers
   its people (`docs/child-safeguarding-statement.md`). Any concern found in a story is reported by the teacher under the
   school's procedures, and to Meitheal 2027's Designated Liaison Person.
6. **Ending.** Either side can end this by email. Published stories stay published unless the family asks otherwise.

Signed for the school: ____________________ (principal) Date: ________
Signed for Meitheal 2027: ____________________ Date: ________
