import type { Lang } from "@/lib/i18n";
import { PHOTOS, srcSet } from "@/lib/photos";

/** An archive photograph, pasted into the copybook: white border, a strip of tape, the caption written underneath. */
export default function Photo({ k, lang = "en", tilt = 0, sizes = "(max-width: 760px) 100vw, 520px", tape = true, eager = false, className = "" }: { k: keyof typeof PHOTOS; lang?: Lang; tilt?: number; sizes?: string; tape?: boolean; eager?: boolean; className?: string }) {
  const p = PHOTOS[k], caption = lang === "ga" ? p.caption_ga : p.caption;
  return (
    <figure className={`snap ${tape ? "taped" : ""} ${className}`} style={{ "--tilt": `${tilt}deg` } as React.CSSProperties}>
      <img src={`/photos/${p.key}-700.jpg`} srcSet={srcSet(p)} sizes={sizes} width={p.w} height={p.h} alt={caption} loading={eager ? "eager" : "lazy"} decoding="async" />
      <figcaption><span className="yr">{p.year}</span> {caption}. <a href={p.source} rel="noopener">{lang === "ga" ? "Leabharlann Náisiúnta na hÉireann" : "National Library of Ireland"}</a></figcaption>
    </figure>
  );
}
