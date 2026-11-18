import QRCode from "qrcode";
import { deskActor, norm, normSql, scopeSql } from "@/lib/auth";
import { q } from "@/lib/db";
import { ageLabel, bornIn, coOf, headingIn, langAttr, placeOf, townlandName } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { paragraphs, PUBLIC_COLS, type Story } from "@/lib/stories";
import PrintButton from "./PrintButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "The copybook", robots: { index: false } };

/**
 * The class copybook: one bound book of a class's published stories for the school library, like the 1937 copybooks
 * the NFC bound into a volume per school. The page lays it out as A5 leaves; the browser's print window saves it as a
 * PDF for the printer. Each story carries a QR code to its page, where the recording plays. A recording's story prints
 * its written-out text (src/lib/transcript.ts); a long one is cut to about 600 words unless "long stories in full" is on.
 * A story the family kept for the book only (status 'kept', src/lib/review.ts) prints like the rest but has no code:
 * it is not on the website, and its photo comes through the desk's own access.
 * Labels follow the site language (?lang=ga gives an Irish copybook); the stories stay in the language they were told in.
 */
const site = () => (process.env.NEXT_PUBLIC_SITE_URL || "https://meitheal2027.ie").replace(/\/$/, "");
const LONG = 700, KEEP = 600;

/** About KEEP words of a long text, ended at a full stop where there is one, keeping its paragraphs. */
function extract(text: string): { text: string; cut: boolean } {
  const words = [...text.matchAll(/\S+/g)];
  if (words.length <= LONG) return { text, cut: false };
  const at = words[KEEP - 1].index! + words[KEEP - 1][0].length, head = text.slice(0, at);
  const stop = Math.max(head.lastIndexOf(". "), head.lastIndexOf("? "), head.lastIndexOf("! "), head.lastIndexOf(".\n"));
  return { text: (stop > head.length * 0.6 ? head.slice(0, stop + 1) : head) + " …", cut: true };
}

type Group = { school: string; class_name: string; county: string; n: number };
type Row = Story & { photo: number | null };

const CSS = `
@page { size: A5; margin: 14mm 13mm 16mm; @bottom-center { content: counter(page); font: 9pt Georgia, serif; color: #6b6457; } }
@page :first { @bottom-center { content: none; } }
.book { color: #1f2733; }
.leaf { background: #fffdf8; width: 148mm; min-height: 210mm; margin: 0 auto 10mm; padding: 14mm 13mm 16mm; box-shadow: 0 1px 8px rgba(0,0,0,.18); box-sizing: border-box; overflow-wrap: break-word; }
.leaf h1 { font-family: var(--font-display); font-size: 24pt; line-height: 1.15; margin: 4mm 0; }
.leaf h2 { font-family: var(--font-display); font-size: 17pt; line-height: 1.2; margin: 1.5mm 0 2mm; }
.leaf .kick { font: 600 7.5pt/1.3 var(--font-body); letter-spacing: .12em; text-transform: uppercase; color: #6b6457; }
.leaf .meta { font: 9pt/1.45 var(--font-body); color: #4a4438; margin: 0 0 4mm; }
.leaf .text { font-family: var(--font-display); font-size: 11pt; line-height: 1.55; }
.leaf .text p { margin: 0 0 3mm; }
.leaf .photo { max-width: 100%; max-height: 62mm; display: block; margin: 0 0 4mm; border-radius: 2mm; }
.leaf .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 5mm; }
.leaf .head > div:first-child { min-width: 0; }
.leaf .qr { flex: none; width: 24mm; text-align: center; font: 6.5pt/1.3 var(--font-body); color: #4a4438; }
.leaf .qr svg { width: 22mm; height: 22mm; display: block; margin: 0 auto 1mm; }
.leaf .small { font: 8.5pt/1.5 var(--font-body); color: #6b6457; }
.leaf ol, .leaf ul { font: 10pt/1.5 var(--font-body); padding-left: 5mm; }
.cover { display: flex; flex-direction: column; justify-content: center; text-align: center; border: 1.2mm double #b8862b; outline: 6mm solid #fffdf8; }
.cover dl { display: grid; grid-template-columns: auto auto; justify-content: center; gap: 1.5mm 4mm; font: 10.5pt var(--font-body); margin: 8mm 0; text-align: left; }
.cover dt { color: #6b6457; } .cover dd { margin: 0; min-width: 40mm; border-bottom: .3mm solid #d9cfbf; }
@media screen and (max-width: 640px) { .leaf { width: 100%; min-height: 0; padding: 18px; } .cover { outline: 0; } }
@media print {
  html, body { background: #fff !important; }
  .copy-tools { display: none !important; }
  main.copybook-page { max-width: none; margin: 0; padding: 0; }
  .leaf { width: auto; min-height: 0; margin: 0; padding: 0; box-shadow: none; background: none; break-after: page; }
  .leaf:last-child { break-after: auto; }
  .cover { min-height: 178mm; outline: 0; padding: 10mm; }
}`;

