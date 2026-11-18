/**
 * English and Irish. The visitor picks with the switch in the header (or ?lang=ga), the choice is kept in the `lang`
 * cookie (src/proxy.ts sets it), and server pages read it with getLang() from ./lang.ts. Client components take a
 * `lang` prop and use dict() from here. Long prose (About, the schools pack, how to collect) lives in its page as
 * two blocks rather than in here. The Irish is in the standard (An Caighdeán) and wants a native speaker's read.
 */
import { topicBySlug, type Topic } from "./topics";

export type Lang = "en" | "ga";
/** Bump this whenever the consent wording (form.consent below) changes; each story records the version and language it was given under (migrations/012). */
export const CONSENT_VERSION = "web-2026-11-04";
export const isLang = (v: unknown): v is Lang => v === "en" || v === "ga";

/** Nominative (for a county on its own) and genitive (after "Contae") forms, from logainm.ie. */
const COUNTY_GA: Record<string, [string, string]> = { Carlow: ["Ceatharlach", "Cheatharlach"], Cavan: ["An Cabhán", "an Chabháin"],
  Clare: ["An Clár", "an Chláir"], Cork: ["Corcaigh", "Chorcaí"], Donegal: ["Dún na nGall", "Dhún na nGall"], Dublin: ["Baile Átha Cliath", "Bhaile Átha Cliath"], Galway: ["Gaillimh", "na Gaillimhe"],
  Kerry: ["Ciarraí", "Chiarraí"], Kildare: ["Cill Dara", "Chill Dara"], Kilkenny: ["Cill Chainnigh", "Chill Chainnigh"], Laois: ["Laois", "Laoise"],
  Leitrim: ["Liatroim", "Liatroma"], Limerick: ["Luimneach", "Luimnigh"], Longford: ["An Longfort", "an Longfoirt"], Louth: ["Lú", "Lú"],
  Mayo: ["Maigh Eo", "Mhaigh Eo"], Meath: ["An Mhí", "na Mí"], Monaghan: ["Muineachán", "Mhuineacháin"], Offaly: ["Uíbh Fhailí", "Uíbh Fhailí"],
  Roscommon: ["Ros Comáin", "Ros Comáin"], Sligo: ["Sligeach", "Shligigh"], Tipperary: ["Tiobraid Árann", "Thiobraid Árann"],
  Waterford: ["Port Láirge", "Phort Láirge"], Westmeath: ["An Iarmhí", "na hIarmhí"], Wexford: ["Loch Garman", "Loch Garman"], Wicklow: ["Cill Mhantáin", "Chill Mhantáin"],
};
/** The county by itself: "Cavan" or "An Cabhán". */
export const countyName = (c: string, l: Lang) => (l === "ga" ? COUNTY_GA[c]?.[0] : undefined) ?? c;
/** "Co. Cavan" or "Co. an Chabháin". */
export const coOf = (c: string, l: Lang) => l === "ga" && COUNTY_GA[c] ? `Co. ${COUNTY_GA[c][1]}` : `Co. ${c}`;
/** The townland in the visitor's language when it has an Irish name. */
export const townlandName = (en: string, ga: string | null | undefined, l: Lang) => (l === "ga" && ga ? ga : en);
/** "Lublin, Poland" for a story from outside Ireland (migrations/010), or null. */
export const farOf = (s: { from_place?: string | null; from_country?: string | null }) => [s.from_place, s.from_country].filter(Boolean).join(", ") || null;
export const placeOf = (s: { townland_en: string; townland_ga?: string | null; county: string; from_place?: string | null; from_country?: string | null }, l: Lang) => `${farOf(s) ? `${farOf(s)} · ` : ""}${townlandName(s.townland_en, s.townland_ga, l)}, ${coOf(s.county, l)}`;
/** The html lang of a story's text: Irish, English, or unknown for a story in another language. */
export const langAttr = (lang: string) => lang === "ga" ? "ga" : lang === "other" ? undefined : "en-IE";

/** Irish prompts for the headings, by slug. */
const PROMPT_GA: Record<string, string> = {
  "ghosts-and-fairies": "An raibh lios, sceach aonair nó teach ann nach rachadh éinne thairis san oíche? Cad a deirtí faoi?",
  "local-cures": "Cé aige a raibh an leigheas ar fhaithní, ar leonadh, ar an triuch? Cad a dhéanaidís?",
  "hidden-treasure": "Ar dúradh riamh go raibh ór curtha in aice láimhe? Ar thochail éinne ar a lorg?",
  "weather-lore": "Conas a bhí a fhios ag daoine go raibh báisteach chucu? Cad iad na comharthaí a léidís sa spéir, sna hainmhithe, sna cnoic?",
  "severe-weather": "An Sneachta Mór, Oíche na Gaoithe Móire, an tuile. Cad a tharla agus cé a bhí sáinnithe cá háit?",
  "festival-customs": "Cad a dhéantaí Lá Fhéile Bríde, Oíche Shamhna, Oíche Nollag, Oíche Bhealtaine, Oíche Fhéile Eoin?",
  "games-i-play": "Cad iad na cluichí a d'imrítí sa chlós, ar an mbóthar, sa pháirc? Cad iad na rialacha agus na rainn?",
  "the-local-forge": "Cá raibh an cheárta, an muileann, an uachtarlann, an siopa? Cé a bhí i mbun agus cad a tharlaíodh ann?",
  "old-schools": "Conas a bhí an scoil? An máistir, an siúl, an scláta, an bata, an fód móna don tine?",
  "the-famine": "Cad a deirtí sa teaghlach faoin nGorta, faoi theach na mbocht, faoin anraith, faoi na daoine a d'imigh?",
  "emigration": "Cé a chuaigh go Meiriceá, go Sasana, go dtí an Astráil? Ar tháinig siad ar ais? An raibh tórramh Meiriceánach ann?",
  "local-heroes": "Cé ba láidre, ba sciobtha, ba ghreannmhaire, an duine a mbíonn caint air fós?",
  "place-names": "Cad is ainm do na páirceanna, na toibreacha, na cnoic agus na crosbhóithre, agus cén fáth?",
  "proverbs-riddles": "Cad iad na seanfhocail a bhíodh ag do sheantuismitheoirí? Cad iad na tomhaiseanna a chuirtí cois tine?",
  "food": "Cad a d'ití, a bhácáiltí, a dhéantaí sa chuinneog, a shaillítí? Cad a bhí don dinnéar Domhnaigh? Cé a mharaigh an mhuc?",
  "crafts": "Tuíodóireacht, ciseáin, móin a bhaint agus a chnuchairt, féar a shábháil, sníomh. Cé a rinne é agus conas?",
  "marriage-customs": "Conas a bhuail daoine le chéile? Conas a bhí tórramh? An raibh babhtaí cleamhnais, buachaillí tuí, mná caointe ann?",
  "animals": "Cad a chreidtí faoin ngiorria, faoin snag breac, faoin spideog, faoin gcuach, faoin gcéad uan?",
  "funny-story": "An ceann a insítear fós faoi Nollaig. Inis é mar a insíonn siadsan é.",
  "the-day-the-power-came": "An Scéim Leictreachais Tuaithe, an chéad bholgán, an chéad teilifís, an chéad chuisneoir. Cé a chuimhníonn air?",
  "the-phone-and-the-car": "An chéad ghuthán sa bhaile fearainn, an chéad charr, an lá ar cuireadh tarra ar an mbóthar, an bus go dtí an baile mór.",
  "working-away": "Foirgnimh Londan, beáir Bhostún, na báid, an mhonarcha. Conas a bhí sé agus cad a cuireadh abhaile?",
  "dancing-and-courting": "An halla rince, an t-ollphuball, an seóbhanna, an siúl abhaile. Conas a bhuail siad le do sheanmháthair?",
  "big-snow": "1947, 1963, 1982, 2010, Ophelia, Éowyn. Cá raibh siad agus cad a rinne siad le haghaidh uisce agus aráin?",
  "the-match": "Cluiche ceannais an chontae, an iomaíocht idir paróistí, an lá a shroich siad Páirc an Chrócaigh, an achrann ina dhiaidh.",
  "the-spring-of-2020": "Cá raibh siad nuair a stad an tír? Cé a d'fhág na earraí ag an doras?",
  "coming-to-ireland": "Cad as ar tháinig an teaghlach, agus cén fáth? Cén chuma a bhí ar an gcéad lá anseo, cad a thug siad leo, agus cad a airíonn siad uathu?",
  "what-to-remember": "Cuir an cheist go díreach: cad ba cheart do mhuintir 2117 a bheith ar eolas acu faoin áit seo agus faoin teaghlach seo?",
};
export const topicName = (t: Pick<Topic, "name" | "ga">, l: Lang) => (l === "ga" ? t.ga : t.name);
/** The other language's name, shown small beside the main one. */
export const topicOther = (t: Pick<Topic, "name" | "ga">, l: Lang) => (l === "ga" ? t.name : t.ga);
export const topicPrompt = (t: Pick<Topic, "slug" | "prompt">, l: Lang) => (l === "ga" ? PROMPT_GA[t.slug] ?? t.prompt : t.prompt);

