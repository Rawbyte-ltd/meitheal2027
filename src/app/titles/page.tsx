import { pageMeta } from "@/lib/seo";
import { placeOf } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { listStories } from "@/lib/stories";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { lang, t } = await getDict(); return pageMeta(t.titles.title, lang === "ga" ? "Gach scéal i Meitheal 2027 de réir teidil, A go Z." : "Every story in Meitheal 2027 by title, A to Z."); }
const AZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default async function Index({ searchParams }: { searchParams: Promise<{ letter?: string }> }) {
  const { letter = "A" } = await searchParams; const l = /^[A-Z]$/.test(letter) ? letter : "A";
  const [{ lang, t }, rows] = await Promise.all([getDict(), listStories({ letter: l, limit: 500 })]);
  return (
    <main className="wrap">
      <section><div className="kicker">{t.titles.kicker}</div><h1>{t.titles.h1a}<em>{t.titles.h1em}</em></h1>
        <div className="chips">{AZ.map(x => <a key={x} href={`/titles?letter=${x}`} className={l === x ? "on" : undefined}>{x}</a>)}</div></section>
      {rows.length ? <table className="lb"><tbody>{rows.map(s => <tr key={s.id}><td><a href={`/story/${s.id}`}>{s.title}</a>{s.source_url && <span className="tag y1937" style={{ marginLeft: 8 }}>1937</span>}</td><td className="muted">{placeOf(s, lang)}</td><td className="muted">{s.teller_name}</td></tr>)}</tbody></table> : <p className="notice">{t.titles.none(l)}</p>}
    </main>
  );
}
