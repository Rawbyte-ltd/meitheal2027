import { pageMeta } from "@/lib/seo";
import MapView from "./MapView";
import { getDict } from "@/lib/lang";
export async function generateMetadata() { const { lang, t } = await getDict(); return pageMeta(t.map.title, lang === "ga" ? "Léarscáil de scéalta Mheitheal 2027, baile fearainn ar bhaile fearainn, ar fud na 26 contae." : "A map of Meitheal 2027 stories, townland by townland, across the 26 counties of the 1937 Schools' Collection."); }
export default async function MapPage({ searchParams }: { searchParams: Promise<{ lat?: string; lng?: string; z?: string }> }) {
  const sp = await searchParams; const lat = Number(sp.lat), lng = Number(sp.lng), z = Number(sp.z); const ok = Number.isFinite(lat) && Number.isFinite(lng);
  const { lang } = await getDict();
  return <MapView lang={lang} lat={ok ? lat : undefined} lng={ok ? lng : undefined} zoom={ok && Number.isFinite(z) ? z : undefined} />;
}
