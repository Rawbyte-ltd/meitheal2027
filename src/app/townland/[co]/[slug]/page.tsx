import { notFound } from "next/navigation";
import StoryCard from "@/app/StoryCard";
import { coOf, townlandName } from "@/lib/i18n";
import { pageMeta, unlessEmpty } from "@/lib/seo";
import { getDict } from "@/lib/lang";
import { listStories } from "@/lib/stories";
import { townlands } from "@/lib/townlands";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ co: string; slug: string }> }) {
  const { co, slug } = await params; const tl = townlands().find(co, slug); if (!tl) return {};
  const [{ lang }, any] = await Promise.all([getDict(), listStories({ county: tl.co, townland: tl.slug, limit: 1 })]), name = townlandName(tl.en, tl.ga, lang), of = coOf(tl.co, lang);
  return unlessEmpty(lang === "ga"
    ? pageMeta(`${name}, ${of}: scéalta agus béaloideas`, `Scéalta ó ${name}${tl.ga && tl.en !== name ? ` (${tl.en})` : ""}, ${of}, a bailíodh do Mheitheal 2027, agus nasc leis an méid a scríobh páistí na háite i 1937.`)
    : pageMeta(`${name}, ${of}: stories and folklore`, `Stories from ${name}${tl.ga ? ` (${tl.ga})` : ""}, ${of}, collected for Meitheal 2027, with a link to what the local children wrote down in 1937.`), any.length > 0);
}

export default async function TownlandPage({ params }: { params: Promise<{ co: string; slug: string }> }) {
  const { co, slug } = await params; const tl = townlands().find(co, slug); if (!tl) notFound();
  const [{ lang, t }, rows] = await Promise.all([getDict(), listStories({ county: tl.co, townland: tl.slug, limit: 200 })]);
  const duchas = `https://www.duchas.ie/${lang === "ga" ? "ga" : "en"}/cbes/tras-scribhinni?SearchText=${encodeURIComponent(tl.en)}`;
  const main = lang === "ga" && tl.ga ? tl.ga : tl.en, other = lang === "ga" && tl.ga ? tl.en : tl.ga;
  return (
    <main className="wrap">
      <section>
        <div className="kicker">{tl.kind === "townland" ? t.townland.kicker : t.place[tl.kind]} · {tl.ed ? `${tl.ed} · ` : ""}{coOf(tl.co, lang)}</div>
        <h1>{main}</h1>{other && <p className="ga" style={{ fontSize: "1.4rem", margin: "4px 0 0" }}>{other}</p>}
        <div className="chips"><a href={`/submit`}>{t.townland.add}</a><a href={duchas} target="_blank" rel="noopener">{t.townland.duchas}</a><a href={`/map?lat=${tl.lat}&lng=${tl.lng}&z=12`}>{t.townland.onMap}</a></div>
      </section>
      {rows.length ? <div className="grid">{rows.map(s => <StoryCard key={s.id} s={s} lang={lang} />)}</div> : <p className="notice">{t.townland.nothing(main)}</p>}
    </main>
  );
}
