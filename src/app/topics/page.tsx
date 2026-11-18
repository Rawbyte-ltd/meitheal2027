import { pageMeta } from "@/lib/seo";
import { topicName } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { topicCounts } from "@/lib/stories";
import { TOPICS } from "@/lib/topics";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const { lang, t } = await getDict(); return pageMeta(t.topics.title, lang === "ga" ? "Ceannteidil 1937 agus ceannteidil nua 2027: taibhsí agus sióga, leigheasanna, an aimsir, an ghorta, an lá a tháinig an leictreachas, agus tuilleadh." : "The 1937 headings and the new 2027 ones: ghosts and fairies, cures, weather-lore, the Famine, the day the power came, and more."); }

export default async function Topics() {
  const [{ lang, t }, counts] = await Promise.all([getDict(), topicCounts()]);
  const n = (slug: string) => counts.filter(c => c.topic === slug).reduce((a, c) => a + c.n, 0);
  const custom = counts.filter(c => c.topic === "custom" && c.topic_custom), p = t.topics;
  return (
    <main className="wrap">
      <section><div className="kicker">{p.kicker}</div><h1>{p.h1a}<em>{p.h1em}</em></h1><p className="lead">{p.lead}</p></section>
      <section>
        <h2>1937</h2>
        <div className="chips">{TOPICS.filter(x => x.era === 1937).map(x => <a key={x.slug} href={`/topic/${x.slug}`}>{topicName(x, lang)} · {n(x.slug)}</a>)}</div>
        <h2 style={{ marginTop: 18 }}>2027</h2>
        <div className="chips">{TOPICS.filter(x => x.era === 2027).map(x => <a key={x.slug} href={`/topic/${x.slug}`}>{topicName(x, lang)} · {n(x.slug)}</a>)}</div>
        <h2 style={{ marginTop: 18 }}>{p.own}</h2>
        {custom.length ? <div className="chips">{custom.map(c => <a key={c.topic_custom!} href={`/stories?topic=${encodeURIComponent(c.topic_custom!)}`}>{c.topic_custom} · {c.n}</a>)}</div> : <p className="muted">{p.noneOwnA}<a href="/submit">{p.noneOwnLink}</a>{p.noneOwnB}</p>}
      </section>
    </main>
  );
}