const REL_GA: Record<string, string> = { grandmother: "seanmháthair", grandfather: "seanathair", "great-grandparent": "sin-seantuismitheoir", mother: "máthair", father: "athair", "aunt or uncle": "aintín nó uncail", neighbour: "comharsa", "family friend": "cara clainne", other: "eile" };
const AGE_GA: Record<string, string> = { "under 8": "faoi 8", "8 to 9": "8 go 9", "10 to 12": "10 go 12", "13 to 15": "13 go 15", "16 to 18": "16 go 18", adult: "duine fásta" };
export const relationLabel = (r: string, l: Lang) => (l === "ga" ? REL_GA[r] ?? r : r);
export const ageLabel = (a: string, l: Lang) => (l === "ga" ? AGE_GA[a] ?? a : a);
/** "1940s" as "the 1940s" / "na 1940idí"; "later" as later. */
export const decadeLabel = (d: string, l: Lang) => l === "ga" ? (d === "later" ? "níos déanaí" : d.replace(/s$/, "idí")) : d;
export const bornIn = (d: string | null | undefined, l: Lang) => !d ? "" : l === "ga" ? (d === "later" ? ", a rugadh níos déanaí" : `, a rugadh sna ${decadeLabel(d, l)}`) : (d === "later" ? ", born later" : `, born in the ${d}`);

type S = { teller_name: string; teller_born: string | null; collector_name: string; school: string | null };
/** "Told by Mary, born in the 1940s, to Saoirse of St Brigid's NS." */
export const toldBy = (s: S, l: Lang) => l === "ga"
  ? `Inste ag ${s.teller_name}${bornIn(s.teller_born, l)}. Bailithe ag ${s.collector_name}${s.school ? `, ${s.school}` : ""}.`
  : `Told by ${s.teller_name}${bornIn(s.teller_born, l)}, to ${s.collector_name}${s.school ? ` of ${s.school}` : ""}.`;

/** The heading of a story in the visitor's language: an own heading as written, a known one by its name. */
export const headingIn = (s: { topic: string; topic_custom: string | null }, l: Lang) => {
  if (s.topic === "custom") return s.topic_custom ?? dict(l).common.ownHeading;
  const t = topicBySlug(s.topic); return t ? topicName(t, l) : s.topic;
};
export const langName = (v: string, l: Lang) => ({ en: l === "ga" ? "Béarla" : "English", ga: "Gaeilge", both: l === "ga" ? "Gaeilge agus Béarla" : "Gaeilge & English", other: l === "ga" ? "Teanga eile" : "Another language" } as Record<string, string>)[v] ?? v;
/** The language a story is in, by name: "Polish" when the family named one. */
export const langOf = (s: { lang: string; lang_other?: string | null }, l: Lang) => s.lang === "other" && s.lang_other ? s.lang_other : langName(s.lang, l);
export const dateLong = (iso: string, l: Lang, withDay = false) => new Date(iso).toLocaleDateString(l === "ga" ? "ga-IE" : "en-IE", withDay ? { dateStyle: "long" } : { year: "numeric", month: "long" });

