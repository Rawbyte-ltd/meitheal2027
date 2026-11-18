import { notFound } from "next/navigation";
import StoryCard from "@/app/StoryCard";
import { coOf, countyName, townlandName } from "@/lib/i18n";
import { pageMeta, unlessEmpty } from "@/lib/seo";
import { getDict } from "@/lib/lang";
import { listStories, schoolList, townlandCounts } from "@/lib/stories";
import { COUNTIES } from "@/lib/townlands";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ co: string }> }) {
  const { co } = await params; const name = COUNTIES.find(c => c.toLowerCase() === decodeURIComponent(co).toLowerCase()); if (!name) return {};
  const [{ lang }, any] = await Promise.all([getDict(), listStories({ county: name, limit: 1 })]), of = coOf(name, lang);
  return unlessEmpty(lang === "ga"
    ? pageMeta(`Béaloideas agus scéalta as ${of}`, `Scéalta a bhailigh páistí óna seanóirí in ${of}, baile fearainn ar bhaile fearainn, do Mheitheal 2027: Bailiúchán na Scol 1937 arís, nócha bliain ina dhiaidh.`)
    : pageMeta(`Folklore and stories from ${of}`, `Stories children collected from their elders in ${of}, townland by townland, for Meitheal 2027: the 1937 Schools' Collection done again, ninety years on.`), any.length > 0);
}

export default async function CountyPage({ params }: { params: Promise<{ co: string }> }) {
  const { co } = await params; const name = COUNTIES.find(c => c.toLowerCase() === decodeURIComponent(co).toLowerCase()); if (!name) notFound();
  const [{ lang, t }, rows, schools, tls] = await Promise.all([getDict(), listStories({ county: name, limit: 60 }), schoolList(), townlandCounts(name)]);
  const mine = schools.filter(s => s.county === name), c = t.county, label = countyName(name, lang);
  const real = rows.filter(s => !s.source_url).length, examples = rows.length - real;
  return (
    <main className="wrap">
      <section><div className="kicker"><a href="/places">{t.nav.places}</a> · {c.kicker}</div><h1>{lang === "ga" ? <em>{label}</em> : <>Co. <em>{name}</em></>}</h1><p className="lead">{t.common.stories(real)} {c.soFar}{mine.length ? ` ${c.schools} ${mine.map(s => s.school).join(", ")}.` : ""}{examples ? ` ${c.examples(examples)}` : ""}</p></section>
      {tls.length > 0 && <section><h2>{c.townlands}</h2><div className="chips">{tls.map(x => <a key={x.townland_slug} href={`/townland/${name.toLowerCase()}/${x.townland_slug}`}>{townlandName(x.townland_en, x.townland_ga, lang)}{x.townland_ga ? ` · ${lang === "ga" ? x.townland_en : x.townland_ga}` : ""} · {x.n}</a>)}</div></section>}
      {rows.length ? <div className="grid">{rows.map(s => <StoryCard key={s.id} s={s} lang={lang} />)}</div> : <p className="notice">{c.nothing(label)} <a href="/submit">{c.start}</a></p>}
    </main>
  );
}
