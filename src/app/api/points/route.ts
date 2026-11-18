import { points } from "@/lib/stories";
export const dynamic = "force-dynamic";
export async function GET() {
  const rows = await points();
  return Response.json({ type: "FeatureCollection", features: rows.map(r => ({ type: "Feature", geometry: { type: "Point", coordinates: [r.lng, r.lat] }, properties: { id: r.id, title: r.title, topic: r.topic, county: r.county, townland: r.townland_en, archive: r.archive } })) }, { headers: { "Cache-Control": "public, max-age=120" } });
}