const en = {
  nav: { stories: "Stories", places: "Places", people: "People", topics: "Topics", map: "Map", collect: "How to collect", schools: "Schools", about: "About", add: "Add a story", other: "Gaeilge", otherLang: "ga" as Lang, otherLabel: "Léigh an suíomh as Gaeilge" },
  foot: {
    free: "Meitheal 2027 is free for every family, school and community group, and always will be. It is a RawByte project seeking partners among the bodies that made the 1937 Schools' Collection: the National Folklore Collection at UCD, the Department of Education, the INTO, and the county heritage and Creative Ireland officers. Not affiliated with any of them yet.",
    published: "Stories are published only after a person reads them, with first names, a decade of birth and a townland. The original 1937 collection is at", photos: "Archive photographs from the", nli: "National Library of Ireland on The Commons", photosTail: "no known copyright restrictions.", names: "Townland names from", privacy: "Privacy and consent", contact: "Contact", built: "Built by", builtTail: "in Cavan",
  },
  meta: { title: "Meitheal 2027: the Schools' Collection, done again", description: "In 1937 a hundred thousand Irish schoolchildren wrote down their grandparents' stories, townland by townland. Ninety years on, we are doing it again. Free for every family and school." },
  home: {
    kicker: "Bailiúchán na Scol, 1937 · 2027", h1a: "Ask them ", h1em: "before", h1b: " the stories go.",
    lead: "In 1937 a hundred thousand schoolchildren sat down with a grandparent and a copybook and wrote down what the old people knew. Ninety years on, we are doing it again. Free, for every family and every school.",
    add: "Add a story", record: "Record one", search: "Search the collection: a word, a name, a townland…", index: "Index",
    bandH2a: "The children were the ", bandH2em: "collectors.",
    band: "The Irish Folklore Commission and the teachers handed the job to the pupils, because the pupils could sit at the fire and ask. It worked: over half a million pages, read every day on dúchas.ie. The people who remember the power coming, the dance halls and the boat to England are in their eighties and nineties now. The children are ready again, and they all have a recorder in their pocket.",
    howTo: "How to sit down with a grandparent",
    stats: { stories: "stories", townlands: "townlands with a voice", audio: "recordings", photos: "photographs", schools: "schools and groups", words: "words saved" },
    addRec: "Add a recording", addPhoto: "Add a photograph",
    worldA: "The world they ", worldEm: "remember", world: "The turf, the fair, the walk to school. Your grandparents grew up closer to these pictures than to ours. Ask them what is missing from them.",
    latest: "Latest from the copybooks", examplesH: "Examples from the 1937 Schools' Collection",
    firstYet: (n: number) => `The first stories are on their way. Until they are read and published, the ${n} below are from the 1937–38 Schools' Collection, to show what a story looks like. They are marked 1937 and are not counted as Meitheal's.`, all: "All stories", how: "How it works",
    steps: [
      ["1. Pick a heading", "The headings the children were given in 1937, the ones ninety years adds, or one of your own."],
      ["2. Sit down and listen", "Record on the phone, take a photograph of the thing itself, or write it down in their words. Ten minutes is plenty. First names only."],
      ["3. Put it on the map", "Pick the townland it was collected in. If the story itself is from Lublin or Lagos, say so: how a family came here is a story of here too. A person reads every story before it goes public, and the family keeps a link to it forever."],
      ["4. Keep it for 2117", "Everything collected is offered to the National Folklore Collection, so the children of 2117 can read it the way we read 1937."],
    ] as [string, string][],
  },
  place: { townland: "Townland", town: "Town", village: "Village", city: "City" } as Record<string, string>,
  common: {
    stories: (n: number) => `${n} stor${n === 1 ? "y" : "ies"}`, newer: "← Newer", older: "Older →", collectThis: "Collect this one", collectOne: "Collect one", all: "All",
    nothingYet: "Nothing here yet.", beFirst: "Be the first in this corner of the collection.", ownHeading: "Our own heading", place: "Townland", born: "Born", teller: "Teller",
  },
  stories: { title: "The stories", kicker: "The copybooks", h1a: "What the old people ", h1em: "said", search: "Search", placeholder: "a word, a name, a townland" },
  places: { title: "Places", kicker: "Places · Áiteanna", h1a: "County by county, ", h1em: "townland by townland", leadA: "Every story belongs to a townland. Pick a county, then a townland, or ", leadLink: "open the map", leadB: ".", far: "Far places", farLead: "Stories from outside Ireland, told to children here. One person in five living in Ireland was born somewhere else. In 1937 the children wrote down who left; in 2027 they can write down who came." },
  county: { kicker: "County", soFar: "so far.", examples: (n: number) => `Shown below as well: ${n} ${n === 1 ? "example" : "examples"} from the 1937 Schools' Collection, marked 1937.`, schools: "Schools and groups taking part:", townlands: "Townlands", nothing: (c: string) => `Nothing from ${c} yet.`, start: "Start it." },
  townland: { kicker: "Townland", add: "Add a story from here", duchas: "1938: what the children wrote ↗", onMap: "On the map", nothing: (t: string) => `No story from ${t} yet. In 1937 there probably was one. Be the 2027 one.` },
  people: { title: "People", kicker: "People · Daoine", teller: "Teller", h1a: "The ones who ", h1em: "told", h1b: " it", lead: "Tellers by first name, decade of birth and townland. No surnames, by design.", none: "Nobody under that letter yet.", of: "Of", bornIn: (d: string) => `Born in the ${d}. ` },
  topics: { title: "Topics", kicker: "Topics · Ábhair", h1a: "The ", h1em: "headings", lead: "Nineteen from 1937, nine from the ninety years since, and the ones people made up themselves.", own: "Our own headings", noneOwnA: "None yet. Pick “Our own heading” when you ", noneOwnLink: "add a story", noneOwnB: "." },
  topic: { kicker: "Heading", none: "No story under this heading yet." },
  titles: { title: "Titles A to Z", kicker: "Index · Innéacs", h1a: "Every title, ", h1em: "A to Z", none: (l: string) => `Nothing under ${l} yet.` },
  collection: { kicker: "Collection", addPhoto: "Add a photograph", addRec: "Add a recording", add: "Add a story", noPhotos: "No photographs yet.", noRecs: "No recordings yet.", addFirst: "Add the first.", empty: "Nothing in this collection yet.", recordedBy: "recorded by" },
  collections: { schools: "Collected by children from their elders, as in 1937. The heart of the project.", main: "Collected by adults: families, historical societies, Men's Sheds, active retirement groups.", photo: "Every photograph in the collection, with the story behind it: the forge, the churn, the ration book, the road before it was tarred.", audio: "The voices themselves. Every recording in the collection, with a note of what is on it." } as Record<string, string>,
  story: {
    title: "Story", toldBy: "Told by", ofCollector: (r: string) => `, ${r} of the collector`, collectedBy: "Collected by", flagged: "Thanks. Someone will read it again.",
    from: "From", inLang: (l: string) => `Told in ${l}`, inEnglish: "In English", machineNote: "Put into English by machine from the story above. The original is the record; if the English is wrong, say so with the link below.",
    more: (h: string) => `More under “${h}”`, moreFrom: (n: string) => `More from ${n}`, duchas: "What the children wrote here in 1938 ↗",
    wrong: "Something wrong with this story?", tell: "Tell us", tellPh: "It names a living person / it is not suitable / it is mine and I want it down", send: "Send", moreHere: (t: string) => `More from ${t}`,
    og: (teller: string, collector: string) => `Told by ${teller} to ${collector}.`,
    writtenOut: "Written out", writtenNote: "From the recording, checked by a person.",
  },
  lost: {
    title: "Lost your keeper link?", kicker: "Your keeper page", h1a: "Lost your ", h1em: "keeper link?",
    lead: "Enter the adult's email you gave with the story and we will send a fresh link for every story under it. The old link stops working.",
    email: "Adult's email", send: "Send me a new link",
    sent: "If we have that address, an email is on its way. Check the spam folder too.",
    nomail: "Email is not switched on yet. Write to hello@rawbyte.ie with the story's title and we will send the link by hand.",
    foot: "Lost your keeper link?",
    mailSubject: "Meitheal 2027: your keeper link", mailIntro: "Here is a fresh keeper link for each story under this email. Keep this message: the link is the only way back to your story, and the old link no longer works.", mailNone: "No story is kept under this email. If you think there should be, write to hello@rawbyte.ie.",
  },
  book: {
    cover: "The Schools' Collection, ninety years on", teacher: "Teacher", cls: "Class", stories: (n: number) => `${n} ${n === 1 ? "story" : "stories"}`,
    intro: "In 1937 and 1938 the children of schools all over Ireland wrote down what the old people knew: stories, cures, customs, games and the names of the fields. Their copybooks became the Schools' Collection, which is read every day on dúchas.ie. Ninety years on, this class did the same. Each story here was told by an older relative or neighbour, recorded or written down by a child, and read by a person before it went into this book.",
    contents: "In this copybook", townlands: "The places in this copybook", hear: "Hear it: scan the code", read: "Read it online", rest: "The rest is on the recording.", kept: "In this copybook only, at the family's wish",
    onRecording: "The story itself is on the recording: scan the code to hear it.",
    offered: "Collected for Meitheal 2027 (meitheal2027.ie) and offered to the National Folklore Collection, University College Dublin, to be kept for the next ninety years.",
  },
  keep: {
    title: "Your story", kicker: "Your keeper page",
    status: { pending: "Thank you. Your story is in the copybook. A person will read it, usually within a few days, and then it goes on the map. Keep this page's address: it is the only way to get back to your story.", approved: "Your story is published. Share the public link below, or print this page as a keepsake.", rejected: "This story was not published. Usually that means it names someone by surname or gives private details. Edit and resubmit it as a new story, or email us.", removed: "This story was removed.", kept: "Your story is in the class copybook, and not on the website, as you asked. If you change your mind, tell the teacher. Print this page as a keepsake." } as Record<string, string>,
    statusName: { pending: "waiting to be read", approved: "published", kept: "in the copybook only", rejected: "not published", removed: "removed" } as Record<string, string>,
    readerNote: "A note from the reader:", told: "told by", collected: "collected by", footer: (d: string) => `Meitheal 2027 · collected ${d} · ninety years after the Schools' Collection`,
    trTitle: "Written out", trSave: "Save", trSaving: "Saving…", trSaved: "Saved. A person reads it before it goes on the public page.",
    trMachine: "A machine wrote this out from the recording. It mishears words, names and places. Listen back, fix what it got wrong, and take out any surnames or addresses, then save.",
    trOwn: "Write out what is on the recording, in the teller's own words. Leave out surnames and addresses.",
    trIrish: "The machine can't write out Irish yet, so write it out yourself, in the teller's own words. Leave out surnames and addresses.",
    trWait: "The machine is still writing out the recording. Come back to this page in a few minutes, or write it out yourself now.",
    trChanged: "Your last changes are waiting to be read. Until then the public page shows the version that was read before.",
    trError: "That didn't save. Check your connection and try again.",
    trErrors: { closed: "This story can't be changed any more.", phone: "Please keep phone numbers out of it.", no_audio: "This story has no recording to write out." } as Record<string, string>,
    copy: "Copy my keeper link", copied: "Copied", print: "Print as a keepsake", open: "Open the public page", another: "Add another", remove: "Remove it",
    confirm: "Remove this story from the collection for good? The family's copy on this page goes too.", gone: "Removed. Thank you for taking part all the same.", removeFailed: "It could not be removed just now, so nothing was changed. Try again in a minute, or email hello@rawbyte.ie and we will do it.",
  },
  submit: {
    title: "Add a story", kicker: "Add a story", h1a: "Into the ", h1em: "copybook",
    lead: "First names only. An adult (parent, grandparent or teacher) ticks the consent box. A person reads every story before it is shown, and you get a private link to keep, print or delete it.",
  },
  form: {
    modes: { write: ["I wrote it down", "The 1937 way. The story in their words, typed up."], record: ["I recorded them", "Their voice, up to ten minutes, with a short note of what is on it."], photo: ["I have a photograph", "A thing or a place, and the story behind it."] } as Record<string, [string, string]>,
    bringing: "What are you bringing?", heading: "Heading", ownOption: "Our own heading…", yourHeading: "Your heading", yourHeadingHelp: "a few words, like “The creamery lorry” or “Lough Gowna in winter”. Headings that catch on appear in the index for others to use.",
    title: "Title", titleHelp: "a few words, like “The night the Shannon came into the kitchen”", titlePh: "What is this called?",
    townland: "Where are you collecting this?", townlandHelp: "your own townland, town or village, like the school in 1937. The story itself can be from anywhere in the world: say that below. Add the county if there are several of the same name.", townlandPh: "e.g. Drumlane, Cavan", change: "change",
    far: "From somewhere else?", farHelp: "if the story is from outside Ireland: the town or village it is from. A grandparent in Lublin or Lagos counts, and so does the story of how the family came here.", farPlacePh: "e.g. Lublin", farCountry: "Country", farCountryPh: "e.g. Poland",
    langOther: "Which language?", langOtherPh: "e.g. Polish", langOtherHelp: "the machine puts it into English beside the original for the person who reads it",
    bodyWrite: "The story, in their words", bodyRecord: "What is on the recording, in a few lines", bodyPhoto: "The story behind it", bodyHelp: "Irish, English or both. Paragraphs are fine.", bodyHelpLong: " Up to about 3,000 words.",
    bodyPhPhoto: "Whose it was, what it was for, what happened to it…", bodyPh: "“Well, the way it was told to me…”",
    language: "Language", recTitle: "The recording", recTitleAlt: "A recording, if you have one", recHelp: "(up to ten minutes). Record here, or upload a voice memo.", record: "● Record", stop: "■ Stop", attached: "Attached:",
    photoTitle: "The photograph", photoTitleAlt: "Photographs, if any", photoHelp: "(up to four). Things and places are grand. People only with their agreement; no photographs of children.", captionPhoto: "What is it, where, and roughly when", caption: "caption", removePhoto: "remove",
    teller: "Told by", firstName: "first name only", bornIn: "Born in the", preferNot: "prefer not to say", relation: "Who they are to the collector", collector: "Collected by",
    age: "Collector's age", ageHelp: "a child or a school puts it in the Schools' Collection; adults go in the Main Collection", school: "School or group", optional: "optional", schoolPh: "St Brigid's NS, Killeshandra", cls: "Class", clsPh: "5th class",
    email: "Adult's email", emailHelp: "private; only used to resend your keeper link", consentName: "Consenting adult's first name", consentNameHelp: "a parent, guardian, grandparent or teacher",
    consent: "I am an adult. The person who told this knows it will be published with their first name, decade of birth and townland, and is happy with that. The child who collected it is named by first name, age band and school, if there is one. No living person is named by surname and nobody is photographed without agreeing. It is checked by machine and read by a person before anything is public. It may be offered to the National Folklore Collection and kept for a hundred years.", consentLink: "How we look after it",
    send: "Add it to the collection", sending: "Sending…",
    errTownland: "Pick your own townland, where you are collecting this. If the story is from somewhere else, say so underneath.", errAudio: "Attach the recording, or switch to writing it down.", errPhoto: "Attach the photograph, or switch to writing it down.", errBig: "The recording is over 12 MB. Keep it under ten minutes.", errMic: "The microphone is not available. Upload a voice memo instead, or write the story down.", errGeneric: "Something went wrong",
  },
  api: {
    many: "That is a lot of stories for one hour. Try again later.", form: "Could not read the form", ownHeading: "Give your own heading a name", heading: "Pick a heading", townland: "Pick your own townland, where the story was collected", farCountry: "Say which country the far place is in", langOther: "Say which language the story is in",
    missingWrite: "Title, story, both first names and the consenting adult are needed", missingOther: "Title, a short note, both first names and the consenting adult are needed", consent: "The consent box must be ticked by an adult",
    phone: "Please keep phone numbers out of the story", audioBig: "Recording over 12 MB", notAudio: "That file is not audio", photoBig: "A photo is over 6 MB", photoType: "Photos must be JPEG, PNG or WebP", photoMany: "Up to four photographs",
    needAudio: "Attach the recording, or switch to writing it down", needPhoto: "Attach the photograph, or switch to writing it down", stored: "The recording or photo could not be stored. Try again, or submit without it.",
  },
  map: { title: "The map", loading: "Loading the island…", noLib: "The map library did not load.", count: (n: number) => `${n} stor${n === 1 ? "y" : "ies"} on the map. Tap one.`, none: "No stories on the map yet. Yours could be the first.", failed: "Could not load the stories.", read: "Read it" },
  gate: { title: "Private preview", kicker: "Private preview", h1a: "Not open ", h1em: "yet", lead: "Meitheal 2027 is being readied for its partners. If you were given the word, type it here.", wrong: "That is not it.", word: "The word", in: "Come in" },
  notFound: { kicker: "Not found", h1a: "That page is ", h1em: "not in the copybook", leadA: "The link may be wrong, or the story was taken down by its family. ", browse: "Browse the stories", or: " or ", home: "go home", end: "." },
};
export type Dict = typeof en;

