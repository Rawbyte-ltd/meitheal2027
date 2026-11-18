import Photo from "./Photo";
import StoryCard from "./StoryCard";
import { COLLECTIONS } from "@/lib/collections";
import { getDict } from "@/lib/lang";
import { collectionCounts, listStories, stats } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [{ lang, t }, s, latest, cols] = await Promise.all([getDict(), stats(), listStories({ limit: 6 }), collectionCounts()]);
  const h = t.home, n = (slug: string) => cols.find(c => c.collection === slug)?.n ?? 0, num = (x: number) => x.toLocaleString("en-IE");
  return (
    <main>
      <section className="wrap hero">
        <div className="hero-text">
          <div className="kicker">{h.kicker}</div>
          <h1>{h.h1a}<em>{h.h1em}</em>{h.h1b}</h1>
          <p className="lead">{h.lead}</p>
          <div className="chips cta"><a className="btn" href="/submit">{h.add}</a><a className="btn ghost" href="/submit?mode=record">{h.record}</a></div>
          <form method="get" action="/stories" className="sheet" style={{ marginTop: 18, maxWidth: 560 }}><label><input name="q" placeholder={h.search} aria-label={t.stories.search} /></label></form>
          <div className="chips">
            <a href="/places">{t.nav.places}</a><a href="/people">{t.nav.people}</a><a href="/topics">{t.nav.topics}</a><a href="/titles">{h.index}</a><a href="/map">{t.nav.map}</a>
          </div>
        </div>
        <div className="hero-photos">
          <Photo k="school" lang={lang} tilt={-2.5} eager sizes="(max-width: 860px) 92vw, 520px" />
          <Photo k="doorway" lang={lang} tilt={3} className="second" sizes="(max-width: 860px) 45vw, 240px" />
        </div>
      </section>

      <section className="wrap">
        <div className="grid" style={{ gridTemplateColumns: "1fr" , gap: 10 }}>
          {COLLECTIONS.map(c => (
            <a key={c.slug} href={`/collections/${c.slug}`} className="card row" style={{ textDecoration: "none", color: "inherit", padding: "16px 20px" }}>
              <span><b style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem" }}>{lang === "ga" ? c.ga : c.name}</b> <span className="ga">· {lang === "ga" ? c.name : c.ga}</span><br /><span className="muted small">{t.collections[c.slug]}</span></span>
              <span className="stat" style={{ fontSize: "1.6rem" }}>{n(c.slug)}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="band">
        <div className="wrap band-in">
          <div>
            <div className="years"><span>1937</span><span>2027</span></div>
            <h2>{h.bandH2a}<em>{h.bandH2em}</em></h2>
            <p>{h.band}</p>
            <a className="btn" href="/collect">{h.howTo}</a>
          </div>
          <Photo k="truant" lang={lang} tilt={2} sizes="(max-width: 860px) 92vw, 420px" />
        </div>
      </section>

      <section className="wrap">
        {s.stories === 0 && s.examples > 0 ? <p className="notice">{h.firstYet(s.examples)}</p> : <div className="grid stats">
          <div className="card"><div className="stat">{num(s.stories)}<small>{h.stats.stories}</small></div></div>
          <div className="card"><div className="stat">{num(s.townlands)}<small>{h.stats.townlands}</small></div></div>
          <div className="card"><div className="stat">{num(s.audio)}<small>{h.stats.audio}</small></div></div>
          <div className="card"><div className="stat">{num(s.photos)}<small>{h.stats.photos}</small></div></div>
          <div className="card"><div className="stat">{num(s.schools)}<small>{h.stats.schools}</small></div></div>
          <div className="card"><div className="stat">{num(s.words)}<small>{h.stats.words}</small></div></div>
        </div>}
        <div className="chips"><a className="btn" href="/submit">{h.add}</a><a className="btn ghost" href="/submit?mode=record">{h.addRec}</a><a className="btn ghost" href="/submit?mode=photo">{h.addPhoto}</a></div>
      </section>

      <section className="wrap">
        <h2>{h.worldA}<em>{h.worldEm}</em></h2>
        <p className="lead">{h.world}</p>
        <div className="strip">
          <Photo k="footing" lang={lang} tilt={-1.5} tape={false} sizes="(max-width: 760px) 80vw, 340px" />
          <Photo k="fair" lang={lang} tilt={1.2} tape={false} sizes="(max-width: 760px) 80vw, 340px" />
          <Photo k="turf" lang={lang} tilt={-.8} tape={false} sizes="(max-width: 760px) 80vw, 340px" />
        </div>
      </section>

      {latest.length > 0 && (
        <section className="wrap">
          <h2>{latest.every(st => st.source_url) ? h.examplesH : h.latest}</h2>
          <div className="grid">{latest.map(st => <StoryCard key={st.id} s={st} lang={lang} />)}</div>
          <a className="btn ghost" href="/stories">{h.all}</a>
        </section>
      )}

      <section className="wrap">
        <h2>{h.how}</h2>
        <div className="grid steps">{h.steps.map(([a, b]) => <div key={a} className="card"><h3>{a}</h3><p className="muted">{b}</p></div>)}</div>
      </section>
    </main>
  );
}
