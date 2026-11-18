import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type TCols = { id: number[]; en: string[]; ga: string[]; co: string[]; lat: number[]; lng: number[]; slug: string[]; ed: string[]; cp: string[] };
type PCols = { en: string[]; ga: string[]; co: string[]; lat: number[]; lng: number[]; slug: string[]; kind: string[]; alt: string[] };
/** A townland, or a city, town or village (scripts/build-places.mjs). `ed` and `cp` are empty for a town. */
export type PlaceKind = "townland" | "city" | "town" | "village";
export type Townland = { en: string; ga: string; co: string; lat: number; lng: number; slug: string; ed: string; cp: string; kind: PlaceKind };

export const stripFada = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
export const norm = (s: string) => stripFada(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** The 26 counties of the 1937 Schools' Collection. Antrim, Armagh, Derry, Down, Fermanagh and Tyrone were not in it. */
export const COUNTIES = ["Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"];
const IN_SCOPE = new Set(COUNTIES);
/** "Cavan town", "Ballinagh village": the word that says which kind of place is meant. */
const KIND_WORD = /\s+(?:town|village|city|baile mor|sraidbhaile|cathair)$/;

/**
 * Where a story belongs: one of the 61,000 townlands, or one of the 1,438 cities, towns and villages. A town is not a
 * townland (Cavan town sits on Townparks, Abbeyland, Tullymongan and others), and in 1937 the children wrote the town
 * for town people, so both are offered. When a town and a townland share a name, the town comes first.
 */
class Townlands {
  T: Omit<TCols, "id"> & { kind: PlaceKind[] };
  keys: { en: string; ga: string; ed: string; co: string; alt: string[] }[]; bySlug = new Map<string, number>();
  constructor() {
    // Only the 26 counties, as in the 1937 Schools' Collection (and one set of laws: Irish data protection and safeguarding).
    // The file covers the whole island; townlands in the six northern counties, and the few with no county, are dropped.
    const all = JSON.parse(readFileSync(join(process.cwd(), "data", "townlands.json"), "utf8")) as TCols;
    const keep = all.co.map((c, i) => (IN_SCOPE.has(c) ? i : -1)).filter(i => i >= 0);
    const pick = <K extends keyof TCols>(k: K) => keep.map(i => all[k][i]) as TCols[K];
    let places: PCols = { en: [], ga: [], co: [], lat: [], lng: [], slug: [], kind: [], alt: [] };
    try { places = JSON.parse(readFileSync(join(process.cwd(), "data", "places.json"), "utf8")) as PCols; }
    catch (e) { console.error("townlands: data/places.json missing or unreadable; towns and villages are not searchable", e); }
    this.T = {
      en: [...pick("en"), ...places.en], ga: [...pick("ga"), ...places.ga], co: [...pick("co"), ...places.co],
      lat: [...pick("lat"), ...places.lat], lng: [...pick("lng"), ...places.lng], slug: [...pick("slug"), ...places.slug],
      ed: [...pick("ed"), ...places.en.map(() => "")], cp: [...pick("cp"), ...places.en.map(() => "")],
      kind: [...keep.map(() => "townland" as const), ...(places.kind as PlaceKind[])],
    };
    const alts = [...keep.map(() => ""), ...places.alt];
    this.keys = this.T.en.map((en, i) => ({ en: norm(en), ga: norm(this.T.ga[i]), ed: norm(this.T.ed[i]), co: norm(this.T.co[i]), alt: alts[i] ? alts[i].split("|").map(norm) : [] }));
    this.T.slug.forEach((s, i) => this.bySlug.set(`${norm(this.T.co[i])}/${s}`, i));
  }
  get(i: number): Townland { const T = this.T; return { en: T.en[i], ga: T.ga[i], co: T.co[i], lat: T.lat[i], lng: T.lng[i], slug: T.slug[i], ed: T.ed[i], cp: T.cp[i], kind: T.kind[i] }; }
  find(co: string, slug: string): Townland | null { const i = this.bySlug.get(`${norm(co)}/${slug}`); return i == null ? null : this.get(i); }
  search(query: string, limit = 10): Townland[] {
    let n = norm(query); if (n.length < 2) return [];
    const counties = [...new Set(this.T.co)].map(norm);
    let only: string | null = null;
    const m = n.match(/^(.+?)\s+(?:co\.?\s+|county\s+)?([a-z]+)$/);
    if (m && counties.includes(m[2]) && m[1].length >= 2) { only = m[2]; n = m[1]; }
    // "Cavan town": look for the town called Cavan, and rank towns first.
    const wantPlace = KIND_WORD.test(n); if (wantPlace) n = n.replace(KIND_WORD, "");
    const starts = (k: string) => k === n ? 0 : k.startsWith(n) ? 1 : k.includes(" " + n) ? 2 : k.includes(n) ? 6 : -1;
    const hits: { i: number; r: number }[] = [];
    for (let i = 0; i < this.keys.length; i++) {
      const k = this.keys[i]; if (only && k.co !== only) continue;
      const en = starts(k.en), ga = starts(k.ga);
      let r: number;
      if (this.T.kind[i] !== "townland") {
        // A town or village: just above a townland of the same name, and found by any of its spellings.
        const alt = Math.min(...k.alt.map(a => { const s = starts(a); return s < 0 ? 99 : s; }), 99);
        const p = en === 0 || ga === 0 ? -1 : alt === 0 ? -0.5 : en === 1 || ga === 1 ? 1.5 : en === 2 || ga === 2 || alt <= 2 ? 2.5 : en === 6 || ga === 6 ? 7.5 : null;
        if (p === null) continue;
        r = wantPlace ? p - 10 : p;
      } else {
        const ed = starts(k.ed);
        r = en === 0 ? 0 : ga === 0 ? 1 : en === 1 ? 2 : en === 2 ? 3 : ga === 1 || ga === 2 ? 4 : ed >= 0 && ed <= 1 ? 7 : en === 6 || ga === 6 ? 8 : -1;
        if (r < 0) continue;
      }
      hits.push({ i, r: r + Math.min(this.T.en[i].length, 40) / 800 });
    }
    hits.sort((a, b) => a.r - b.r);
    return hits.slice(0, limit).map(h => this.get(h.i));
  }
}
const g = globalThis as unknown as { __townlands?: Townlands };
export const townlands = () => (g.__townlands ??= new Townlands());
