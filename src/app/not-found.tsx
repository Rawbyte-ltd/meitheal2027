import { getDict } from "@/lib/lang";

/** A dead link says so in the tab and in search results, not just "Meitheal 2027". */
export async function generateMetadata() { const n = (await getDict()).t.notFound; return { title: n.kicker, robots: { index: false } }; }

export default async function NotFound() {
  const n = (await getDict()).t.notFound;
  return <main className="wrap hero"><div className="kicker">{n.kicker}</div><h1>{n.h1a}<em>{n.h1em}</em></h1><p className="lead">{n.leadA}<a href="/stories">{n.browse}</a>{n.or}<a href="/">{n.home}</a>{n.end}</p></main>;
}
