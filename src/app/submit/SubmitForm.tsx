"use client";
import { useEffect, useRef, useState } from "react";
import { MAX_AUDIO } from "@/lib/limits";
import { ageLabel, CONSENT_VERSION, decadeLabel, dict, langName, relationLabel, type Lang } from "@/lib/i18n";

type T = { en: string; ga: string; co: string; slug: string; ed: string; kind?: string };
type Mode = "write" | "record" | "photo";
const AGE = ["under 8", "8 to 9", "10 to 12", "13 to 15", "16 to 18", "adult"];
const DEC = ["1920s", "1930s", "1940s", "1950s", "1960s", "1970s", "1980s", "later"];
const REL = ["grandmother", "grandfather", "great-grandparent", "mother", "father", "aunt or uncle", "neighbour", "family friend", "other"];
const MODES: Mode[] = ["write", "record", "photo"];

/** Downscale a photo in the browser to at most 1800px and JPEG, so a 12 MB phone photo becomes ~400 KB before upload. */
async function shrink(file: File): Promise<File> {
  if (!/^image\//.test(file.type)) return file;
  const bmp = await createImageBitmap(file).catch(() => null); if (!bmp) return file;
  const scale = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, "image/jpeg", 0.85)); if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export default function SubmitForm({ topics, initialTopic, initialMode, lang }: { topics: { slug: string; name: string; era: number }[]; initialTopic?: string; initialMode?: string; lang: Lang }) {
  const f = dict(lang).form;
  const [mode, setMode] = useState<Mode>(MODES.includes(initialMode as Mode) ? (initialMode as Mode) : "write");
  const [topic, setTopic] = useState(initialTopic && topics.some(t => t.slug === initialTopic) ? initialTopic : topics[0].slug);
  const [lng, setLng] = useState<string>(lang);
  const [q, setQ] = useState(""); const [hits, setHits] = useState<T[]>([]); const [picked, setPicked] = useState<T | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null); const [audioName, setAudioName] = useState("");
  const [photos, setPhotos] = useState<{ file: File; url: string; caption: string }[]>([]);
  const [recording, setRecording] = useState(false); const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null); const chunks = useRef<Blob[]>([]); const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (picked || q.trim().length < 2) { setHits([]); return; }
    debounce.current = setTimeout(async () => { try { setHits(await (await fetch(`/api/townlands?q=${encodeURIComponent(q)}`)).json()); } catch { setHits([]); } }, 120);
  }, [q, picked]);

  const start = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(m => MediaRecorder.isTypeSupported(m)) ?? "";
      const r = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
      chunks.current = [];
      r.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      r.onstop = () => { stream.getTracks().forEach(t => t.stop()); const b = new Blob(chunks.current, { type: r.mimeType || "audio/webm" }); setAudio(b); setAudioName(`recording.${/mp4/.test(r.mimeType) ? "m4a" : /ogg/.test(r.mimeType) ? "ogg" : "webm"}`); };
      r.start(1000); rec.current = r; setRecording(true); setSecs(0);
      timer.current = setInterval(() => setSecs(s => { if (s + 1 >= 600) stop(); return s + 1; }), 1000);
    } catch { setErr(f.errMic); }
  };
  const stop = () => { rec.current?.stop(); setRecording(false); if (timer.current) clearInterval(timer.current); };
  const addPhotos = async (files: FileList | null) => {
    if (!files) return; const next = [...photos];
    for (const f of Array.from(files).slice(0, 4 - photos.length)) { const small = await shrink(f); next.push({ file: small, url: URL.createObjectURL(small), caption: "" }); }
    setPhotos(next);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr(null);
    if (!picked) { setErr(f.errTownland); return; }
    if (mode === "record" && !audio) { setErr(f.errAudio); return; }
    if (mode === "photo" && !photos.length) { setErr(f.errPhoto); return; }
    const fd = new FormData(e.currentTarget);
    fd.set("mode", mode); fd.set("topic", topic); fd.set("ui_lang", lang); fd.set("consent_version", CONSENT_VERSION); fd.set("county", picked.co); fd.set("townland", picked.slug);
    if (audio) { if (audio.size > MAX_AUDIO) { setErr(f.errBig); return; } fd.set("audio", audio, audioName || "recording.webm"); }
    fd.delete("photo"); fd.delete("photo_caption");
    for (const p of photos) { fd.append("photo", p.file, p.file.name); fd.append("photo_caption", p.caption); }
    setBusy(true);
    try {
      const r = await fetch("/api/stories", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? f.errGeneric);
      window.location.href = `/keep/${j.id}?k=${j.keeper}`;
    } catch (ex) { setErr(ex instanceof Error ? ex.message : String(ex)); setBusy(false); }
  };

  const mm = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  const recorder = (
    <div className="card" style={{ background: "var(--paper-2)" }}>
      <b id="rec-h">{mode === "record" ? f.recTitle : f.recTitleAlt}</b> <span className="muted small" id="rec-help">{f.recHelp}</span>
      <div className="rec" style={{ marginTop: 10 }}>
        {!recording && <button type="button" className="btn red" onClick={start} style={{ padding: "10px 14px" }}>{f.record}</button>}
        {recording && <><span className="dot" /> <b>{mm}</b> <button type="button" className="btn" onClick={stop} style={{ padding: "10px 14px" }}>{f.stop}</button></>}
        <input type="file" accept="audio/*" aria-labelledby="rec-h" aria-describedby="rec-help" onChange={e => { const f = e.target.files?.[0] ?? null; setAudio(f); setAudioName(f?.name ?? ""); }} />
      </div>
      {audio && !recording && <p className="small muted" style={{ margin: "8px 0 0" }}>{f.attached} {audioName} ({Math.round(audio.size / 1024)} KB). <audio controls src={URL.createObjectURL(audio)} /></p>}
    </div>
  );
  const photographs = (
    <div className="card" style={{ background: "var(--paper-2)" }}>
      <b id="photo-h">{mode === "photo" ? f.photoTitle : f.photoTitleAlt}</b> <span className="muted small" id="photo-help">{f.photoHelp}</span>
      <div style={{ marginTop: 10 }}><input type="file" accept="image/*" multiple aria-labelledby="photo-h" aria-describedby="photo-help" onChange={e => addPhotos(e.target.files)} disabled={photos.length >= 4} /></div>
      {photos.length > 0 && <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>{photos.map((p, i) => <div key={p.url}><img src={p.url} alt="" style={{ width: "100%", borderRadius: 10, border: "1px solid var(--line)" }} /><input value={p.caption} onChange={e => setPhotos(ps => ps.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))} placeholder={mode === "photo" ? f.captionPhoto : f.caption} maxLength={200} style={{ marginTop: 6 }} /><button type="button" className="btn ghost" style={{ padding: "6px 10px", marginTop: 6 }} onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))}>{f.removePhoto}</button></div>)}</div>}
    </div>
  );
  const text = (
    <label>{mode === "write" ? f.bodyWrite : mode === "record" ? f.bodyRecord : f.bodyPhoto} <small>{f.bodyHelp}{mode === "write" ? f.bodyHelpLong : ""}</small>
      <textarea name="body" required minLength={mode === "write" ? 80 : 20} maxLength={20000} placeholder={mode === "photo" ? f.bodyPhPhoto : f.bodyPh} style={mode !== "write" ? { minHeight: 140 } : undefined} />
    </label>
  );

  return (
    <form className="sheet copybook" onSubmit={submit}>
      {err && <p className="bad">{err}</p>}
      <div>
        <b>{f.bringing}</b>
        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", margin: "10px 0 0" }}>
          {MODES.map(m => <button key={m} type="button" onClick={() => setMode(m)} className="card" style={{ textAlign: "left", cursor: "pointer", font: "inherit", borderColor: mode === m ? "var(--green)" : undefined, background: mode === m ? "#eaf4ee" : undefined, padding: 14 }}><b>{f.modes[m][0]}</b><div className="muted small">{f.modes[m][1]}</div></button>)}
        </div>
      </div>
      {mode === "record" && recorder}
      {mode === "photo" && photographs}
      <label>{f.heading}
        <select value={topic} onChange={e => setTopic(e.target.value)}>
          {topics.map(t => <option key={t.slug} value={t.slug}>{t.name} ({t.era})</option>)}
          <option value="custom">{f.ownOption}</option>
        </select>
      </label>
      {topic === "custom" && <label>{f.yourHeading} <small>{f.yourHeadingHelp}</small><input name="topic_custom" required maxLength={60} placeholder={f.yourHeading} /></label>}
      <label>{f.title} <small>{f.titleHelp}</small>
        <input name="title" required maxLength={120} placeholder={f.titlePh} />
      </label>
      <label>{f.townland} <small>{f.townlandHelp}</small>
        <div className="suggest">
          {picked ? (
            <div className="row" style={{ justifyContent: "flex-start" }}><b>{picked.en}</b> <span className="muted">{picked.kind && picked.kind !== "townland" ? `${dict(lang).place[picked.kind]} · ` : ""}Co. {picked.co}{picked.ga ? ` · ${picked.ga}` : ""}</span> <button type="button" className="btn ghost" style={{ padding: "6px 10px" }} onClick={() => { setPicked(null); setQ(""); }}>{f.change}</button></div>
          ) : (
            <>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={f.townlandPh} autoComplete="off" />
              {hits.length > 0 && <ul>{hits.map(h => <li key={`${h.co}/${h.slug}`} onClick={() => { setPicked(h); setHits([]); }}><b>{h.en}</b> <span className="muted">{h.kind && h.kind !== "townland" ? `${dict(lang).place[h.kind]} · ` : ""}Co. {h.co}{h.kind === "townland" && h.ed && h.ed.toLowerCase() !== h.en.toLowerCase() ? ` · ${h.ed}` : ""}{h.ga ? ` · ${h.ga}` : ""}</span></li>)}</ul>}
            </>
          )}
        </div>
      </label>
      <div className="two">
        <label>{f.far} <small>{f.farHelp}</small><input name="from_place" maxLength={80} placeholder={f.farPlacePh} autoComplete="off" /></label>
        <label>{f.farCountry}<input name="from_country" maxLength={60} placeholder={f.farCountryPh} autoComplete="off" /></label>
      </div>
      {text}
      <div className="two">
        <label>{f.language}
          <select name="lang" value={lng} onChange={e => setLng(e.target.value)}>{["en", "ga", "both", "other"].map(v => <option key={v} value={v}>{langName(v, lang)}</option>)}</select>
        </label>
        {lng === "other" && <label>{f.langOther} <small>{f.langOtherHelp}</small><input name="lang_other" required maxLength={40} placeholder={f.langOtherPh} /></label>}
      </div>
      {mode !== "record" && recorder}
      {mode !== "photo" && photographs}
      <div className="two">
        <label>{f.teller} <small>{f.firstName}</small><input name="teller_name" required maxLength={40} placeholder="Mary" /></label>
        <label>{f.bornIn}<select name="teller_born" defaultValue=""><option value="">{f.preferNot}</option>{DEC.map(d => <option key={d} value={d}>{decadeLabel(d, lang)}</option>)}</select></label>
      </div>
      <div className="two">
        <label>{f.relation}<select name="teller_relation" defaultValue="grandmother">{REL.map(r => <option key={r} value={r}>{relationLabel(r, lang)}</option>)}</select></label>
        <label>{f.collector} <small>{f.firstName}</small><input name="collector_name" required maxLength={40} placeholder="Saoirse" /></label>
      </div>
      <div className="two">
        <label>{f.age} <small>{f.ageHelp}</small><select name="collector_age" defaultValue="10 to 12">{AGE.map(a => <option key={a} value={a}>{ageLabel(a, lang)}</option>)}</select></label>
        <label>{f.school} <small>{f.optional}</small><input name="school" maxLength={80} placeholder={f.schoolPh} /></label>
      </div>
      <div className="two">
        <label>{f.cls} <small>{f.optional}</small><input name="class_name" maxLength={40} placeholder={f.clsPh} /></label>
        <label>{f.email} <small>{f.emailHelp}</small><input name="contact_email" type="email" maxLength={120} placeholder="you@example.ie" /></label>
      </div>
      <label>{f.consentName} <small>{f.consentNameHelp}</small><input name="consent_name" required maxLength={60} /></label>
      <label className="check"><input type="checkbox" name="consent" required /> <span>{f.consent} <a href="/privacy" target="_blank">{f.consentLink}</a>.</span></label>
      <button className="btn" type="submit" disabled={busy || recording}>{busy ? f.sending : f.send}</button>
    </form>
  );
}
