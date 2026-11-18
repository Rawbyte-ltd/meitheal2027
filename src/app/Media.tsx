import type { Media as M } from "@/lib/media";

/** What the check (src/lib/scan.ts) said about one item, for the reading desk. Also used for the written story. */
export function Verdict({ m }: { m: { kind: "audio" | "photo" | "text"; scan: string | null; scan_note: string | null } }) {
  const [state, why = ""] = (m.scan ?? "").split(":"), what = m.kind === "photo" ? "photo" : m.kind === "text" ? "story" : "recording";
  const text = state === "unsafe" ? `Flagged ${what} (${why.replace("_", " ")})${m.kind === "photo" ? ". Open to look." : ""}`
    : state === "mild" ? `Mild: ${why.replace("_", " ")}`
    : state === "safe" ? "Check: nothing found"
    : state === "skipped" ? (why === "irish" ? "Not checked: the transcriber has no Irish. Listen to it." : `Not checked (${why.replace(/_/g, " ")}). ${m.kind === "text" ? "Read it." : "Listen to it."}`)
    : state === "error" ? `Check failed (${why.replace(/_/g, " ")}): look at it yourself`
    : m.kind === "text" ? "Story not checked (no key, or still running)" : "Not checked";
  return <div className="small" style={{ marginBottom: 6, color: state === "unsafe" ? "var(--margin-ink)" : state === "mild" ? "var(--gold-ink)" : undefined }}>
    {text}{m.scan_note && <> · <q>{m.scan_note}</q></>}
  </div>;
}

/** Audio players and photographs for a story. `k` or `admin` unlock media on unpublished stories. For the admin, each item carries
 *  the check's verdict, recordings their transcript, and a flagged photo stays blurred until opened. */
export default function Media({ items, k, admin, review }: { items: M[]; k?: string; admin?: string; review?: boolean }) {
  // `admin` is the key (sent with each file while the key is in use); `review` shows the checks to someone signed in at the desk.
  const qs = admin ? `?admin=${encodeURIComponent(admin)}` : k ? `?k=${encodeURIComponent(k)}` : "";
  const desk = !!admin || !!review;
  const audio = items.filter(m => m.kind === "audio"), photos = items.filter(m => m.kind === "photo");
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      {audio.map(m => <div key={m.id} style={{ margin: "0 0 12px" }}>
        {desk && <Verdict m={m} />}
        <audio controls preload="none" src={`/api/media/${m.id}${qs}`} />
        {desk && m.transcript && <details className="small"><summary>Transcript (machine-made)</summary><p className="muted" style={{ whiteSpace: "pre-wrap" }}>{m.transcript}</p></details>}
        {desk && m.transcript_en && <details className="small" open><summary>Transcript in English (machine-made from the one above)</summary><p className="muted" style={{ whiteSpace: "pre-wrap" }}>{m.transcript_en}</p></details>}
      </div>)}
      {photos.length > 0 && (
        <div className="grid" style={{ gridTemplateColumns: photos.length === 1 ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", margin: "6px 0 10px" }}>
          {photos.map(m => {
            const flagged = desk && !!m.scan?.startsWith("unsafe"), src = `/api/media/${m.id}${qs}`;
            const img = <img src={src} alt={m.caption ?? ""} style={{ width: "100%", borderRadius: 10, border: "1px solid var(--line)", filter: flagged ? "blur(28px)" : undefined }} loading="lazy" />;
            return <figure key={m.id} style={{ margin: 0, overflow: "hidden" }}>
              {desk && <Verdict m={m} />}
              {flagged ? <a href={src} target="_blank" rel="noreferrer">{img}</a> : img}
              {m.caption && <figcaption className="muted small" style={{ marginTop: 6 }}>{m.caption}</figcaption>}
            </figure>;
          })}
        </div>
      )}
    </div>
  );
}
