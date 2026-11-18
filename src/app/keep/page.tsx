import { getDict } from "@/lib/lang";
import { mailOn } from "@/lib/mail";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: (await getDict()).t.lost.title, robots: { index: false } }; }

/** Lost keeper link: ask for the adult's email; /api/keep/resend reissues the links. */
export default async function Lost({ searchParams }: { searchParams: Promise<{ sent?: string; nomail?: string }> }) {
  const [{ sent, nomail }, { lang, t }] = await Promise.all([searchParams, getDict()]);
  const x = t.lost;
  return (
    <main className="wrap" style={{ maxWidth: 640 }}>
      <section>
        <div className="kicker">{x.kicker}</div>
        <h1>{x.h1a}<em>{x.h1em}</em></h1>
        <p className="lead">{x.lead}</p>
        {sent && <p className="ok">{x.sent}</p>}
        {(nomail || !mailOn) && <p className="notice">{x.nomail}</p>}
        {!sent && mailOn && (
          <form method="post" action="/api/keep/resend" className="card" style={{ display: "grid", gap: 10 }}>
            <input type="hidden" name="ui_lang" value={lang} />
            <label>{x.email}<br /><input type="email" name="email" required autoComplete="email" style={{ width: "100%", padding: "9px 10px", border: "1px solid var(--line)", borderRadius: 8, font: "inherit" }} /></label>
            <div><button className="btn" type="submit">{x.send}</button></div>
          </form>
        )}
      </section>
    </main>
  );
}
