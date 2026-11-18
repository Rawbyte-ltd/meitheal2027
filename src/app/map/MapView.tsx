"use client";
// MapLibre loaded at runtime from /maplibre/maplibre-gl.mjs: through webpack the minified main copy and the untouched
// worker disagree on class names and no tile draws (see Lios). Light positron basemap, stories as green points.
import { useEffect, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { coOf, dict, type Lang } from "@/lib/i18n";

type ML = typeof import("maplibre-gl");
const ML_URL = "/maplibre/maplibre-gl.mjs";
const esc = (v: string) => String(v).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[c]!);

export default function MapView({ lang, lat, lng, zoom }: { lang: Lang; lat?: number; lng?: number; zoom?: number }) {
  const t = dict(lang).map;
  const box = useRef<HTMLDivElement>(null); const ref = useRef<MLMap | null>(null);
  const [status, setStatus] = useState(t.loading);
  useEffect(() => {
    if (!box.current || ref.current) return;
    let cancelled = false;
    (async () => {
      let ml: ML; try { ml = (await import(/* webpackIgnore: true */ ML_URL)) as ML; } catch { setStatus(t.noLib); return; }
      if (cancelled || !box.current) return;
      const map = new ml.Map({ container: box.current, style: "https://tiles.openfreemap.org/styles/positron", center: [lng ?? -7.9, lat ?? 53.4], zoom: zoom ?? 6.2, minZoom: 5, maxZoom: 16, attributionControl: { compact: true } });
      ref.current = map;
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      map.once("style.load", async () => {
        try {
          const fc = await (await fetch("/api/points")).json();
          map.addSource("stories", { type: "geojson", data: fc, cluster: true, clusterRadius: 36 });
          map.addLayer({ id: "clusters", type: "circle", source: "stories", filter: ["has", "point_count"], paint: { "circle-color": "#2f7d5b", "circle-radius": ["step", ["get", "point_count"], 14, 10, 20, 50, 28], "circle-stroke-color": "#fff", "circle-stroke-width": 2 } });
          map.addLayer({ id: "cluster-count", type: "symbol", source: "stories", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-size": 12, "text-font": ["Noto Sans Bold"] /* one the positron style serves; MapLibre's default font is not there (404) */ }, paint: { "text-color": "#fff" } });
          map.addLayer({ id: "pts", type: "circle", source: "stories", filter: ["!", ["has", "point_count"]], paint: { "circle-color": "#d9534f", "circle-radius": 6, "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 } });
          const n = fc.features?.length ?? 0;
          setStatus(n ? t.count(n) : t.none);
          map.on("click", "pts", e => { const p = e.features?.[0]?.properties as { id: string; title: string; townland: string; county: string; archive?: boolean } | undefined; if (!p) return; new ml.Popup({ offset: 10 }).setLngLat(e.lngLat).setHTML(`<b>${esc(p.title)}</b>${p.archive ? ' <span class="tag y1937">1937</span>' : ""}<br>${esc(p.townland)}, ${coOf(p.county, lang)}<br><a href="/story/${p.id}">${t.read}</a>`).addTo(map); });
          map.on("click", "clusters", e => { const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0]; if (!f) return; map.easeTo({ center: (f.geometry as unknown as { coordinates: [number, number] }).coordinates, zoom: map.getZoom() + 2 }); });
          map.on("mouseenter", "pts", () => { map.getCanvas().style.cursor = "pointer"; }); map.on("mouseleave", "pts", () => { map.getCanvas().style.cursor = ""; });
        } catch { setStatus(t.failed); }
      });
    })();
    return () => { cancelled = true; ref.current?.remove(); ref.current = null; };
  }, [lat, lng, zoom, t]);
  return (
    <div style={{ position: "relative", height: "calc(100vh - 64px)", minHeight: 480 }}>
      <h1 className="sr-only">{t.title}</h1>
      <div ref={box} style={{ position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", left: 12, top: 12, background: "rgba(247,242,232,.95)", border: "1px solid var(--line)", borderRadius: 999, padding: "7px 12px", fontSize: ".9rem" }}>{status}</div>
    </div>
  );
}
