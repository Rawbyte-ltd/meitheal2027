import { pageMeta } from "@/lib/seo";
import { topicName, topicOther, topicPrompt } from "@/lib/i18n";
import { getDict } from "@/lib/lang";
import { schoolList } from "@/lib/stories";
import { TOPICS } from "@/lib/topics";
import PrintGroup from "./PrintGroup";
export const dynamic = "force-dynamic";
export async function generateMetadata() { const ga = (await getDict()).lang === "ga"; return pageMeta(ga ? "Pacáiste do scoileanna" : "Schools pack: a folklore project for primary classes", ga ? "Tionscadal béaloidis do ranganna bunscoile, saor in aisce: bailíonn na páistí scéalta óna seanóirí faoi cheannteidil 1937, agus ceadaíonn an múinteoir iad." : "A free folklore project for primary classes: pupils collect stories from older relatives under the 1937 Schools' Collection headings, and the teacher approves them. Fits SESE and oral language."); }

const TEXT = {
  en: {
    kicker: "For teachers · Pacáiste do Scoileanna", h1a: "A fortnight that ", h1em: "lasts a century",
    lead: "The 1937 scheme was run by teachers, through the INTO, with a booklet of headings. This is that booklet, updated, and it costs nothing. Print it below.",
    noteSee: "To see what you are agreeing to: the stories on the map at meitheal2027.ie, and the original 1937 stories at duchas.ie.",
    plan: "The plan", printTeachers: "Print the teachers' booklet", printNote: "Print the note for parents",
    steps: [
      ["Day 1.", <>Read the class two or three stories from 1938 for your own parish on <a href="https://www.duchas.ie" rel="noopener">dúchas.ie</a>. Show them the handwriting. Tell them it was children their age.</>],
      ["Day 2.", "Each child picks one heading from the list below and one elder: a grandparent, a great-aunt, a neighbour. A grandparent in Lublin or Lagos on a video call counts, in any language, and the story of how the family came here has a heading of its own. Send home the note on this page."],
      ["The week.", "The interview. Ten minutes, phone recording if the elder agrees, notes if not."],
      ["Day 8 and 9.", "Write it up in the teller's words, 150 to 600 words. Irish or English. Read it back to the teller."],
      ["Day 10.", <>Type them in at <b>meitheal2027.ie/submit</b> with the school name, or the teacher does it in one sitting. An adult ticks consent on each. The school then appears on the map.</>],
      ["After.", "Every family gets a keeper link and can print their story. The whole class set is offered to the National Folklore Collection."],
    ] as [string, React.ReactNode][],
    curriculum: "Curriculum: SESE History (local studies, oral history), SPHE (myself and the wider world), Gaeilge, and the new Senior Cycle's additional assessment components for schools taking it further.",
    note: "Note home to parents",
    noteBody: "Dear parent or guardian, our class is taking part in Meitheal 2027, a repeat of the 1937 Schools' Folklore Collection. Your child will ask an older relative or neighbour to tell one story under a heading from the original scheme, and write it down in the teller's own words. Stories are published online with first names only, the teller's decade of birth and the townland, after a person has read them, and are offered to the National Folklore Collection to be kept for a hundred years. No surnames, addresses or health details are recorded. If you or the teller would rather it was not online, talk to the teacher. You can remove it at any time using the family link. Please sign below if you are happy for your child to take part and for the story to be published.",
    signed: "Signed:", tellerName: "Teller's first name:", date: "Date:",
    headings: "The headings", cols: ["Heading", "As Gaeilge", "Ask", "Era"], taking: "Schools taking part",
    hand: "Want a hand?", handBody: "We will come to the school, or do a video call with the class, and we can print a bound copybook of the class set for the school library.",
  },
  ga: {
    kicker: "Do mhúinteoirí · For teachers", h1a: "Coicís a mhairfidh ", h1em: "céad bliain",
    lead: "Múinteoirí a reáchtáil scéim 1937, trí Chumann Múinteoirí Éireann, le leabhrán ceannteideal. Seo é an leabhrán sin, tugtha suas chun dáta, agus níl aon chostas air. Priontáil an leathanach seo.",
    noteSee: "Le feiceáil cad atá tú ag aontú leis: na scéalta ar an léarscáil ag meitheal2027.ie, agus scéalta bunaidh 1937 ag duchas.ie/ga.",
    plan: "An plean", printTeachers: "Priontáil leabhrán na múinteoirí", printNote: "Priontáil an nóta do thuismitheoirí",
    steps: [
      ["Lá 1.", <>Léigh dhá nó trí scéal ó 1938 ó do pharóiste féin don rang ar <a href="https://www.duchas.ie/ga" rel="noopener">dúchas.ie</a>. Taispeáin an lámhscríbhneoireacht dóibh. Inis dóibh gur páistí ar comhaois leo a scríobh iad.</>],
      ["Lá 2.", "Roghnaíonn gach páiste ceannteideal amháin ón liosta thíos agus seanduine amháin: seantuismitheoir, sin-aintín, comharsa. Tá seantuismitheoir i Lublin nó i Lagos ar ghlao físe chomh maith le duine ar bith, i dteanga ar bith, agus tá ceannteideal dá chuid féin ag scéal faoin gcaoi ar tháinig an teaghlach anseo. Cuir an nóta ar an leathanach seo abhaile."],
      ["An tseachtain.", "An t-agallamh. Deich nóiméad, taifeadadh ar an bhfón má aontaíonn an seanduine, nótaí mura n-aontaíonn."],
      ["Lá 8 agus 9.", "Scríobh suas é i bhfocail an scéalaí, 150 go 600 focal. Gaeilge nó Béarla. Léigh ar ais don scéalaí é."],
      ["Lá 10.", <>Clóscríobh isteach iad ag <b>meitheal2027.ie/submit</b> le hainm na scoile, nó déanann an múinteoir é in aon suí amháin. Cuireann duine fásta tic sa bhosca toilithe ar gach ceann. Ansin bíonn an scoil ar an léarscáil.</>],
      ["Ina dhiaidh.", "Faigheann gach teaghlach nasc príobháideach agus is féidir leo a scéal a phriontáil. Tairgtear sraith iomlán an ranga do Chnuasach Bhéaloideas Éireann."],
    ],
    curriculum: "Curaclam: Stair OSCE (staidéar áitiúil, stair bhéil), OSPS (mé féin agus an domhan mór), Gaeilge, agus comhpháirteanna measúnachta breise na Sraithe Sinsearaí nua do scoileanna a théann níos faide leis.",
    note: "Nóta abhaile chuig tuismitheoirí",
    noteBody: "A thuismitheoir nó a chaomhnóir, a chara, tá ár rang ag glacadh páirte i Meitheal 2027, athdhéanamh ar Bhailiúchán Béaloideasa na Scol 1937. Iarrfaidh do pháiste ar ghaol nó ar chomharsa níos sine scéal amháin a insint faoi cheannteideal ón mbunscéim, agus scríobhfaidh sé nó sí síos é i bhfocail an scéalaí féin. Foilsítear na scéalta ar líne le céadainmneacha amháin, na deich mbliana inar rugadh an scéalaí agus an baile fearainn, tar éis do dhuine iad a léamh, agus tairgtear iad do Chnuasach Bhéaloideas Éireann le coinneáil ar feadh céad bliain. Ní thaifeadtar sloinnte, seoltaí ná sonraí sláinte. Mura mian leatsa nó leis an scéalaí é a bheith ar líne, labhair leis an múinteoir. Is féidir leat é a bhaint tráth ar bith le nasc an teaghlaigh. Sínigh thíos, le do thoil, má tá tú sásta go nglacfaidh do pháiste páirt agus go bhfoilseofar an scéal.",
    signed: "Sínithe:", tellerName: "Céadainm an scéalaí:", date: "Dáta:",
    headings: "Na ceannteidil", cols: ["Ceannteideal", "In English", "Fiafraigh", "Ré"], taking: "Scoileanna atá páirteach",
    hand: "Ar mhaith leat cabhair?", handBody: "Tiocfaimid chuig an scoil, nó déanfaimid glao físe leis an rang, agus is féidir linn cóipleabhar ceangailte de shraith an ranga a phriontáil do leabharlann na scoile.",
  },
};

