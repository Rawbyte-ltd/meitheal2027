import { pageMeta } from "@/lib/seo";
import { getDict } from "@/lib/lang";

export async function generateMetadata() { const ga = (await getDict()).lang === "ga"; return pageMeta(ga ? "Faoi Mheitheal 2027" : "About Meitheal 2027", ga ? "Cén fáth Bailiúchán na Scol a dhéanamh arís, nócha bliain ina dhiaidh: cé atá taobh thiar de, conas a léitear gach scéal, agus cá rachaidh an bailiúchán." : "Why do the 1937 Schools' Collection again, ninety years on: who is behind it, how every story is read, and where the collection goes."); }

const mail = <a href="mailto:hello@rawbyte.ie">hello@rawbyte.ie</a>;

const TEXT = {
  en: {
    kicker: "About", h1a: "Why ", h1em: "again", h1b: ", and why now",
    lead: "Between 1937 and 1939 the Irish Folklore Commission, the Department of Education and the INTO asked the senior classes of 5,000 national schools to collect what the old people knew. 100,000 children filled 740,000 pages. It is the largest folklore collection gathered by children anywhere, and it is online at dúchas.ie. The people who told those stories were born in the 1850s and 1860s. The people who could tell the next chapter, the ones who remember the Emergency, the power coming, the dance halls and the boat, are in their eighties and nineties now. One person in five living in Ireland today was born somewhere else: in 1937 the children wrote down who left, and in 2027 they can write down who came. Census 2027 is on 9 May. A meitheal is a gathering of neighbours to get a job done in a day. This is that.",
    what: "What we collect, and what we do not",
    whatList: [
      "A story, in the teller's words, under a heading, collected in a townland in one of the 26 counties that took part in 1937. The story itself can be from anywhere: a grandparent in Lublin or Lagos on a video call counts, and so does the story of how a family came here. Optionally a recording, and up to four photographs of things and places.",
      "Any language. English and Irish are the site's own; a story told in Polish, Portuguese or Yoruba is kept as told, with an English version made by machine beside it and marked as such, so the person who reads it can read it.",
      "The teller's first name, decade of birth and relation to the collector. The collector's first name and age band. The townland, and the far place if there is one. The school if there is one.",
      "Not collected: surnames, addresses, dates of birth, health details, photographs of children. If a story names another living person by surname, it is sent back.",
    ],
    privacy: "Privacy and consent",
    privacyList: [
      "An adult ticks the consent box on every story and gives their first name. If an email is given it is used only to resend the keeper link, and it is deleted if the story is removed.",
      "Nothing is public until a person has read it. The family holds a keeper link that shows, prints and removes the story at any time, no questions asked.",
      "Recordings are stored privately and played only from the public story page once approved, or from the keeper page.",
      "Anyone can flag a story. Two flags take it off the map until it is read again.",
      "The collection is offered, with the consent given above, to the National Folklore Collection at UCD for permanent preservation. Until that is agreed, we hold it. Machine checks run on it before a person reads it, some of them outside the EU; the privacy page says who handles what, and where.",
    ],
    questions: "Questions or removal requests:", full: "The full privacy notice",
    free: "Free, and funded how",
    freeBody: "Taking part costs nothing and never will, for families, schools or community groups. The project is seeking support under the Heritage Council's Community Heritage Grant (Digital Heritage, Access and Storytelling), the Creative Ireland Creative Communities programme and Foras na Gaeilge, and partnership with the National Folklore Collection, the Department of Education and the CSO's Census 2027 schools programme. If a printed, bound copybook of a family's or a school's stories is ever offered, it will be a one-off at cost, and the stories themselves stay free.",
    credits: "Credits",
    creditsBody: "Built by RawByte in Co. Cavan. Townland names from townlands.ie (OpenStreetMap contributors, ODbL) and Logainm. Map tiles by OpenFreeMap. Archive photographs from the National Library of Ireland on The Commons. The 1937 headings are adapted from the National Folklore Collection's Schools' Collection topic list. Not affiliated with UCD, the Department of Education or dúchas.ie.",
  },
  ga: {
    kicker: "Faoin tionscadal", h1a: "Cén fáth ", h1em: "arís", h1b: ", agus cén fáth anois",
    lead: "Idir 1937 agus 1939 d'iarr Coimisiún Béaloideasa Éireann, an Roinn Oideachais agus Cumann Múinteoirí Éireann ar ardranganna 5,000 scoil náisiúnta a raibh ar eolas ag na seandaoine a bhailiú. Líon 100,000 páiste 740,000 leathanach. Is é an bailiúchán béaloidis is mó dá bhfuil ann a bhailigh páistí, agus tá sé ar líne ar dúchas.ie. Rugadh na daoine a d'inis na scéalta sin sna 1850idí agus sna 1860idí. Tá na daoine a d'fhéadfadh an chéad chaibidil eile a insint, iad siúd a chuimhníonn ar an Éigeandáil, ar an leictreachas ag teacht, ar na hallaí rince agus ar an mbád, ina n-ochtóidí agus ina nóchaidí anois. Rugadh duine as gach cúigear atá ina gcónaí in Éirinn inniu in áit éigin eile: in 1937 scríobh na páistí síos cé a d'imigh, agus in 2027 is féidir leo scríobh síos cé a tháinig. Beidh Daonáireamh 2027 ann ar an 9 Bealtaine. Is éard is meitheal ann ná comharsana ag teacht le chéile chun jab a dhéanamh in aon lá amháin. Sin é seo.",
    what: "Cad a bhailímid, agus cad nach mbailímid",
    whatList: [
      "Scéal, i bhfocail an scéalaí, faoi cheannteideal, a bailíodh i mbaile fearainn i gceann de na 26 contae a ghlac páirt in 1937. Is féidir leis an scéal féin a bheith ó áit ar bith: tá seantuismitheoir i Lublin nó i Lagos ar ghlao físe chomh maith le duine ar bith, agus scéal faoin gcaoi ar tháinig teaghlach anseo freisin. Más mian leat, taifeadadh, agus suas le ceithre ghrianghraf de rudaí agus d'áiteanna.",
      "Teanga ar bith. Is iad an Béarla agus an Ghaeilge teangacha an tsuímh féin; coinnítear scéal a insítear i bPolainnis, i bPortaingéilis nó in Iarúibis mar a insíodh é, le leagan Béarla a rinne meaisín in aice leis agus é marcáilte mar sin, ionas gur féidir leis an duine a léann é é a léamh.",
      "Céadainm an scéalaí, na deich mbliana inar rugadh é nó í agus a ghaol nó a gaol leis an mbailitheoir. Céadainm agus aoisghrúpa an bhailitheora. An baile fearainn, agus an áit i gcéin más ann di. An scoil, más ann di.",
      "Ní bhailítear: sloinnte, seoltaí, dátaí breithe, sonraí sláinte, grianghraif de pháistí. Má ainmníonn scéal duine beo eile le sloinne, cuirtear ar ais é.",
    ],
    privacy: "Príobháideacht agus toiliú",
    privacyList: [
      "Cuireann duine fásta tic sa bhosca toilithe ar gach scéal agus tugann a chéadainm nó a céadainm. Má thugtar ríomhphost, ní úsáidtear é ach chun an nasc príobháideach a sheoladh arís, agus scriostar é má bhaintear an scéal.",
      "Níl aon rud poiblí go dtí go léann duine é. Bíonn nasc príobháideach ag an teaghlach a thaispeánann, a phriontálann agus a bhaineann an scéal tráth ar bith, gan cheist.",
      "Stóráiltear taifeadtaí go príobháideach agus ní sheinntear iad ach ó leathanach poiblí an scéil nuair a cheadaítear é, nó ón leathanach príobháideach.",
      "Is féidir le duine ar bith bratach a chur ar scéal. Baineann dhá bhratach den léarscáil é go dtí go léitear arís é.",
      "Tairgtear an bailiúchán, leis an toiliú thuas, do Chnuasach Bhéaloideas Éireann in UCD le caomhnú go buan. Go dtí go n-aontaítear é sin, coinnímidne é. Ritheann seiceálacha meaisín air sula léann duine é, cuid acu lasmuigh den AE; deir an leathanach príobháideachta cé a láimhseálann cad, agus cá háit.",
    ],
    questions: "Ceisteanna nó iarratais ar bhaint:", full: "An fógra príobháideachta iomlán",
    free: "Saor in aisce, agus maoinithe conas",
    freeBody: "Níl aon chostas ar pháirt a ghlacadh agus ní bheidh go deo, do theaghlaigh, do scoileanna ná do ghrúpaí pobail. Tá an tionscadal ag lorg tacaíochta faoi Dheontas Oidhreachta Pobail na Comhairle Oidhreachta (Oidhreacht Dhigiteach, Rochtain agus Scéalaíocht), clár Pobail Chruthaitheacha Éire Ildánach agus Foras na Gaeilge, agus comhpháirtíocht le Cnuasach Bhéaloideas Éireann, leis an Roinn Oideachais agus le clár scoileanna Dhaonáireamh 2027 na Príomh-Oifige Staidrimh. Má thairgtear cóipleabhar priontáilte ceangailte de scéalta teaghlaigh nó scoile riamh, is ar phraghas costais a bheidh sé, agus fanfaidh na scéalta féin saor in aisce.",
    credits: "Buíochas",
    creditsBody: "Tógtha ag RawByte i gCo. an Chabháin. Ainmneacha na mbailte fearainn ó townlands.ie (rannpháirtithe OpenStreetMap, ODbL) agus ó Logainm. Tíleanna léarscáile ó OpenFreeMap. Seanghrianghraif ó Leabharlann Náisiúnta na hÉireann (The Commons). Tá ceannteidil 1937 bunaithe ar liosta ábhar Bhailiúchán na Scol de chuid Chnuasach Bhéaloideas Éireann. Níl baint aige le UCD, leis an Roinn Oideachais ná le dúchas.ie.",
  },
};

export default async function About() {
  const { lang } = await getDict(), x = TEXT[lang];
  return (
    <main className="wrap" style={{ maxWidth: 820 }}>
      <section>
        <div className="kicker">{x.kicker}</div>
        <h1>{x.h1a}<em>{x.h1em}</em>{x.h1b}</h1>
        <p className="lead">{x.lead}</p>
      </section>
      <section>
        <h2>{x.what}</h2>
        <ul style={{ lineHeight: 1.8 }}>{x.whatList.map(l => <li key={l}>{l}</li>)}</ul>
      </section>
      <section id="privacy">
        <h2>{x.privacy}</h2>
        <ul style={{ lineHeight: 1.8 }}>{x.privacyList.map(l => <li key={l}>{l}</li>)}<li>{x.questions} {mail}.</li><li><a href="/privacy">{x.full}</a>.</li></ul>
      </section>
      <section>
        <h2>{x.free}</h2>
        <p className="lead">{x.freeBody}</p>
      </section>
      <section>
        <h2>{x.credits}</h2>
        <p className="muted">{x.creditsBody}</p>
      </section>
    </main>
  );
}
