"use client";
import { useState } from "react";
import { dict, type Lang } from "@/lib/i18n";

export default function KeepControls({ id, k, status, lang }: { id: string; k: string; status: string; lang: Lang }) {
  const t = dict(lang).keep;
  const [copied, setCopied] = useState(false); const [gone, setGone] = useState(false); const [failed, setFailed] = useState(false);
  const here = typeof window !== "undefined" ? window.location.href : "";
  const copy = async () => { try { await navigator.clipboard.writeText(here); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } };
  const remove = async () => {
    if (!confirm(t.confirm)) return;
    const r = await fetch(`/api/keep/${id}?k=${encodeURIComponent(k)}`, { method: "DELETE" });
    if (r.ok) setGone(true); else setFailed(true);
  };
  if (gone) return <p className="bad">{t.gone}</p>;
  return (<>
    {failed && <p className="bad">{t.removeFailed}</p>}
    <div className="chips">
      <button className="btn ghost" type="button" onClick={copy}>{copied ? t.copied : t.copy}</button>
      <button className="btn ghost" type="button" onClick={() => window.print()}>{t.print}</button>
      {status === "approved" && <a className="btn" href={`/story/${id}`}>{t.open}</a>}
      <a className="btn ghost" href="/submit">{t.another}</a>
      {status !== "removed" && <button className="btn red" type="button" onClick={remove}>{t.remove}</button>}
    </div>
  </>);
}