const ga: Dict = {
  nav: { stories: "Scéalta", places: "Áiteanna", people: "Daoine", topics: "Ábhair", map: "Léarscáil", collect: "Treoir", schools: "Scoileanna", about: "Eolas", add: "Cuir scéal isteach", other: "English", otherLang: "en", otherLabel: "Read the site in English" },
  foot: {
    free: "Tá Meitheal 2027 saor in aisce do gach teaghlach, scoil agus grúpa pobail, agus beidh go deo. Is tionscadal de chuid RawByte é atá ag lorg comhpháirtithe i measc na n-eagraíochtaí a rinne Bailiúchán na Scol 1937: Cnuasach Bhéaloideas Éireann in UCD, an Roinn Oideachais, CMÉ, agus oifigigh oidhreachta agus Éire Ildánach na gcontaetha. Níl sé ceangailte le haon cheann acu fós.",
    published: "Ní fhoilsítear scéal go dtí go léann duine é, le céadainmneacha, deich mbliana breithe agus baile fearainn. Tá bunbhailiúchán 1937 ar", photos: "Seanghrianghraif ó", nli: "Leabharlann Náisiúnta na hÉireann (The Commons)", photosTail: "gan aon srian cóipchirt ar eolas.", names: "Ainmneacha na mbailte fearainn ó", privacy: "Príobháideacht agus toiliú", contact: "Teagmháil", built: "Tógtha ag", builtTail: "sa Chabhán",
  },
  meta: { title: "Meitheal 2027: Bailiúchán na Scol, arís", description: "Sa bhliain 1937 scríobh céad míle páiste scoile in Éirinn scéalta a seantuismitheoirí síos, baile fearainn ar bhaile fearainn. Nócha bliain ina dhiaidh sin, táimid á dhéanamh arís. Saor in aisce do gach teaghlach agus scoil." },
  home: {
    kicker: "Bailiúchán na Scol, 1937 · 2027", h1a: "Cuir ceist orthu ", h1em: "sula", h1b: " n-imeoidh na scéalta.",
    lead: "Sa bhliain 1937 shuigh céad míle páiste scoile síos le seanmháthair nó seanathair agus le cóipleabhar, agus scríobh siad síos a raibh ar eolas ag na seandaoine. Nócha bliain ina dhiaidh sin, táimid á dhéanamh arís. Saor in aisce, do gach teaghlach agus do gach scoil.",
    add: "Cuir scéal isteach", record: "Taifead ceann", search: "Cuardaigh an bailiúchán: focal, ainm, baile fearainn…", index: "Innéacs",
    bandH2a: "Na páistí a bhí ina ", bandH2em: "mbailitheoirí.",
    band: "Thug Coimisiún Béaloideasa Éireann agus na múinteoirí an jab do na daltaí, mar d'fhéadfadh na daltaí suí cois tine agus ceist a chur. D'éirigh leis: breis is leathmhilliún leathanach, a léitear gach lá ar dúchas.ie. Tá na daoine a chuimhníonn ar an leictreachas ag teacht, ar na hallaí rince agus ar an mbád go Sasana ina n-ochtóidí agus ina nóchaidí anois. Tá na páistí réidh arís, agus tá taifeadán i bpóca gach duine acu.",
    howTo: "Conas suí síos le seantuismitheoir",
    stats: { stories: "scéalta", townlands: "bailte fearainn le guth", audio: "taifeadtaí", photos: "grianghraif", schools: "scoileanna agus grúpaí", words: "focail sábháilte" },
    addRec: "Cuir taifeadadh isteach", addPhoto: "Cuir grianghraf isteach",
    worldA: "An saol a bhfuil ", worldEm: "cuimhne acu air", world: "An mhóin, an t-aonach, an siúl ar scoil. D'fhás do sheantuismitheoirí aníos níos gaire do na pictiúir seo ná dár saolna. Fiafraigh díobh cad atá in easnamh orthu.",
    latest: "Is déanaí ó na cóipleabhair", examplesH: "Samplaí ó Bhailiúchán na Scol 1937",
    firstYet: (n: number) => `Tá na chéad scéalta ar an mbealach. Go dtí go léitear agus go bhfoilsítear iad, is ó Bhailiúchán na Scol 1937–38 na ${n} thíos, le taispeáint cén chuma atá ar scéal. Tá 1937 orthu agus ní áirítear iad mar chuid de Mheitheal.`, all: "Na scéalta ar fad", how: "Conas a oibríonn sé",
    steps: [
      ["1. Roghnaigh ceannteideal", "Na ceannteidil a tugadh do na páistí in 1937, na cinn a chuireann nócha bliain leo, nó ceann de do chuid féin."],
      ["2. Suigh síos agus éist", "Taifead ar an bhfón, tóg grianghraf den rud féin, nó scríobh síos é ina bhfocail féin. Is leor deich nóiméad. Céadainmneacha amháin."],
      ["3. Cuir ar an léarscáil é", "Roghnaigh an baile fearainn inar bailíodh é. Más ó Lublin nó ó Lagos an scéal féin, abair é: is scéal faoin áit seo é freisin an chaoi ar tháinig teaghlach anseo. Léann duine gach scéal sula bhfoilsítear é, agus coinníonn an teaghlach nasc chuige go deo."],
      ["4. Coinnigh é do 2117", "Tairgtear gach rud a bhailítear do Chnuasach Bhéaloideas Éireann, ionas gur féidir le páistí 2117 é a léamh mar a léimidne 1937."],
    ],
  },
  place: { townland: "Baile fearainn", town: "Baile mór", village: "Sráidbhaile", city: "Cathair" },
  common: {
    stories: (n: number) => n === 1 ? "1 scéal" : `${n} scéal`, newer: "← Níos nuaí", older: "Níos sine →", collectThis: "Bailigh an ceann seo", collectOne: "Bailigh ceann", all: "Iad uile",
    nothingYet: "Níl aon rud anseo fós.", beFirst: "Bí ar an gcéad duine sa chúinne seo den bhailiúchán.", ownHeading: "Ár gceannteideal féin", place: "Baile fearainn", born: "Rugadh", teller: "Scéalaí",
  },
  stories: { title: "Na scéalta", kicker: "Na cóipleabhair", h1a: "An rud a dúirt ", h1em: "na seandaoine", search: "Cuardaigh", placeholder: "focal, ainm, baile fearainn" },
  places: { title: "Áiteanna", kicker: "Áiteanna · Places", h1a: "Contae ar chontae, ", h1em: "baile fearainn ar bhaile fearainn", leadA: "Baineann gach scéal le baile fearainn. Roghnaigh contae, ansin baile fearainn, nó ", leadLink: "oscail an léarscáil", leadB: ".", far: "Áiteanna i gcéin", farLead: "Scéalta ó lasmuigh d'Éirinn, inste do pháistí anseo. Rugadh duine as gach cúigear atá ina gcónaí in Éirinn in áit éigin eile. In 1937 scríobh na páistí síos cé a d'imigh; in 2027 is féidir leo scríobh síos cé a tháinig." },
  county: { kicker: "Contae", soFar: "go dtí seo.", examples: (n: number) => `Thíos freisin: ${n} ${n === 1 ? "sampla" : "samplaí"} ó Bhailiúchán na Scol 1937, marcáilte 1937.`, schools: "Scoileanna agus grúpaí páirteach:", townlands: "Bailte fearainn", nothing: (c: string) => `Níl aon rud ó ${c} fós.`, start: "Cuir tús leis." },
  townland: { kicker: "Baile fearainn", add: "Cuir scéal as seo isteach", duchas: "1938: an rud a scríobh na páistí ↗", onMap: "Ar an léarscáil", nothing: (t: string) => `Níl aon scéal ó ${t} fós. Is dócha go raibh ceann ann in 1937. Cuir scéal 2027 isteach.` },
  people: { title: "Daoine", kicker: "Daoine · People", teller: "Scéalaí", h1a: "Na daoine a ", h1em: "d'inis", h1b: " é", lead: "Scéalaithe de réir céadainm, deich mbliana breithe agus baile fearainn. Gan sloinnte, d'aon ghnó.", none: "Níl éinne faoin litir sin fós.", of: "As", bornIn: (d: string) => `Rugadh sna ${decadeLabel(d, "ga")}. ` },
  topics: { title: "Ábhair", kicker: "Ábhair · Topics", h1a: "Na ", h1em: "ceannteidil", lead: "Naoi gcinn déag ó 1937, naoi gcinn ó na nócha bliain ó shin, agus na cinn a chum daoine féin.", own: "Ár gceannteidil féin", noneOwnA: "Níl aon cheann fós. Roghnaigh “Ár gceannteideal féin” nuair a ", noneOwnLink: "chuireann tú scéal isteach", noneOwnB: "." },
  topic: { kicker: "Ceannteideal", none: "Níl aon scéal faoin gceannteideal seo fós." },
  titles: { title: "Teidil A go Z", kicker: "Innéacs · Index", h1a: "Gach teideal, ", h1em: "A go Z", none: (l: string) => `Níl aon rud faoi ${l} fós.` },
  collection: { kicker: "Bailiúchán", addPhoto: "Cuir grianghraf isteach", addRec: "Cuir taifeadadh isteach", add: "Cuir scéal isteach", noPhotos: "Níl aon ghrianghraf fós.", noRecs: "Níl aon taifeadadh fós.", addFirst: "Cuir an chéad cheann isteach.", empty: "Níl aon rud sa bhailiúchán seo fós.", recordedBy: "taifeadta ag" },
  collections: { schools: "Bailithe ag páistí óna sinsir, mar a rinneadh in 1937. Croí an tionscadail.", main: "Bailithe ag daoine fásta: teaghlaigh, cumainn staire, Men's Sheds, grúpaí scoir ghníomhaigh.", photo: "Gach grianghraf sa bhailiúchán, agus an scéal atá taobh thiar de: an cheárta, an chuinneog, an leabhar ciondála, an bóthar sular cuireadh tarra air.", audio: "Na guthanna féin. Gach taifeadadh sa bhailiúchán, le nóta faoina bhfuil air." },
  story: {
    title: "Scéal", toldBy: "Inste ag", ofCollector: (r: string) => `, ${relationLabel(r, "ga")} an bhailitheora`, collectedBy: "Bailithe ag", flagged: "Go raibh maith agat. Léifidh duine é arís.",
    from: "Ó", inLang: (l: string) => `Inste i ${l}`, inEnglish: "I mBéarla", machineNote: "Curtha i mBéarla ag meaisín ón scéal thuas. Is é an bunleagan an taifead; má tá an Béarla mícheart, abair é leis an nasc thíos.",
    more: (h: string) => `Tuilleadh faoi “${h}”`, moreFrom: (n: string) => `Tuilleadh ó ${n}`, duchas: "An rud a scríobh na páistí anseo in 1938 ↗",
    wrong: "An bhfuil rud éigin cearr leis an scéal seo?", tell: "Inis dúinn", tellPh: "Ainmnítear duine beo ann / níl sé oiriúnach / is liomsa é agus ba mhaith liom é a bhaint anuas", send: "Seol", moreHere: (t: string) => `Tuilleadh ó ${t}`,
    og: (teller: string, collector: string) => `Inste ag ${teller}. Bailithe ag ${collector}.`,
    writtenOut: "Scríofa amach", writtenNote: "Ón taifeadadh, seiceáilte ag duine.",
  },
  lost: {
    title: "Nasc príobháideach caillte?", kicker: "Do leathanach coinneála", h1a: "Chaill tú do ", h1em: "nasc príobháideach?",
    lead: "Cuir isteach ríomhphost an duine fhásta a thug tú leis an scéal agus seolfaimid nasc nua chugat do gach scéal faoi. Ní oibreoidh an seannasc a thuilleadh.",
    email: "Ríomhphost an duine fhásta", send: "Seol nasc nua chugam",
    sent: "Má tá an seoladh sin againn, tá ríomhphost ar a bhealach. Féach sa bhfillteán turscair freisin.",
    nomail: "Níl an ríomhphost curtha ar siúl fós. Scríobh chuig hello@rawbyte.ie le teideal an scéil agus seolfaimid an nasc de láimh.",
    foot: "Nasc príobháideach caillte?",
    mailSubject: "Meitheal 2027: do nasc príobháideach", mailIntro: "Seo nasc príobháideach nua do gach scéal faoin ríomhphost seo. Coinnigh an teachtaireacht seo: is é an nasc an t-aon bhealach ar ais chuig do scéal, agus ní oibríonn an seannasc a thuilleadh.", mailNone: "Níl aon scéal coinnithe faoin ríomhphost seo. Má cheapann tú gur chóir go mbeadh, scríobh chuig hello@rawbyte.ie.",
  },
  book: {
    cover: "Bailiúchán na Scol, nócha bliain ar aghaidh", teacher: "Múinteoir", cls: "Rang", stories: (n: number) => `${n} scéal`,
    intro: "In 1937 agus 1938 scríobh páistí scoile ar fud na hÉireann síos a raibh ar eolas ag na seandaoine: scéalta, leigheasanna, nósanna, cluichí agus ainmneacha na ngort. Rinneadh Bailiúchán na Scol dá gcóipleabhair, agus léitear é gach lá ar dúchas.ie. Nócha bliain ina dhiaidh sin, rinne an rang seo an rud céanna. D'inis gaol nó comharsa níos sine gach scéal anseo, thaifead nó scríobh páiste síos é, agus léigh duine é sular cuireadh sa chóipleabhar seo é.",
    contents: "Sa chóipleabhar seo", townlands: "Na háiteanna sa chóipleabhar seo", hear: "Éist leis: scanáil an cód", read: "Léigh ar líne é", rest: "Tá an chuid eile ar an taifeadadh.", kept: "Sa chóipleabhar seo amháin, ar iarratas an teaghlaigh",
    onRecording: "Tá an scéal féin ar an taifeadadh: scanáil an cód chun éisteacht leis.",
    offered: "Bailithe le haghaidh Meitheal 2027 (meitheal2027.ie) agus tairgthe do Chnuasach Bhéaloideas Éireann, An Coláiste Ollscoile, Baile Átha Cliath, le coinneáil don nócha bliain atá romhainn.",
  },
  keep: {
    title: "Do scéal", kicker: "Leathanach do scéil",
    status: { pending: "Go raibh maith agat. Tá do scéal sa chóipleabhar. Léifidh duine é, laistigh de chúpla lá de ghnáth, agus ansin rachaidh sé ar an léarscáil. Coinnigh seoladh an leathanaigh seo: is é an t-aon bhealach ar ais chuig do scéal é.", approved: "Tá do scéal foilsithe. Roinn an nasc poiblí thíos, nó priontáil an leathanach seo mar chuimhneachán.", rejected: "Níor foilsíodh an scéal seo. De ghnáth ciallaíonn sé sin go n-ainmnítear duine le sloinne ann nó go dtugtar sonraí príobháideacha. Cuir in eagar é agus cuir isteach arís é mar scéal nua, nó cuir ríomhphost chugainn.", removed: "Baineadh an scéal seo.", kept: "Tá do scéal i gcóipleabhar an ranga, agus níl sé ar an suíomh gréasáin, mar a d'iarr tú. Má athraíonn tú d'intinn, inis don mhúinteoir. Priontáil an leathanach seo mar chuimhneachán." },
    statusName: { pending: "ag fanacht le léamh", approved: "foilsithe", kept: "sa chóipleabhar amháin", rejected: "gan foilsiú", removed: "bainte" },
    readerNote: "Nóta ón léitheoir:", told: "inste ag", collected: "bailithe ag", footer: (d: string) => `Meitheal 2027 · bailithe ${d} · nócha bliain i ndiaidh Bhailiúchán na Scol`,
    trTitle: "Scríofa amach", trSave: "Sábháil", trSaving: "Á shábháil…", trSaved: "Sábháilte. Léann duine é sula dtéann sé ar an leathanach poiblí.",
    trMachine: "Scríobh meaisín é seo amach ón taifeadadh. Cloiseann sé focail, ainmneacha agus áiteanna mícheart. Éist leis arís, ceartaigh na botúin, agus bain amach aon sloinne nó seoladh, ansin sábháil é.",
    trOwn: "Scríobh amach a bhfuil ar an taifeadadh, i bhfocail an scéalaí féin. Fág sloinnte agus seoltaí amach.",
    trIrish: "Ní féidir leis an meaisín Gaeilge a scríobh amach fós, mar sin scríobh amach féin é, i bhfocail an scéalaí féin. Fág sloinnte agus seoltaí amach.",
    trWait: "Tá an meaisín fós ag scríobh amach an taifeadta. Tar ar ais chuig an leathanach seo i gceann cúpla nóiméad, nó scríobh amach féin é anois.",
    trChanged: "Tá d'athruithe is déanaí ag fanacht le léamh. Go dtí sin taispeánann an leathanach poiblí an leagan a léadh roimhe seo.",
    trError: "Níor sábháladh é. Seiceáil do cheangal agus bain triail eile as.",
    trErrors: { closed: "Ní féidir an scéal seo a athrú a thuilleadh.", phone: "Fág uimhreacha gutháin amach as, le do thoil.", no_audio: "Níl aon taifeadadh ag an scéal seo le scríobh amach." },
    copy: "Cóipeáil mo nasc príobháideach", copied: "Cóipeáilte", print: "Priontáil mar chuimhneachán", open: "Oscail an leathanach poiblí", another: "Cuir ceann eile isteach", remove: "Bain é",
    confirm: "An bhfuil tú cinnte gur mian leat an scéal seo a bhaint den bhailiúchán go deo? Imeoidh cóip an teaghlaigh ar an leathanach seo freisin.", gone: "Bainte. Go raibh maith agat as páirt a ghlacadh mar sin féin.", removeFailed: "Níorbh fhéidir é a bhaint díreach anois, mar sin níor athraíodh faic. Bain triail eile as i gceann nóiméid, nó cuir ríomhphost chuig hello@rawbyte.ie agus déanfaimid é.",
  },
  submit: {
    title: "Cuir scéal isteach", kicker: "Cuir scéal isteach", h1a: "Isteach sa ", h1em: "chóipleabhar",
    lead: "Céadainmneacha amháin. Cuireann duine fásta (tuismitheoir, seantuismitheoir nó múinteoir) tic sa bhosca toilithe. Léann duine gach scéal sula dtaispeántar é, agus faigheann tú nasc príobháideach chun é a choinneáil, a phriontáil nó a scriosadh.",
  },
  form: {
    modes: { write: ["Scríobh mé síos é", "Bealach 1937. An scéal ina bhfocail féin, clóscríofa."], record: ["Thaifead mé iad", "A nguth, suas le deich nóiméad, le nóta gearr faoina bhfuil air."], photo: ["Tá grianghraf agam", "Rud nó áit, agus an scéal atá taobh thiar de."] },
    bringing: "Cad atá á thabhairt agat?", heading: "Ceannteideal", ownOption: "Ár gceannteideal féin…", yourHeading: "Do cheannteideal", yourHeadingHelp: "cúpla focal, mar “Leoraí na huachtarlainne” nó “Loch Ghamhna sa gheimhreadh”. Tagann na ceannteidil a théann i bhfeidhm ar dhaoine isteach san innéacs le go n-úsáidfidh daoine eile iad.",
    title: "Teideal", titleHelp: "cúpla focal, mar “An oíche a tháinig an tSionainn isteach sa chistin”", titlePh: "Cad is ainm dó?",
    townland: "Cá bhfuil tú ag bailiú an scéil seo?", townlandHelp: "do bhaile fearainn, do bhaile nó do shráidbhaile féin, mar an scoil in 1937. Is féidir leis an scéal féin a bheith ó áit ar bith ar domhan: abair sin thíos. Cuir an contae leis má tá níos mó ná ceann amháin den ainm céanna ann.", townlandPh: "m.sh. Droim Leathan, An Cabhán", change: "athraigh",
    far: "Ó áit éigin eile?", farHelp: "más ó lasmuigh d'Éirinn an scéal: an baile nó an sráidbhaile. Tá seantuismitheoir i Lublin nó i Lagos chomh maith le duine ar bith, agus scéal faoin gcaoi ar tháinig an teaghlach anseo freisin.", farPlacePh: "m.sh. Lublin", farCountry: "Tír", farCountryPh: "m.sh. An Pholainn",
    langOther: "Cén teanga?", langOtherPh: "m.sh. Polainnis", langOtherHelp: "cuireann an meaisín i mBéarla é in aice leis an mbunleagan don duine a léann é",
    bodyWrite: "An scéal, ina bhfocail féin", bodyRecord: "Cad atá ar an taifeadadh, i gcúpla líne", bodyPhoto: "An scéal atá taobh thiar de", bodyHelp: "Gaeilge, Béarla nó an dá cheann. Tá ailt go breá.", bodyHelpLong: " Suas le timpeall 3,000 focal.",
    bodyPhPhoto: "Cé leis é, cad chuige é, cad a tharla dó…", bodyPh: "“Bhuel, mar a hinsíodh domsa é…”",
    language: "Teanga", recTitle: "An taifeadadh", recTitleAlt: "Taifeadadh, má tá ceann agat", recHelp: "(suas le deich nóiméad). Taifead anseo, nó uaslódáil meabhrán gutha.", record: "● Taifead", stop: "■ Stop", attached: "Ceangailte:",
    photoTitle: "An grianghraf", photoTitleAlt: "Grianghraif, más ann dóibh", photoHelp: "(suas le ceithre cinn). Tá rudaí agus áiteanna go breá. Daoine amháin má aontaíonn siad; gan grianghraif de pháistí.", captionPhoto: "Cad é, cá háit, agus cathain, a bheag nó a mhór", caption: "fotheideal", removePhoto: "bain",
    teller: "Inste ag", firstName: "céadainm amháin", bornIn: "Rugadh sna", preferNot: "b'fhearr liom gan a rá", relation: "Cé hiad don bhailitheoir", collector: "Bailithe ag",
    age: "Aois an bhailitheora", ageHelp: "cuireann páiste nó scoil i mBailiúchán na Scol é; téann daoine fásta sa Phríomhbhailiúchán", school: "Scoil nó grúpa", optional: "roghnach", schoolPh: "Scoil Bhríde, Cill na Seanrátha", cls: "Rang", clsPh: "Rang a cúig",
    email: "Ríomhphost an duine fhásta", emailHelp: "príobháideach; chun do nasc príobháideach a sheoladh arís amháin", consentName: "Céadainm an duine fhásta a thugann toiliú", consentNameHelp: "tuismitheoir, caomhnóir, seantuismitheoir nó múinteoir",
    consent: "Is duine fásta mé. Tá a fhios ag an duine a d'inis é seo go bhfoilseofar é lena chéadainm, na deich mbliana inar rugadh é agus an baile fearainn, agus tá sé sásta leis sin. Ainmnítear an páiste a bhailigh é lena chéadainm, a aoisghrúpa agus a scoil, más ann di. Ní ainmnítear aon duine beo le sloinne agus ní ghlactar grianghraf d'éinne gan a thoiliú. Seiceálann meaisín é agus léann duine é sula mbíonn aon rud poiblí. Féadfar é a thairiscint do Chnuasach Bhéaloideas Éireann agus é a choinneáil ar feadh céad bliain.", consentLink: "Conas a thugaimid aire dó",
    send: "Cuir sa bhailiúchán é", sending: "Á sheoladh…",
    errTownland: "Roghnaigh do bhaile fearainn féin, an áit a bhfuil tú ag bailiú an scéil seo. Más ó áit eile an scéal, abair sin thíos.", errAudio: "Ceangail an taifeadadh, nó scríobh síos é ina ionad.", errPhoto: "Ceangail an grianghraf, nó scríobh síos an scéal ina ionad.", errBig: "Tá an taifeadadh os cionn 12 MB. Coinnigh faoi dheich nóiméad é.", errMic: "Níl an micreafón ar fáil. Uaslódáil meabhrán gutha ina ionad, nó scríobh síos an scéal.", errGeneric: "Chuaigh rud éigin amú",
  },
  api: {
    many: "Sin a lán scéalta in aon uair an chloig amháin. Bain triail eile as ar ball.", form: "Níorbh fhéidir an fhoirm a léamh", ownHeading: "Tabhair ainm do do cheannteideal féin", heading: "Roghnaigh ceannteideal", townland: "Roghnaigh do bhaile fearainn féin, an áit ar bailíodh an scéal", farCountry: "Abair cén tír ina bhfuil an áit i gcéin", langOther: "Abair cén teanga ina bhfuil an scéal",
    missingWrite: "Tá gá le teideal, leis an scéal, leis an dá chéadainm agus leis an duine fásta a thugann toiliú", missingOther: "Tá gá le teideal, le nóta gearr, leis an dá chéadainm agus leis an duine fásta a thugann toiliú", consent: "Caithfidh duine fásta tic a chur sa bhosca toilithe",
    phone: "Ná cuir uimhreacha gutháin sa scéal, le do thoil", audioBig: "Taifeadadh os cionn 12 MB", notAudio: "Ní comhad fuaime é sin", photoBig: "Tá grianghraf os cionn 6 MB", photoType: "Caithfidh grianghraif a bheith JPEG, PNG nó WebP", photoMany: "Suas le ceithre ghrianghraf",
    needAudio: "Ceangail an taifeadadh, nó scríobh síos é ina ionad", needPhoto: "Ceangail an grianghraf, nó scríobh síos an scéal ina ionad", stored: "Níorbh fhéidir an taifeadadh nó an grianghraf a stóráil. Bain triail eile as, nó cuir isteach gan é.",
  },
  map: { title: "An léarscáil", loading: "An t-oileán á lódáil…", noLib: "Níor lódáil leabharlann na léarscáile.", count: (n: number) => `${n === 1 ? "1 scéal" : `${n} scéal`} ar an léarscáil. Tapáil ceann.`, none: "Níl aon scéal ar an léarscáil fós. D'fhéadfadh do cheannsa a bheith ar an gcéad cheann.", failed: "Níorbh fhéidir na scéalta a lódáil.", read: "Léigh é" },
  gate: { title: "Réamhamharc príobháideach", kicker: "Réamhamharc príobháideach", h1a: "Níl sé oscailte ", h1em: "fós", lead: "Tá Meitheal 2027 á ullmhú dá chomhpháirtithe. Má tugadh an focal duit, clóscríobh anseo é.", wrong: "Ní hé sin é.", word: "An focal", in: "Isteach leat" },
  notFound: { kicker: "Gan aimsiú", h1a: "Níl an leathanach sin ", h1em: "sa chóipleabhar", leadA: "D'fhéadfadh an nasc a bheith mícheart, nó bhain an teaghlach an scéal anuas. ", browse: "Brabhsáil na scéalta", or: " nó ", home: "téigh abhaile", end: "." },
};

export const dict = (l: Lang): Dict => (l === "ga" ? ga : en);
