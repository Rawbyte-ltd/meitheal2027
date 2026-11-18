import { pageMeta } from "@/lib/seo";
import StoryCard from "@/app/StoryCard";
import { decadeLabel, placeOf } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { listStories, tellerList } from "@/lib/stories";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { lang, t } = await getDict(); return pageMeta(t.people.title, lang === "ga" ? "Na daoine a d'inis na scéalta, de réir ainm baiste, deich mbliana a mbreithe agus a mbaile fearainn." : "The people who told the stories, by first name, decade of birth and townland."); }
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function People({ searchParams }: { searchParams: Promise<{ letter?: string; teller?: string }> }) {
  const { letter, teller } = await searchParams;
  const { lang, t } = await getDict(), p = t.people;
  if (teller) {
    const rows = await listStories({ teller, limit: 100 }); const [name, born, slug] = teller.split("|");
    return (
      <main className="wrap">
        <section><div className="kicker"><a href="/people">{t.nav.people}</a> · {p.teller}</div><h1>{name}</h1><p className="lead">{born ? p.bornIn(born) : ""}{rows[0] ? <>{p.of} <a href={`/townland/${rows[0].county.toLowerCase()}/${slug}`}>{placeOf(rows[0], lang)}</a>. </> : ""}{t.common.stories(rows.length)}.</p></section>
        <div className="grid">{rows.map(s => <StoryCard key={s.id} s={s} lang={lang} />)}</div>
      </main>
    );
  }
  const rows = await tellerList(letter && /^[A-Z]$/.test(letter) ? letter : undefined);
  return (
    <main className="wrap">
      <section><div className="kicker">{p.kicker}</div><h1>{p.h1a}<em>{p.h1em}</em>{p.h1b}</h1><p className="lead">{p.lead}</p>
        <div className="chips"><a href="/people" className={!letter ? "on" : undefined}>{t.common.all}</a>{AZ.map(l => <a key={l} href={`/people?letter=${l}`} className={letter === l ? "on" : undefined}>{l}</a>)}</div></section>
      {rows.length ? (
        <table className="lb"><thead><tr><th>{t.common.teller}</th><th>{t.common.born}</th><th>{t.common.place}</th><th>{t.nav.stories}</th></tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}><td><a href={`/people?teller=${encodeURIComponent(`${r.teller_name}|${r.teller_born ?? ""}|${r.townland_slug}`)}`}><b>{r.teller_name}</b></a>{r.archive && <span className="tag y1937" style={{ marginLeft: 8 }}>1937</span>}</td><td>{r.teller_born ? decadeLabel(r.teller_born, lang) : ""}</td><td><a href={`/townland/${r.county.toLowerCase()}/${r.townland_slug}`}>{placeOf(r, lang)}</a></td><td>{r.n}</td></tr>)}</tbody></table>
      ) : <p className="notice">{p.none}</p>}
    </main>
  );
}
