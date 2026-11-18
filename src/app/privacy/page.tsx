import { pageMeta } from "@/lib/seo";
import { getDict } from "@/lib/lang";

/**
 * The privacy notice (GDPR Article 13). Built from docs/data-protection.md and checked against the code and the Railway
 * settings on 4 November 2026: hosting europe-west4 (Netherlands), R2 in the EU jurisdiction, Zoho EU for mail, Anthropic
 * and Cloudflare Workers AI for the checks, OpenFreeMap tiles in the visitor's browser, one language cookie. When a
 * processor, a published field or a retention rule changes, change this page in the same commit.
 */
export async function generateMetadata() { const ga = (await getDict()).lang === "ga"; return pageMeta(ga ? "Príobháideacht" : "Privacy", ga ? "Cé a choinníonn an méid a sheolann tú chuig Meitheal 2027, cad a tharlaíonn dó, cé eile a láimhseálann é, agus conas é a bhaint." : "Who holds what you send to Meitheal 2027, what happens to it, who else handles it, and how to take it back."); }

const UPDATED = { en: "4 November 2026", ga: "4 Samhain 2026" };
const mail = <a href="mailto:hello@rawbyte.ie">hello@rawbyte.ie</a>;

type Section = { h: string; p?: string; items?: string[] };
const TEXT: Record<"en" | "ga", { kicker: string; h1: string; lead: string; updated: string; sections: Section[]; contact: string }> = {
  en: {
    kicker: "Privacy · Príobháideacht", h1: "Privacy", updated: "Last changed",
    lead: "Who holds what you send to Meitheal 2027, what happens to it, who else handles it, and how to take it back. Plain words; ask if anything is unclear.",
    sections: [
      { h: "Who holds it", p: "Meitheal 2027 is run by MemoryMantle Ireland Limited (CRO 817937), trading as RawByte, Derrycramph, Cavan, H12 C925. We are the controller of the stories and the details sent with them." },
      { h: "What we collect", items: [
        "The story: its title, heading and text, and a recording and up to four photographs if you add them.",
        "The teller's first name, decade of birth and relation to the collector. The collector's first name and age band, and the school and class if there is one.",
        "The townland, and the far place if the story is from somewhere else.",
        "The consenting adult's first name and the consent tick, with the version of the consent wording they saw. Their email if they give it.",
        "A one-way fingerprint of the sender's internet address, to stop floods of submissions. The address itself is not kept.",
        "A machine transcript of a recording, and for a story in another language, a machine English version.",
        "Not collected: surnames, addresses, dates of birth, health details, photographs of children. Photographs are stripped of their location and camera details when they arrive.",
      ] },
      { h: "What is public, and what is not", items: [
        "Nothing is public until a person has read it.",
        "Public once read: the story, its title and heading, the recording and photographs, the teller's first name, decade of birth and relation, the collector's first name, age band and school, and the townland and far place.",
        "Never public: the class, the consenting adult's name and email, the internet fingerprint. The machine transcript is shown only on the family's private page and to the person reading it, until that person has read and published a written-out version.",
      ] },
      { h: "Why, and on what basis", items: [
        "To build a folklore collection, as the Schools' Collection did in 1937, and to offer it to the National Folklore Collection at UCD for permanent keeping.",
        "The basis is the consent an adult gives on each story (GDPR Article 6(1)(a)). A story may touch on health or belief; the consent covers that too (Article 9(2)(a)), and every story is read by a person before it is public. Archiving in the public interest follows the safeguards in Article 89.",
        "Teacher and reader accounts, and the record of their decisions, are kept to run the reading desk safely (legitimate interests, Article 6(1)(f)).",
      ] },
      { h: "Who else handles it", items: [
        "Railway hosts the website and database, on servers in the Netherlands. Railway Corp. is a US company.",
        "Cloudflare stores the recordings and photographs in its EU storage, and runs our domain. Its Workers AI checks each photograph and makes the machine transcript of a recording; that can run outside the EU.",
        "Anthropic (USA) reads the written story, the names and photo captions, and the machine transcript, and flags anything a person should look at closely. For a story in a language other than English or Irish, it also writes the English version shown beside it. The checks only flag; a person decides.",
        "Zoho (EU) sends our emails, such as the private keeper link.",
        "OpenFreeMap supplies the map images. When you open the map, your browser fetches them from OpenFreeMap, which sees your internet address. No story details go to it.",
        "Transfers outside the EU rely on the safeguards in each company's data processing terms: the EU standard contractual clauses, or the EU-US Data Privacy Framework.",
        "No advertising, no analytics, no tracking. Nothing is sold or shared for any other purpose.",
      ] },
      { h: "How long", items: [
        "A story and its details are kept as part of the collection until the family removes it. If the National Folklore Collection accepts the collection, it keeps it permanently.",
        "Removing a story deletes its recordings and photographs, and clears its text, names, ages, school, class, email and internet fingerprint. What remains is a note that a story with that number was removed: its dates, heading, county and townland, and that consent was given. No names, no words.",
        "Teacher and reader accounts are kept while they are in use, and anonymised 12 months after they were last used. The record of what the desk decided is kept for 3 years.",
      ] },
      { h: "Your rights", items: [
        "The family's private keeper link shows, prints and removes the story at any time, no questions asked.",
        "You can also ask us to see, correct or delete what we hold, or withdraw consent, by emailing hello@rawbyte.ie. We answer within a month. Withdrawing consent does not undo what was lawful before it.",
        "If a story has already gone to the National Folklore Collection, we pass the removal on to them.",
        "You can complain to the Data Protection Commission at dataprotection.ie.",
      ] },
      { h: "Cookies", p: "One, and only if you switch language: it remembers English or Irish for a year. Teachers and readers who sign in to the reading desk get a sign-in cookie. Nothing else." },
    ],
    contact: "Questions, or anything to remove:",
  },
  ga: {
    kicker: "Príobháideacht · Privacy", h1: "Príobháideacht", updated: "Athraithe go deireanach",
    lead: "Cé a choinníonn an méid a sheolann tú chuig Meitheal 2027, cad a tharlaíonn dó, cé eile a láimhseálann é, agus conas é a bhaint. I bhfocail shimplí; fiafraigh má tá aon rud doiléir.",
    sections: [
      { h: "Cé a choinníonn é", p: "Is é MemoryMantle Ireland Limited (CRO 817937), ag trádáil mar RawByte, Derrycramph, Cavan, H12 C925, a reáchtálann Meitheal 2027. Is sinne rialaitheoir na scéalta agus na sonraí a sheoltar leo." },
      { h: "Cad a bhailímid", items: [
        "An scéal: a theideal, a cheannteideal agus a théacs, agus taifeadadh agus suas le ceithre ghrianghraf má chuireann tú leis iad.",
        "Céadainm an scéalaí, na deich mbliana inar rugadh é nó í agus a ghaol nó a gaol leis an mbailitheoir. Céadainm agus aoisghrúpa an bhailitheora, agus an scoil agus an rang más ann dóibh.",
        "An baile fearainn, agus an áit i gcéin más as áit eile an scéal.",
        "Céadainm an duine fhásta a thugann toiliú agus an tic, leis an leagan den fhoclaíocht toilithe a chonaic sé nó sí. A ríomhphost má thugtar é.",
        "Méarlorg aontreo de sheoladh idirlín an tseoltóra, chun tuilte iarratas a stopadh. Ní choinnítear an seoladh féin.",
        "Tras-scríbhinn meaisín de thaifeadadh, agus i gcás scéil i dteanga eile, leagan Béarla a rinne meaisín.",
        "Ní bhailítear: sloinnte, seoltaí, dátaí breithe, sonraí sláinte, grianghraif de pháistí. Baintear sonraí suímh agus ceamara de na grianghraif nuair a thagann siad isteach.",
      ] },
      { h: "Cad atá poiblí, agus cad nach bhfuil", items: [
        "Níl aon rud poiblí go dtí go léann duine é.",
        "Poiblí nuair a léitear é: an scéal, a theideal agus a cheannteideal, an taifeadadh agus na grianghraif, céadainm an scéalaí, na deich mbliana inar rugadh é nó í agus an gaol, céadainm, aoisghrúpa agus scoil an bhailitheora, agus an baile fearainn agus an áit i gcéin.",
        "Ní bhíonn siad poiblí riamh: an rang, ainm agus ríomhphost an duine fhásta, an méarlorg idirlín. Ní thaispeántar an tras-scríbhinn meaisín ach ar leathanach príobháideach an teaghlaigh agus don duine a léann é, go dtí go léann an duine sin leagan scríofa agus go bhfoilsíonn sé é.",
      ] },
      { h: "Cén fáth, agus ar a bhfuil sé bunaithe", items: [
        "Chun bailiúchán béaloidis a dhéanamh, mar a rinne Bailiúchán na Scol in 1937, agus é a thairiscint do Chnuasach Bhéaloideas Éireann in UCD le coinneáil go buan.",
        "Tá sé bunaithe ar an toiliú a thugann duine fásta ar gach scéal (Airteagal 6(1)(a) den RGCS). D'fhéadfadh scéal baint a bheith aige le sláinte nó le creideamh; clúdaíonn an toiliú é sin freisin (Airteagal 9(2)(a)), agus léann duine gach scéal sula mbíonn sé poiblí. Leantar na cosaintí in Airteagal 89 maidir le cartlannú ar mhaithe le leas an phobail.",
        "Coinnítear cuntais mhúinteoirí agus léitheoirí, agus taifead ar a gcinntí, chun an deasc léitheoireachta a reáchtáil go sábháilte (leasanna dlisteanacha, Airteagal 6(1)(f)).",
      ] },
      { h: "Cé eile a láimhseálann é", items: [
        "Óstálann Railway an suíomh gréasáin agus an bunachar sonraí, ar fhreastalaithe san Ísiltír. Comhlacht Meiriceánach é Railway Corp.",
        "Stórálann Cloudflare na taifeadtaí agus na grianghraif ina stóras AE, agus reáchtálann sé ár bhfearann. Seiceálann a Workers AI gach grianghraf agus déanann sé an tras-scríbhinn meaisín de thaifeadadh; d'fhéadfadh sé sin rith lasmuigh den AE.",
        "Léann Anthropic (SAM) an scéal scríofa, na hainmneacha agus fotheidil na ngrianghraf, agus an tras-scríbhinn meaisín, agus cuireann sé bratach ar aon rud ar cheart do dhuine féachaint air go cúramach. I gcás scéil i dteanga seachas Béarla nó Gaeilge, scríobhann sé an leagan Béarla a thaispeántar in aice leis freisin. Ní dhéanann na seiceálacha ach bratach a chur; is duine a shocraíonn.",
        "Seolann Zoho (AE) ár ríomhphoist, mar shampla an nasc príobháideach.",
        "Soláthraíonn OpenFreeMap íomhánna na léarscáile. Nuair a osclaíonn tú an léarscáil, faigheann do bhrabhsálaí iad ó OpenFreeMap, a fheiceann do sheoladh idirlín. Ní théann aon sonraí scéil chuige.",
        "Braitheann aistrithe lasmuigh den AE ar na cosaintí i dtéarmaí próiseála sonraí gach comhlachta: clásail chonarthacha chaighdeánacha an AE, nó Creat Príobháideachta Sonraí AE-SAM.",
        "Gan fógraíocht, gan anailísíocht, gan rianú. Ní dhíoltar aon rud agus ní roinntear é chun aon chuspóra eile.",
      ] },
      { h: "Cá fhad", items: [
        "Coinnítear scéal agus a shonraí mar chuid den bhailiúchán go dtí go mbaineann an teaghlach é. Má ghlacann Cnuasach Bhéaloideas Éireann leis an mbailiúchán, coinníonn sé go buan é.",
        "Nuair a bhaintear scéal, scriostar a thaifeadtaí agus a ghrianghraif, agus glantar a théacs, na hainmneacha, na haoiseanna, an scoil, an rang, an ríomhphost agus an méarlorg idirlín. Is é an méid a fhanann ná nóta gur baineadh scéal leis an uimhir sin: a dhátaí, a cheannteideal, an contae agus an baile fearainn, agus gur tugadh toiliú. Gan ainmneacha, gan focail.",
        "Coinnítear cuntais mhúinteoirí agus léitheoirí fad atá siad in úsáid, agus déantar iad a anaithniú 12 mhí tar éis iad a úsáid go deireanach. Coinnítear taifead ar chinntí na deisce ar feadh 3 bliana.",
      ] },
      { h: "Do chearta", items: [
        "Taispeánann nasc príobháideach an teaghlaigh an scéal, priontálann sé é agus baineann sé é tráth ar bith, gan cheist.",
        "Is féidir leat iarraidh orainn freisin an méid atá againn a fheiceáil, a cheartú nó a scriosadh, nó do thoiliú a tharraingt siar, trí ríomhphost a chur chuig hello@rawbyte.ie. Freagraímid laistigh de mhí. Ní chuireann tarraingt siar an toilithe ar ceal an méid a bhí dleathach roimhe.",
        "Má tá scéal imithe chuig Cnuasach Bhéaloideas Éireann cheana, cuirimid an iarraidh bhainte ar aghaidh chucu.",
        "Is féidir leat gearán a dhéanamh leis an gCoimisiún um Chosaint Sonraí ag dataprotection.ie.",
      ] },
      { h: "Fianáin", p: "Ceann amháin, agus sin amháin má athraíonn tú teanga: cuimhníonn sé ar Bhéarla nó ar Ghaeilge ar feadh bliana. Faigheann múinteoirí agus léitheoirí a shíníonn isteach sa deasc léitheoireachta fianán síniú isteach. Faic eile." },
    ],
    contact: "Ceisteanna, nó aon rud le baint:",
  },
};

export default async function Privacy() {
  const { lang } = await getDict(), x = TEXT[lang];
  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <section>
        <div className="kicker">{x.kicker}</div>
        <h1>{x.h1}</h1>
        <p className="lead">{x.lead}</p>
        <p className="muted small">{x.updated}: {UPDATED[lang]}</p>
      </section>
      {x.sections.map(s => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.p && <p>{s.p}</p>}
          {s.items && <ul style={{ lineHeight: 1.8 }}>{s.items.map(i => <li key={i}>{i}</li>)}</ul>}
        </section>
      ))}
      <section><p>{x.contact} {mail}.</p></section>
    </main>
  );
}
