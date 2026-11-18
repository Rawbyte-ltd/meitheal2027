import { pageMeta } from "@/lib/seo";
import { topicName, topicOther, topicPrompt } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { TOPICS } from "@/lib/topics";

export async function generateMetadata() { const ga = (await getDict()).lang === "ga"; return pageMeta(ga ? "Conas scéal a bhailiú" : "How to collect a story", ga ? "Conas suí síos le seanóir agus scéal a bhailiú: na ceisteanna, an taifeadadh, agus an toiliú." : "How to sit down with an older relative and collect a story: what to ask, how to record it, and consent."); }

const TEXT = {
  en: {
    kicker: "How to collect", h1a: "Sit down. Ask. ", h1em: "Write it the way they said it.", lead: "The 1937 instructions to children fit on one page. Ours do too.",
    cards: [
      ["Before", "Tell them what it is for: a collection like the one in 1937, kept for a hundred years. Ask if they are happy for it to be read by strangers. Pick one heading, not ten. If your grandparents are in another country, a video call is grand, and any language is grand."],
      ["During", "Phone on the table, recording. Ask the question and then say nothing. Let the silence do the work. When they finish, ask “and what happened then?”"],
      ["After", "Write it in their words, not yours. Keep the “sure” and the “says I”. Irish or English or both. Read it back to them. Then add it here."],
      ["What not to do", "No surnames, no addresses, no health details, nothing about a living person who has not agreed. If a story names a neighbour, use “a neighbour”."],
    ],
    h2: "The headings and the questions", lead2: "Nineteen are from 1937. Nine are from the ninety years since.", collect: "Collect this one",
  },
  ga: {
    kicker: "Conas bailiú", h1a: "Suigh síos. Cuir ceist. ", h1em: "Scríobh é mar a dúirt siad é.", lead: "Bhí na treoracha a tugadh do na páistí in 1937 ar leathanach amháin. Tá ár gcuid féin freisin.",
    cards: [
      ["Roimh ré", "Inis dóibh cad chuige é: bailiúchán cosúil leis an gceann in 1937, a choinneofar ar feadh céad bliain. Fiafraigh díobh an bhfuil siad sásta go léifidh strainséirí é. Roghnaigh ceannteideal amháin, ní deich gcinn. Má tá do sheantuismitheoirí i dtír eile, tá glao físe go breá, agus tá teanga ar bith go breá."],
      ["Le linn", "An fón ar an mbord, ag taifeadadh. Cuir an cheist agus ansin ná habair faic. Lig don chiúnas an obair a dhéanamh. Nuair a bheidh siad críochnaithe, fiafraigh “agus cad a tharla ansin?”"],
      ["Ina dhiaidh", "Scríobh é ina bhfocail féin, ní i do chuid focal féin. Coinnigh an “muise” agus an “arsa mise”. Gaeilge nó Béarla nó an dá cheann. Léigh ar ais dóibh é. Ansin cuir isteach anseo é."],
      ["Ná déan", "Gan sloinnte, gan seoltaí, gan sonraí sláinte, faic faoi dhuine beo nár thug cead. Má ainmnítear comharsa sa scéal, scríobh “comharsa”."],
    ],
    h2: "Na ceannteidil agus na ceisteanna", lead2: "Is ó 1937 naoi gcinn déag acu. Is ó na nócha bliain ó shin naoi gcinn acu.", collect: "Bailigh an ceann seo",
  },
};

export default async function Collect() {
  const { lang } = await getDict(), x = TEXT[lang];
  return (
    <main className="wrap">
      <section>
        <div className="kicker">{x.kicker}</div>
        <h1>{x.h1a}<em>{x.h1em}</em></h1>
        <p className="lead">{x.lead}</p>
        <div className="grid">{x.cards.map(([h, p]) => <div key={h} className="card"><h3>{h}</h3><p className="muted">{p}</p></div>)}</div>
      </section>
      <section>
        <h2>{x.h2}</h2>
        <p className="lead">{x.lead2}</p>
        {TOPICS.map(t => (
          <div key={t.slug} id={t.slug} className="card" style={{ marginBottom: 12 }}>
            <div className="row" style={{ alignItems: "baseline" }}><h3>{topicName(t, lang)} <span className="ga">· {topicOther(t, lang)}</span></h3><span className={`tag y${t.era}`}>{t.era}</span></div>
            <p className="muted" style={{ margin: "6px 0 10px" }}>{topicPrompt(t, lang)}</p>
            <a className="btn ghost" href={`/submit?topic=${t.slug}`} style={{ padding: "9px 14px" }}>{x.collect}</a>
          </div>
        ))}
      </section>
    </main>
  );
}
