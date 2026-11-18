import { getDict } from "@/lib/lang";
export async function generateMetadata() { return { title: (await getDict()).t.gate.title, robots: { index: false } }; }

export default async function Gate({ searchParams }: { searchParams: Promise<{ to?: string; wrong?: string }> }) {
  const [{ to, wrong }, { t }] = await Promise.all([searchParams, getDict()]); const g = t.gate;
  return (
    <main className="wrap" style={{ maxWidth: 520, paddingTop: 60 }}>
      <div className="kicker">{g.kicker}</div>
      <h1>{g.h1a}<em>{g.h1em}</em></h1>
      <p className="lead">{g.lead}</p>
      {wrong && <p className="bad">{g.wrong}</p>}
      <form method="post" action="/api/gate" className="sheet copybook">
        <input type="hidden" name="to" value={to ?? "/"} />
        <label>{g.word}<input name="password" type="password" autoFocus required /></label>
        <button className="btn" type="submit">{g.in}</button>
      </form>
    </main>
  );
}
