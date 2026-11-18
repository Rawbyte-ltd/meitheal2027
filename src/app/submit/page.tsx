import { pageMeta } from "@/lib/seo";
import SubmitForm from "./SubmitForm";
import { topicName } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { TOPICS } from "@/lib/topics";

export async function generateMetadata() { const { lang, t } = await getDict(); return pageMeta(t.submit.title, lang === "ga" ? "Cuir scéal le Meitheal 2027: scríobh é, taifead é nó cuir grianghraf leis. Saor in aisce, le toiliú tuismitheora." : "Add a story to Meitheal 2027: write it, record it or add a photo. Free, with a parent's consent."); }

export default async function Submit({ searchParams }: { searchParams: Promise<{ topic?: string; mode?: string }> }) {
  const [{ topic, mode }, { lang, t }] = await Promise.all([searchParams, getDict()]);
  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <section>
        <div className="kicker">{t.submit.kicker}</div>
        <h1>{t.submit.h1a}<em>{t.submit.h1em}</em></h1>
        <p className="lead">{t.submit.lead}</p>
      </section>
      <SubmitForm lang={lang} topics={TOPICS.map(x => ({ slug: x.slug, name: topicName(x, lang), era: x.era }))} initialTopic={topic} initialMode={mode} />
    </main>
  );
}
