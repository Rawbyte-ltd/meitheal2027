import { pageMeta, unlessEmpty } from "@/lib/seo";
import { notFound } from "next/navigation";
import StoryCard from "@/app/StoryCard";
import { collectionBySlug } from "@/lib/collections";
import { dateLong, decadeLabel, headingIn, langName, placeOf } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { audioList, excerpt, listStories, photoGrid } from "@/lib/stories";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const c = collectionBySlug((await params).slug), { lang } = await getDict();
  if (!c) return {};
  const any = await listStories({ collection: c.slug, limit: 1 });
  const name = lang === "ga" ? c.ga : c.name;
  return unlessEmpty(pageMeta(name, lang === "ga" ? `${name}: cuid de Mheitheal 2027, Bailiúchán na Scol arís.` : `${name}: part of Meitheal 2027, the Schools' Collection done again.`), any.length > 0);
}

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params; const { page: pg } = await searchParams; const c = collectionBySlug(slug); if (!c) notFound();
  const { lang, t } = await getDict(), k = t.collection;
  const page = Math.max(1, Number(pg ?? 1)), per = c.view === "grid" ? 40 : 24, off = (page - 1) * per;
  const head = (
    <section><div className="kicker">{k.kicker}</div><h1>{lang === "ga" ? c.ga : c.name}</h1><p className="ga" style={{ fontSize: "1.3rem" }}>{lang === "ga" ? c.name : c.ga}</p><p className="lead">{t.collections[c.slug]}</p>
      <a className="btn" href={`/submit?mode=${c.mode ?? "write"}`}>{c.mode === "photo" ? k.addPhoto : c.mode === "record" ? k.addRec : k.add}</a></section>
  );
  const pager = (more: boolean) => <div className="chips">{page > 1 && <a href={`/collections/${c.slug}?page=${page - 1}`}>{t.common.newer}</a>}{more && <a href={`/collections/${c.slug}?page=${page + 1}`}>{t.common.older}</a>}</div>;

  if (c.view === "grid") {
    const rows = await photoGrid(per + 1, off);
    return (
      <main className="wrap">{head}
        {rows.length ? (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
            {rows.slice(0, per).map(r => (
              <a key={r.media_id} href={`/story/${r.id}`} className="card" style={{ padding: 8, textDecoration: "none", color: "inherit" }}>
                <img src={`/api/media/${r.media_id}`} alt={r.caption ?? r.title} loading="lazy" style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: 8, border: "1px solid var(--line)" }} />
                <div style={{ padding: "8px 4px 2px" }}><b style={{ fontSize: ".95rem" }}>{r.caption || r.title}</b><div className="muted small">{headingIn(r, lang)} · {placeOf(r, lang)}{r.teller_born ? ` · ${decadeLabel(r.teller_born, lang)}` : ""}</div></div>
              </a>
            ))}
          </div>
        ) : <p className="notice">{k.noPhotos} <a href="/submit?mode=photo">{k.addFirst}</a></p>}
        {pager(rows.length > per)}
      </main>
    );
  }
  if (c.view === "listen") {
    const rows = await audioList(per + 1, off);
    return (
      <main className="wrap">{head}
        {rows.length ? rows.slice(0, per).map(r => (
          <div key={r.media_id} className="card" style={{ marginBottom: 12 }}>
            <div className="kicker">{headingIn(r, lang)} · {placeOf(r, lang)} · {langName(r.lang, lang)}</div>
            <h3><a href={`/story/${r.id}`} style={{ color: "inherit", textDecoration: "none" }}>{r.title}</a></h3>
            <p className="muted small" style={{ margin: "4px 0 10px" }}>{r.teller_name}{r.teller_born ? ` (${decadeLabel(r.teller_born, lang)})` : ""}, {k.recordedBy} {r.collector_name}, {dateLong(r.created_at, lang)} · {(r.bytes / 1048576).toFixed(1)} MB</p>
            <audio controls preload="none" src={`/api/media/${r.media_id}`} />
            <p className="muted" style={{ margin: "10px 0 0" }}>{excerpt(r.body, 200)}</p>
          </div>
        )) : <p className="notice">{k.noRecs} <a href="/submit?mode=record">{k.addFirst}</a></p>}
        {pager(rows.length > per)}
      </main>
    );
  }
  const rows = await listStories({ collection: c.slug, limit: per + 1, offset: off });
  return (
    <main className="wrap">{head}
      {rows.length ? <div className="grid">{rows.slice(0, per).map(s => <StoryCard key={s.id} s={s} lang={lang} />)}</div> : <p className="notice">{k.empty}</p>}
      {pager(rows.length > per)}
    </main>
  );
}
