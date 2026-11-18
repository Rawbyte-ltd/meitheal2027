import { pageMeta, unlessEmpty } from "@/lib/seo";
import { notFound } from "next/navigation";
import StoryCard from "@/app/StoryCard";
import { topicName, topicOther, topicPrompt } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { listStories } from "@/lib/stories";
import { topicBySlug } from "@/lib/topics";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const tp = topicBySlug((await params).slug), { lang } = await getDict();
  if (!tp) return {};
  const any = await listStories({ topic: tp.slug, limit: 1 });
  const name = topicName(tp, lang);
  return unlessEmpty(pageMeta(name, lang === "ga" ? `${name}: scéalta a bhailigh páistí óna seanóirí faoin gceannteideal seo, baile fearainn ar bhaile fearainn. ${topicPrompt(tp, lang)}` : `${name}: stories children collected from their elders under this heading, townland by townland. ${tp.prompt}`), any.length > 0);
}

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const tp = topicBySlug(slug); if (!tp) notFound();
  const [{ lang, t }, rows] = await Promise.all([getDict(), listStories({ topic: tp.slug, limit: 200 })]);
  return (
    <main className="wrap">
      <section><div className="kicker">{t.topic.kicker} · {tp.era}</div><h1>{topicName(tp, lang)} <span className="ga">· {topicOther(tp, lang)}</span></h1><p className="lead">{topicPrompt(tp, lang)}</p><a className="btn" href={`/submit?topic=${tp.slug}`}>{t.common.collectOne}</a></section>
      {rows.length ? <div className="grid">{rows.map(s => <StoryCard key={s.id} s={s} lang={lang} />)}</div> : <p className="notice">{t.topic.none}</p>}
    </main>
  );
}
