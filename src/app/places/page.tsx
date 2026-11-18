import { pageMeta } from "@/lib/seo";
import { countyName } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { countryCounts, countyCounts } from "@/lib/stories";
import { COUNTIES } from "@/lib/townlands";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { lang, t } = await getDict(); return pageMeta(t.places.title, lang === "ga" ? "Scéalta de réir contae agus baile fearainn, agus scéalta ó áiteanna i bhfad i gcéin a tháinig go hÉirinn." : "Stories by county and townland, and stories from far places that came to Ireland."); }

export default async function Places() {
  const [{ lang, t }, counts, far] = await Promise.all([getDict(), countyCounts(), countryCounts()]);
  const p = t.places;
  return (
    <main className="wrap">
      <section><div className="kicker">{p.kicker}</div><h1>{p.h1a}<em>{p.h1em}</em></h1><p className="lead">{p.leadA}<a href="/map">{p.leadLink}</a>{p.leadB}</p></section>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {COUNTIES.map(c => { const n = counts.find(x => x.county === c)?.n ?? 0; return <a key={c} href={`/county/${c.toLowerCase()}`} className="card" style={{ textDecoration: "none", color: "inherit", padding: 14 }}><b>{countyName(c, lang)}</b><div className="muted small">{t.common.stories(n)}</div></a>; })}
      </div>
      {far.length > 0 && <section>
        <h2>{p.far}</h2>
        <p className="lead">{p.farLead}</p>
        <div className="chips">{far.map(c => <a key={c.country} href={`/stories?country=${encodeURIComponent(c.country)}`}>{c.country} · {c.n}</a>)}</div>
      </section>}
    </main>
  );
}