export default async function Schools() {
  const [{ lang }, schools] = await Promise.all([getDict(), schoolList()]); const x = TEXT[lang];
  return (
    <main className="wrap">
      <section data-pg="teachers">
        <div className="kicker">{x.kicker}</div>
        <h1>{x.h1a}<em>{x.h1em}</em></h1>
        <p className="lead">{x.lead}</p>
        <p><PrintGroup group="teachers" label={x.printTeachers} /></p>
      </section>
      <section className="copybook" data-pg="teachers">
        <h2>{x.plan}</h2>
        <ol style={{ lineHeight: 1.8 }}>{x.steps.map(([d, p], i) => <li key={i}><b>{d}</b> {p}</li>)}</ol>
        <p className="muted small">{x.curriculum}</p>
      </section>
      <section className="copybook page" data-pg="parents">
        <h2>{x.note}</h2>
        <p className="story">{x.noteBody}</p>
        <p className="story">{x.noteSee}</p>
        <p style={{ marginTop: 24 }}>{x.signed} ______________________ &nbsp; {x.tellerName} ______________ &nbsp; {x.date} __________</p>
        <p><PrintGroup group="parents" label={x.printNote} /></p>
      </section>
      <section data-pg="teachers" className="headings">
        <h2>{x.headings}</h2>
        <table className="lb"><thead><tr>{x.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>{TOPICS.map(t => <tr key={t.slug}><td><b>{topicName(t, lang)}</b></td><td className="ga">{topicOther(t, lang)}</td><td className="muted">{topicPrompt(t, lang)}</td><td><span className={`tag y${t.era}`}>{t.era}</span></td></tr>)}</tbody></table>
      </section>
      {schools.length > 0 && <section data-pg="web"><h2>{x.taking}</h2><div className="chips">{schools.map(s => <a key={s.school} href={`/stories?q=${encodeURIComponent(s.school)}`}>{s.school} · {s.n}</a>)}</div></section>}
      <section className="card" data-pg="web"><h3>{x.hand}</h3><p className="muted">{x.handBody} <a href="mailto:hello@rawbyte.ie?subject=Meitheal%202027%20school">hello@rawbyte.ie</a>.</p></section>
    </main>
  );
}
