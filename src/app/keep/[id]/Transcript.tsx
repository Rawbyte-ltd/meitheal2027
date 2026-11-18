"use client";
import { useState } from "react";
import { dict, type Lang } from "@/lib/i18n";

/** The family writes out their recording, starting from the machine's version when there is one (src/lib/transcript.ts). */
export default function Transcript({ id, k, lang, initial, from, changed }: {
  id: string; k: string; lang: Lang; initial: string;
  /** Where the text in the box came from: their own saved text, the machine, or nothing yet (Irish, or still being made). */
  from: "saved" | "machine" | "irish" | "waiting" | "none";
  /** Published, and their last change has not been read yet. */
  changed: boolean;
}) {
  const t = dict(lang).keep;
  const [text, setText] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const save = async () => {
    setState("saving"); setError("");
    try {
      const r = await fetch(`/api/keep/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ k, text }) });
      if (r.ok) { setState("saved"); return; }
      setError(((await r.json().catch(() => null)) as { error?: string } | null)?.error ?? t.trError); setState("error");
    } catch { setError(t.trError); setState("error"); }
  };
  const intro = from === "machine" ? t.trMachine : from === "irish" ? t.trIrish : from === "waiting" ? t.trWait : t.trOwn;
  return (
    <section className="written" aria-labelledby="written-h">
      <h2 id="written-h">{t.trTitle}</h2>
      {from !== "saved" && <p className="muted">{intro}</p>}
      {changed && state !== "saved" && <p className="notice">{t.trChanged}</p>}
      <form className="sheet" onSubmit={e => { e.preventDefault(); save(); }}>
        <textarea id="written-text" aria-labelledby="written-h" value={text} maxLength={20000} lang={lang === "ga" ? "ga" : "en-IE"}
          onChange={e => { setText(e.target.value); if (state !== "saving") setState("idle"); }} />
        <div className="chips" style={{ marginTop: 10 }}>
          <button className="btn" type="submit" disabled={state === "saving"}>{state === "saving" ? t.trSaving : t.trSave}</button>
        </div>
        {state === "saved" && <p className="ok" role="status">{t.trSaved}</p>}
        {state === "error" && <p className="bad" role="alert">{error}</p>}
      </form>
      {/* The keepsake print shows the text, not the box. */}
      <div className="story print-only">{text.split(/\n\s*\n/).filter(p => p.trim()).map((p, i) => <p key={i}>{p.trim()}</p>)}</div>
    </section>
  );
}
