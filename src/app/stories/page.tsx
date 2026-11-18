import { pageMeta } from "@/lib/seo";
import StoryCard from "@/app/StoryCard";
import { COLLECTIONS } from "@/lib/collections";
import { countyName, topicName } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { countyCounts, listStories, topicCounts } from "@/lib/stories";
import { TOPICS } from "@/lib/topics";

export const dynamic = "force-dynamic";
export async function generateMetadata() { const { lang, t } = await getDict(); return pageMeta(t.stories.title, lang === "ga" ? "Na scéalta a bhailigh páistí óna seanóirí do Mheitheal 2027, agus samplaí as Bailiúchán na Scol 1937–38: cuardaigh de réir contae, ceannteidil nó bailiúcháin." : "Stories children collected from their elders for Meitheal 2027, with examples from the 1937–38 Schools' Collection: search by county, heading or collection."); }

export default async function Stories({ searchParams }: { searchParams: Promise<{ q?: string; county?: string; topic?: string; collection?: string; country?: string; page?: string }> }) {
  const sp = await searchParams; const page = Math.max(1, Number(sp.page ?? 1)); const per = 24;
  const [{ lang, t }, rows, counties, topics] = await Promise.all([getDict(), listStories({ q: sp.q, county: sp.county, topic: sp.topic, collection: sp.collection, country: sp.country, limit: per + 1, offset: (page - 1) * per }), countyCounts(), topicCounts()]);
  const more = rows.length > per; const shown = rows.slice(0, per);
  const link = (patch: Record<string, string | undefined>) => { const u = new URLSearchParams(); for (const [k, v] of Object.entries({ q: sp.q, county: sp.county, topic: sp.topic, collection: sp.collection, ...patch })) if (v) u.set(k, v); return `/stories?${u}`; };
  const customs = topics.filter(x => x.topic === "custom" && x.topic_custom);
  return (
    <main className="wrap">
      <section>
        <div className="kicker">{t.stories.kicker}</div>
        <h1>{t.stories.h1a}<em>{t.stories.h1em}</em></h1>
        <form method="get" action="/stories" className="sheet" style={{ maxWidth: 520 }}><label>{t.stories.search}<input name="q" defaultValue={sp.q ?? ""} placeholder={t.stories.placeholder} /></label></form>
        <div className="chips">{COLLECTIONS.map(c => <a key={c.slug} href={link({ collection: sp.collection === c.slug ? undefined : c.slug })} className={sp.collection === c.slug ? "on" : undefined}>{lang === "ga" ? c.ga : c.name.replace("The ", "")}</a>)}</div>
        <div className="chips">{counties.map(c => <a key={c.county} href={link({ county: sp.county === c.county ? undefined : c.county })} className={sp.county === c.county ? "on" : undefined}>{countyName(c.county, lang)} · {c.n}</a>)}</div>
        <div className="chips">{TOPICS.filter(x => topics.some(y => y.topic === x.slug)).map(x => <a key={x.slug} href={link({ topic: sp.topic === x.slug ? undefined : x.slug })} className={sp.topic === x.slug ? "on" : undefined}>{topicName(x, lang)}</a>)}{customs.map(c => <a key={c.topic_custom!} href={link({ topic: sp.topic === c.topic_custom ? undefined : c.topic_custom! })} className={sp.topic === c.topic_custom ? "on" : undefined}>{c.topic_custom}</a>)}</div>
      </section>
      {shown.length ? <div className="grid">{shown.map(s => <StoryCard key={s.id} s={s} lang={lang} />)}</div> : <p className="notice">{t.common.nothingYet} <a href="/submit">{t.common.beFirst}</a></p>}
      <div className="chips">{page > 1 && <a href={link({ page: String(page - 1) })}>{t.common.newer}</a>}{more && <a href={link({ page: String(page + 1) })}>{t.common.older}</a>}</div>
    </main>
  );
}
