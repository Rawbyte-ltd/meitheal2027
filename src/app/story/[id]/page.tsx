import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { collectionBySlug } from "@/lib/collections";
import { ageLabel, coOf, countyName, dateLong, decadeLabel, farOf, headingIn, langAttr, langOf, placeOf, townlandName } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { listMedia } from "@/lib/media";
import { excerpt, getStory, listStories, paragraphs } from "@/lib/stories";
import { topicBySlug } from "@/lib/topics";
import Media from "@/app/Media";
import StoryCard from "@/app/StoryCard";
import { describe, ldJson, SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";
type P = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const { id } = await params; const [s, { lang, t }] = await Promise.all([getStory(id), getDict()]);
  if (!s || s.status !== "approved") return { title: t.story.title };
  return { title: `${s.title} (${placeOf(s, lang)})`, description: excerpt(s.body, 160), openGraph: { title: s.title, description: `${t.story.og(s.teller_name, s.collector_name)} ${placeOf(s, lang)}.` } };
}

export default async function StoryPage({ params, searchParams }: { params: P; searchParams: Promise<{ flagged?: string }> }) {
  const { id } = await params; const { flagged } = await searchParams; const [s, { lang, t }] = await Promise.all([getStory(id), getDict()]);
  if (!s || s.status !== "approved") notFound();
  const topic = topicBySlug(s.topic), heading = headingIn(s, lang), col = collectionBySlug(s.collection), st = t.story;
  const [media, nearby] = await Promise.all([listMedia(s.id), listStories({ townland: s.townland_slug, county: s.county, limit: 4 })]);
  const duchas = `https://www.duchas.ie/${lang === "ga" ? "ga" : "en"}/cbes/tras-scribhinni?SearchText=${encodeURIComponent(s.townland_en)}`;
  const tl = townlandName(s.townland_en, s.townland_ga, lang), tlOther = lang === "ga" ? (s.townland_ga ? s.townland_en : null) : s.townland_ga;
  const born = s.teller_born ? (lang === "ga" ? `, a rugadh sna ${decadeLabel(s.teller_born, lang)}` : `, born in the ${s.teller_born}`) : "";
  const others = nearby.filter(x => x.id !== s.id), far = farOf(s);
  return (
    <main className="wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson({
        "@context": "https://schema.org", "@type": "CreativeWork", "@id": `${SITE}/story/${s.id}`, url: `${SITE}/story/${s.id}`,
        name: s.title, headline: s.title, description: describe(s.body), genre: "Folklore", about: heading,
        inLanguage: s.lang === "ga" ? "ga" : s.lang === "other" ? undefined : "en-IE",
        author: s.collector_name !== "Name not given" ? { "@type": "Person", name: s.collector_name } : undefined,
        contentLocation: { "@type": "Place", name: `${s.townland_en}, Co. ${s.county}`, geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng } },
        dateCreated: s.source_url ? "1937/1939" : s.created_at, isPartOf: { "@id": `${SITE}/#site` },
        ...(s.source_url ? { isBasedOn: s.source_url, license: "https://creativecommons.org/licenses/by-nc/4.0/", creditText: `${s.source_ref}. ${s.source_credit ?? ""} National Folklore Collection, UCD.` } : {}),
      })} />
      <section className="story-head">
        <div className="kicker">{s.source_url ? (lang === "ga" ? "Bailiúchán na Scol 1937–38" : "The Schools' Collection 1937–38") : col ? (lang === "ga" ? col.ga : col.name) : ""} · {heading} <span className={`tag y${s.source_url ? 1937 : topic?.era ?? 2027}`} style={{ marginLeft: 8 }}>{s.source_url ? 1937 : topic?.era ?? 2027}</span></div>
        <h1>{s.title}</h1>
        <div className="meta">
          <span>{st.toldBy} <b>{s.teller_name}</b>{born}{s.teller_relation ? st.ofCollector(s.teller_relation) : ""}</span>
          <span>{st.collectedBy} <b>{s.collector_name}</b>{s.collector_age ? ` (${ageLabel(s.collector_age, lang)})` : ""}{s.school ? `, ${s.school}` : ""}</span>
          {far && <span>{st.from} <b><a href={`/stories?country=${encodeURIComponent(s.from_country ?? "")}`}>{far}</a></b></span>}
          <span><a href={`/townland/${s.county.toLowerCase()}/${s.townland_slug}`}>{tl}{tlOther ? ` · ${tlOther}` : ""}</a>, <a href={`/county/${s.county.toLowerCase()}`}>{lang === "ga" ? countyName(s.county, lang) : coOf(s.county, lang)}</a></span>
          <span>{s.source_url ? (lang === "ga" ? "Scríofa síos i 1937–38" : "Written down in 1937–38") : dateLong(s.created_at, lang)}{s.lang === "other" ? ` · ${st.inLang(langOf(s, lang))}` : ""}</span>
        </div>
        {flagged && <p className="ok">{st.flagged}</p>}
      </section>
      <div className="copybook">
        <Media items={media} />
        <article className="story" lang={langAttr(s.lang)}>{paragraphs(s.body).map((p, i) => <p key={i}>{p}</p>)}</article>
        {s.body_en && <section className="written">
          <h2>{st.inEnglish}</h2>
          <p className="muted small">{st.machineNote}</p>
          <article className="story" lang="en-IE">{paragraphs(s.body_en).map((p, i) => <p key={i}>{p}</p>)}</article>
        </section>}
        {s.transcript_public && <section className="written">
          <h2>{st.writtenOut}</h2>
          <p className="muted small">{st.writtenNote}</p>
          <article className="story" lang={langAttr(s.lang)}>{paragraphs(s.transcript_public).map((p, i) => <p key={i}>{p}</p>)}</article>
        </section>}
      </div>
      {s.source_url && <section className="notice">
        {lang === "ga"
          ? <p style={{ margin: 0 }}>Ó <b>Bhailiúchán na Scol 1937–38</b>, mar shampla den chineál scéil a bhaileoidh Meitheal 2027. {s.source_ref}. Féach an lámhscríbhinn bhunaidh ar <a href={s.source_url} rel="noopener" target="_blank">dúchas.ie</a>. {s.source_credit} Cnuasach Bhéaloideas Éireann, An Coláiste Ollscoile, Baile Átha Cliath, faoi cheadúnas <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license noopener" target="_blank">CC BY-NC 4.0</a>. Litriú an bhunleagain coinnithe.</p>
          : <p style={{ margin: 0 }}>From the <b>1937–38 Schools&apos; Collection</b>, shown as an example of the kind of story Meitheal 2027 gathers. {s.source_ref}. See the original manuscript on <a href={s.source_url} rel="noopener" target="_blank">dúchas.ie</a>. {s.source_credit} National Folklore Collection, University College Dublin, licensed <a href="https://creativecommons.org/licenses/by-nc/4.0/" rel="license noopener" target="_blank">CC BY-NC 4.0</a>. Original spelling kept.</p>}
      </section>}
      <section>
        <div className="chips">
          <a href={s.topic === "custom" ? `/stories?topic=${encodeURIComponent(s.topic_custom ?? "")}` : `/topic/${s.topic}`}>{st.more(heading)}</a>
          <a href={`/people?teller=${encodeURIComponent(`${s.teller_name}|${s.teller_born ?? ""}|${s.townland_slug}`)}`}>{st.moreFrom(s.teller_name)}</a>
          <a href={duchas} rel="noopener" target="_blank">{st.duchas}</a>
        </div>
        <details><summary className="muted small">{st.wrong}</summary>
          <form method="post" action="/api/flag" className="sheet" style={{ marginTop: 10, maxWidth: 520 }}><input type="hidden" name="id" value={s.id} /><label>{st.tell}<input name="reason" required maxLength={500} placeholder={st.tellPh} /></label><button className="btn ghost" type="submit">{st.send}</button></form>
        </details>
      </section>
      {others.length > 0 && <section><h2>{st.moreHere(tl)}</h2><div className="grid">{others.map(x => <StoryCard key={x.id} s={x} lang={lang} />)}</div></section>}
    </main>
  );
}