export default async function Copybook({ searchParams }: { searchParams: Promise<{ key?: string; school?: string; class?: string; county?: string; full?: string }> }) {
  const sp = await searchParams;
  const a = await deskActor(sp.key);
  const { lang, t } = await getDict();
  const keyQs = a?.key ? `&key=${encodeURIComponent(a.key)}` : "";
  if (!a) return <main className="wrap"><p className="notice">Sign in at the <a href="/desk">reading desk</a> first.</p></main>;

  // The classes this person can make a copybook for: published and kept school stories in their scope.
  const sc = scopeSql(a, 1);
  const groups = await q<Group>(`SELECT min(s.school) AS school, coalesce(min(s.class_name), '') AS class_name, s.county, count(*)::int AS n
    FROM stories s WHERE s.status IN ('approved', 'kept') AND s.source_url IS NULL AND trim(coalesce(s.school, '')) <> '' AND (${sc.where})
    GROUP BY ${normSql("s.school")}, ${normSql("s.class_name")}, s.county ORDER BY 1, 2`, sc.params);
  const pick = sp.school !== undefined ? groups.find(g => norm(g.school) === norm(sp.school) && norm(g.class_name) === norm(sp.class) && (!sp.county || g.county === sp.county)) : groups.length === 1 ? groups[0] : undefined;
  const link = (g: Group, full = !!sp.full) => `/desk/copybook?school=${encodeURIComponent(g.school)}&class=${encodeURIComponent(g.class_name)}&county=${encodeURIComponent(g.county)}${full ? "&full=1" : ""}${keyQs}`;

  const tools = (
    <section className="copy-tools">
      <div className="kicker">The reading desk · <a href={`/desk?x=1${keyQs}`}>back to the desk</a></div>
      <h1>Make the <em>copybook</em></h1>
      <p className="lead">A bound copybook of a class&apos;s published stories for the school library, and the ones families kept for the book only. Pick the class, check the pages, then print, or save it as a PDF for the printer. In the print window choose A5 paper, keep the margins at Default and turn off headers and footers.</p>
      {!groups.length && <p className="notice">Nothing to make a copybook from yet: it uses a class&apos;s published stories, and the ones kept for the book only.</p>}
      {groups.length > 0 && <div className="chips">{groups.map(g => <a key={`${g.school}|${g.class_name}|${g.county}`} href={link(g)} className={pick === g ? "on" : undefined}>{g.school}{g.class_name ? `, ${g.class_name}` : ""} · Co. {g.county} · {g.n}</a>)}</div>}
      {pick && <div className="chips" style={{ marginTop: 12 }}>
        <PrintButton />
        <a href={link(pick, !sp.full)}>{sp.full ? "Shorten long stories" : "Print long stories in full"}</a>
        <a href={`${link(pick)}&lang=${lang === "ga" ? "en" : "ga"}`}>{lang === "ga" ? "Labels in English" : "Labels in Irish"}</a>
      </div>}
    </section>
  );
  if (!pick) return <main className="wrap copybook-page">{tools}</main>;

  const p = [...sc.params], at = (v: unknown) => { p.push(v); return `$${p.length}`; };
  const rows = await q<Row>(`SELECT ${PUBLIC_COLS.replaceAll("stories.id", "s.id")}, (SELECT m.id FROM media m WHERE m.story_id = s.id AND m.kind = 'photo' ORDER BY m.id LIMIT 1) AS photo
    FROM stories s WHERE s.status IN ('approved', 'kept') AND s.source_url IS NULL AND (${sc.where}) AND ${normSql("s.school")} = ${at(norm(pick.school))} AND ${normSql("s.class_name")} = ${at(norm(pick.class_name))} AND s.county = ${at(pick.county)}
    ORDER BY s.created_at`, p);
  const qr = await Promise.all(rows.map(s => s.status !== "approved" ? "" : QRCode.toString(`${site()}/story/${s.id}`, { type: "svg", margin: 0, errorCorrectionLevel: "M" })));
  const bk = t.book, st = t.story;
  const years = [...new Set(rows.map(s => new Date(s.created_at).getFullYear()))].sort();
  const towns = [...new Map(rows.map(s => [`${s.county}/${s.townland_slug}`, s])).values()].sort((x, y) => x.townland_en.localeCompare(y.townland_en));

  return (
    <main className="wrap copybook-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      {tools}
      <div className="book" lang={lang === "ga" ? "ga" : "en-IE"}>
        <section className="leaf cover">
          <div className="kick">Meitheal 2027</div>
          <h1>{pick.school}</h1>
          <p className="text">{bk.cover}</p>
          <dl>
            <dt>{bk.cls}</dt><dd>{pick.class_name}</dd>
            <dt>{bk.teacher}</dt><dd>{a.user?.role === "teacher" ? a.user.name : ""}</dd>
            <dt>{lang === "ga" ? "Contae" : "County"}</dt><dd>{coOf(pick.county, lang)}</dd>
            <dt>{lang === "ga" ? "Bliain" : "Year"}</dt><dd>{years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : years[0]}</dd>
          </dl>
          <p className="small">{bk.stories(rows.length)}</p>
        </section>
        <section className="leaf">
          <div className="kick">Meitheal 2027</div>
          <div className="text" style={{ marginTop: "4mm" }}><p>{bk.intro}</p></div>
          <h2 style={{ marginTop: "8mm" }}>{bk.contents}</h2>
          <ol>{rows.map(s => <li key={s.id}>{s.title} <span className="small">· {s.teller_name}</span></li>)}</ol>
        </section>
        {rows.map((s, i) => {
          // A recording's written-out text, or the story the child wrote, whichever is the fuller.
          const useWritten = !!s.transcript_public && s.transcript_public.length > s.body.length;
          // A kept story has no code to the rest, so it prints in full.
          const ex = useWritten && !sp.full && qr[i] ? extract(s.transcript_public!) : { text: useWritten ? s.transcript_public! : s.body, cut: false };
          return (
            <article key={s.id} className="leaf" lang={langAttr(s.lang)}>
              <div className="head">
                <div>
                  <div className="kick">{headingIn(s, lang)}</div>
                  <h2>{s.title}</h2>
                  <p className="meta">
                    {st.toldBy} {s.teller_name}{bornIn(s.teller_born, lang)}{s.teller_relation ? st.ofCollector(s.teller_relation) : ""}.<br />
                    {st.collectedBy} {s.collector_name}{s.collector_age ? ` (${ageLabel(s.collector_age, lang)})` : ""} · {placeOf(s, lang)}
                  </p>
                </div>
                {/* Beside the title, so it can never end up alone on a page. */}
                {qr[i] ? <div className="qr"><span dangerouslySetInnerHTML={{ __html: qr[i] }} />{s.has_audio ? bk.hear : bk.read}</div> : <div className="qr">{bk.kept}</div>}
              </div>
              {s.photo && <img className="photo" src={`/api/media/${s.photo}${s.status !== "approved" && a.key ? `?admin=${encodeURIComponent(a.key)}` : ""}`} alt="" />}
              <div className="text">{paragraphs(ex.text).map((x, j) => <p key={j}>{x}</p>)}</div>
              {ex.cut && <p className="small">{bk.rest}</p>}
              {s.has_audio && !useWritten && qr[i] && <p className="small">{bk.onRecording}</p>}
            </article>
          );
        })}
        <section className="leaf">
          <h2>{bk.townlands}</h2>
          <ul>{towns.map(s => <li key={`${s.county}/${s.townland_slug}`}>{townlandName(s.townland_en, s.townland_ga, lang)}, {coOf(s.county, lang)}</li>)}</ul>
          <p className="small" style={{ marginTop: "10mm" }}>{bk.offered}</p>
        </section>
      </div>
    </main>
  );
}
