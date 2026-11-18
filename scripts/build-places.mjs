// Builds data/places.json: the cities, towns and villages of the 26 counties, so a story can be pinned to a town as
// well as to a townland (src/lib/townlands.ts). A town is not a townland: Cavan town sits on Townparks, Abbeyland,
// Tullymongan and others, and Ballinagh's townland is spelt Bellananagh, so people searching for their town found
// nothing. In 1937 the children wrote the teller's place as people said it, the town for town people.
//
// Source: OpenStreetMap (place=city|town|village inside Ireland), ODbL, already credited in the site footer. Each place
// gets the county of the nearest townland centroid in data/townlands.json; anything nearest a townland outside the 26
// counties, or more than 8 km from any townland, is left out.
//
// Run: node scripts/build-places.mjs   (needs the network; re-run to refresh, then commit data/places.json)
import { readFileSync, writeFileSync } from "node:fs";

const COUNTIES = new Set(["Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary", "Waterford", "Westmeath", "Wexford", "Wicklow"]);
const slugOf = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const query = `[out:json][timeout:120];area["ISO3166-1"="IE"][admin_level=2]->.ie;node["place"~"^(city|town|village)$"](area.ie);out body;`;
// The public Overpass servers are often busy: try each a few times.
const SERVERS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
let nodes = null;
for (let attempt = 0; attempt < 3 && !nodes; attempt++) for (const url of SERVERS) {
  try {
    const res = await fetch(`${url}?data=${encodeURIComponent(query)}`, { headers: { "User-Agent": "meitheal2027.ie gazetteer build (hello@rawbyte.ie)", Accept: "application/json" }, signal: AbortSignal.timeout(150000) });
    if (res.ok) { nodes = (await res.json()).elements; break; }
    console.error("overpass:", url, res.status);
  } catch (e) { console.error("overpass:", url, e.message); }
  await new Promise(r => setTimeout(r, 5000));
}
if (!nodes?.length) { console.error("overpass: no answer; data/places.json left as it was"); process.exit(1); }

const T = JSON.parse(readFileSync(new URL("../data/townlands.json", import.meta.url), "utf8"));
const taken = new Set(T.slug.map((s, i) => `${T.co[i]}/${s}`));
const out = { en: [], ga: [], co: [], lat: [], lng: [], slug: [], kind: [], alt: [] };
let skipped = 0;
for (const n of nodes.sort((a, b) => ["city", "town", "village"].indexOf(a.tags.place) - ["city", "town", "village"].indexOf(b.tags.place))) {
  // The name people use: OSM's `name`, unless that is the Irish name (Gaeltacht places), then name:en. Every other
  // spelling (Ballinagh is officially Bellananagh) is kept in `alt` so the search finds it.
  const t = n.tags, nm = (t.name || "").trim(), nga = (t["name:ga"] || "").trim();
  // Some are bilingual ("Dingle / Daingean Uí Chúis"): the English half goes on top.
  const en = nm.includes(" / ") ? ((t["name:en"] || "").trim() || nm.split(" / ")[0].trim())
    : nm && nm !== nga ? nm : ((t["name:en"] || "").trim() || nm);
  const ga = nga || (nm.includes(" / ") ? nm.split(" / ").slice(1).join(" / ").trim() : nm !== en ? nm : "");
  if (!en) { skipped++; continue; }
  const alt = [...new Set([nm, t["name:en"], t.official_name, t.alt_name, t["alt_name:en"], t.old_name, t.loc_name, t.short_name]
    .flatMap(x => (x || "").split(";")).map(x => x.trim()).filter(x => x && x !== en && x !== ga))];
  // Nearest townland centroid gives the county (and keeps out anything that is really over the border).
  let best = -1, bestD = Infinity; const cos = Math.cos(n.lat * Math.PI / 180);
  for (let i = 0; i < T.lat.length; i++) { const dy = T.lat[i] - n.lat, dx = (T.lng[i] - n.lon) * cos, d = dx * dx + dy * dy; if (d < bestD) { bestD = d; best = i; } }
  const km = Math.sqrt(bestD) * 111;
  if (best < 0 || !COUNTIES.has(T.co[best]) || km > 8) { skipped++; continue; }
  const co = T.co[best], kind = t.place;
  // One entry per name, kind and county (OSM sometimes has two points for one village).
  if (out.en.some((e, j) => e === en && out.co[j] === co && out.kind[j] === kind)) { skipped++; continue; }
  let slug = `${slugOf(en)}-${kind}`, k = 2;
  while (taken.has(`${co}/${slug}`)) slug = `${slugOf(en)}-${kind}-${k++}`;
  taken.add(`${co}/${slug}`);
  out.en.push(en); out.ga.push(ga); out.co.push(co); out.lat.push(+n.lat.toFixed(5)); out.lng.push(+n.lon.toFixed(5)); out.slug.push(slug); out.kind.push(kind); out.alt.push(alt.join("|"));
}
writeFileSync(new URL("../data/places.json", import.meta.url), JSON.stringify({ source: "OpenStreetMap contributors, ODbL", built: new Date().toISOString().slice(0, 10), ...out }));
const count = k => out.kind.filter(x => x === k).length;
console.log(`${out.en.length} places (${count("city")} cities, ${count("town")} towns, ${count("village")} villages); ${skipped} left out`);
