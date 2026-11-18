import { notFound } from "next/navigation";
import { one } from "@/lib/db";
import { dateLong, decadeLabel, headingIn, langAttr, placeOf } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { listMedia } from "@/lib/media";
import { scanOn } from "@/lib/scan";
import { paragraphs, PUBLIC_COLS, type Story } from "@/lib/stories";
import { sha256 } from "@/lib/token";
import { machineText, WRITTEN_COLS, type Written } from "@/lib/transcript";
import Media from "@/app/Media";
import KeepControls from "./KeepControls";
import Transcript from "./Transcript";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: (await getDict()).t.keep.title, robots: { index: false } }; }

const CLS: Record<string, string> = { pending: "ok", approved: "ok", kept: "ok", rejected: "notice", removed: "bad" };

export default async function Keep({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> }) {
  const { id } = await params; const { k } = await searchParams;
  const [s, { lang, t }] = await Promise.all([one<Story & Written & { secret_hash: string; contact_email: string | null; review_note: string | null }>(`SELECT ${PUBLIC_COLS}, ${WRITTEN_COLS}, secret_hash, contact_email, review_note FROM stories WHERE id = $1`, [id]), getDict()]);
  if (!s || !k || sha256(k) !== s.secret_hash) notFound();
  const media = s.status === "removed" ? [] : await listMedia(s.id), kp = t.keep;
  // Written out: offered on a story with a recording while it can still change.
  const writable = s.has_audio && ["pending", "approved", "kept"].includes(s.status);
  const machine = writable && s.transcript === null ? await machineText(s.id) : "";
  const making = scanOn && media.some(m => m.kind === "audio" && m.scan === null);
  const from = s.transcript !== null ? "saved" : machine ? "machine" : s.lang === "ga" ? "irish" : making ? "waiting" : "none";
  return (
    <main className="wrap">
      <section>
        <div className="kicker">{kp.kicker} · {kp.statusName[s.status] ?? s.status}</div>
        <h1>{s.title}</h1>
        <p className={CLS[s.status] ?? "notice"}>{kp.status[s.status] ?? s.status}</p>
        {s.status === "rejected" && s.review_note && <p className="notice"><b>{kp.readerNote}</b> {s.review_note}</p>}
        <KeepControls id={s.id} k={k} status={s.status} lang={lang} />
      </section>
      <div className="copybook page">
        <p className="muted small">{headingIn(s, lang)} · {placeOf(s, lang)} · {kp.told} {s.teller_name}{s.teller_born ? ` (${decadeLabel(s.teller_born, lang)})` : ""} · {kp.collected} {s.collector_name}{s.school ? `, ${s.school}` : ""}</p>
        <Media items={media} k={k} />
        <article className="story" lang={langAttr(s.lang)}>{paragraphs(s.body).map((p, i) => <p key={i}>{p}</p>)}</article>
        {writable && <Transcript id={s.id} k={k} lang={lang} initial={s.transcript ?? machine} from={from}
          changed={s.status === "approved" && s.transcript !== s.transcript_public} />}
        <p className="muted small" style={{ marginTop: 24 }}>{kp.footer(dateLong(s.created_at, lang, true))}</p>
      </div>
    </main>
  );
}
