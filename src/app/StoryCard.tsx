import { placeOf, toldBy, topicName, type Lang } from "@/lib/i18n";
import { excerpt, headingOf, type Story } from "@/lib/stories";
import { topicBySlug } from "@/lib/topics";

export default function StoryCard({ s, lang }: { s: Story; lang: Lang }) {
  return (
    <a href={`/story/${s.id}`} className="card" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="kicker">{headingOf(s, slug => { const t = topicBySlug(slug); return t ? topicName(t, lang) : undefined; })} · {placeOf(s, lang)}</div>
      <h3>{s.title}</h3>
      <p className="muted" style={{ margin: 0 }}>{excerpt(s.body, 180)}</p>
      <p className="small muted" style={{ margin: "10px 0 0" }}>{toldBy(s, lang)}{s.source_url ? " · 1937" : ""}{s.has_audio ? " 🎙" : ""}{s.has_photo ? " 📷" : ""}</p>
    </a>
  );
}
