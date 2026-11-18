import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Bump this whenever the consent wording below changes; the server records it with each story (migrations/012).
const kConsentVersion = 'app-2026-11-04';

/// The app's two languages. [lang] holds the choice ('en' or 'ga'), saved on the phone; [s] is the current strings.
/// English is the base class, Irish overrides it. The Irish is in the standard (An Caighdeán) and the same wording
/// as the website (src/lib/i18n.ts), and wants a native speaker's read.
final lang = ValueNotifier<String>('en');
S get s => lang.value == 'ga' ? const SGa() : const S();
/// The interface language, for code that has its own `lang` in scope.
String get uiLang => lang.value;

Future<void> loadLang() async {
  final p = await SharedPreferences.getInstance();
  lang.value = p.getString('lang') == 'ga' ? 'ga' : 'en';
}

Future<void> setLang(String l) async {
  lang.value = l;
  final p = await SharedPreferences.getInstance();
  await p.setString('lang', l);
}

class S {
  const S();
  String get code => 'en';
  String get switchTo => 'Gaeilge';
  String get switchToCode => 'ga';

  // Home
  String get read => 'Read';
  String get kicker => 'BAILIÚCHÁN NA SCOL · 1937 · 2027';
  String get h1a => 'Ask them ';
  String get h1em => 'before';
  String get h1b => ' the stories go.';
  String get lead => 'In 1937 a hundred thousand schoolchildren sat down with a grandparent and wrote down what the old people knew. Ninety years on, it is your turn.';
  String get schoolCaption => 'c. 1902 · Kilglass National School, Ahascragh, Co. Galway. National Library of Ireland';
  String get doorCaption => 'c. 1900 · At the door of a thatched cottage. National Library of Ireland';
  String get recordStory => 'Record a story';
  String get readNear => 'Read the stories near you';
  String get waiting => 'WAITING TO SEND';
  String savedOnPhone(int n) => '$n ${n == 1 ? 'story' : 'stories'} saved on the phone';
  String get sendThemselves => 'They send by themselves when you have signal.';
  String get sendNow => 'Send now';
  String get sending => 'Sending…';
  String get notFinished => 'NOT FINISHED';
  String get carryOn => 'Tap to carry on';
  String get delete => 'Delete';
  String get myStories => 'MY STORIES';
  String get readPrint => 'Read, print or remove it';
  String get howTo => 'HOW TO SIT DOWN WITH A GRANDPARENT';
  String sentN(int n, int left) => '$n ${n == 1 ? 'story' : 'stories'} sent.${left > 0 ? ' $left still waiting.' : ''}';
  String get stillNoSignal => 'Still no signal. They will wait.';
  String get throwAway => 'Throw this one away?';
  String willDelete(String label) => '"$label" and its recording will be deleted from the phone.';
  String get keepIt => 'Keep it';
  List<(String, String)> get tips => const [
    ('Pick one heading', 'One question is enough to get them going. The rest comes by itself.'),
    ('Somewhere quiet', 'The kitchen table, with the radio off. Put the phone down between you.'),
    ('Ask, then wait', 'Let the silences sit. The best bit usually comes after a pause.'),
    ('Ask "and then what?"', 'Names of places, who was there, what it smelled like. Small things are the treasure.'),
  ];

  // Drafts
  String storyOf(String teller) => "$teller's story";
  String get unnamed => 'A story not yet named';

  // The steps
  List<String> get stepNames => const ['Who is telling', 'What to ask', 'Record', 'Where and what', 'A grown-up'];
  String get back => 'Back';
  String get later => 'Later';
  String get next => 'Next';
  String get sendIt => 'Send it in';
  String get stopFirst => 'Stop the recording first.';
  String get needTeller => 'Put in the first name of the person telling the story.';
  String get needTopic => 'Pick something to ask about.';
  String get needOwn => 'Give your own heading a name.';
  String get needTitle => 'Give the story a title.';
  String get needTownland => 'Pick your own townland, where you are collecting this. If the story is from somewhere else, say so underneath.';
  String get needFarCountry => 'Say which country the far place is in.';
  String get needLangOther => 'Say which language the story is in.';
  String get needStory => 'Write a few more lines of the story, in their words.';
  String get needNote => 'Write a line or two about what is on it.';
  String get noPhones => 'Please keep phone numbers out of the story.';
  String get needCollector => "Put in the collector's first name.";
  String get needConsentName => "Put in the grown-up's first name.";
  String get needConsent => 'A grown-up needs to tick the box.';
  String get somethingMissing => 'Something is missing.';
  String get inCopybook => 'In the copybook';
  String get savedPhone => 'Saved on the phone';
  String thanks(String teller) => 'Thank you, and thank $teller. A person will read it, and then it goes on the map. You will find it under "My stories".';
  String get noSignal => "There's no signal just now. It's safe in the outbox and will send the next time you open the app with signal.";
  String get seeIt => 'See it';
  String get done => 'Done';

  String get whoQ => 'Who is telling the story?';
  String get whoSub => 'First names only. A grandparent, a neighbour, anyone with a long memory.';
  String get whoHint => 'Their first name, like Mary';
  String get whoTo => 'Who are they to you?';
  String get whenBorn => 'When were they born?';
  String relation(String r) => r;
  String decade(String d) => d == '' ? 'rather not say' : d == 'later' ? 'later than that' : d;
  String age(String a) => a;

  String askAbout(String name) => 'What will you ask $name about?';
  String get askSub => 'Pick one heading. The 1937 ones are the questions the children were given ninety years ago.';
  String get pickForMe => 'Pick one for me';
  String get ownHeading => 'Our own heading';
  String get ownHeadingSub => 'Something that does not fit the others.';
  String get ownHint => 'The creamery lorry';
  String them(String teller) => teller.isEmpty ? 'them' : teller;

  String get listening => 'Listening…';
  String get gotIt => 'Got it.';
  String pressAndTalk(String name) => 'Press the button and let $name talk.';
  String get listeningSub => 'Put the phone down between you. Ask a question, then let them go.';
  String get gotItSub => 'Listen back if you like, or record it again.';
  String get pressSub => 'Ten minutes is plenty. Or skip this and write it down on the next page.';
  String get startRec => 'Start recording';
  String get stopRec => 'Stop recording';
  String paused(String mm) => 'Paused · $mm';
  String recorded(String mm) => 'Recorded · $mm';
  String get tapToRecord => 'Tap to record';
  String get carryOnRec => 'Carry on';
  String get pause => 'Pause';
  String get listenBack => 'Listen back';
  String get stop => 'Stop';
  String get recordAgain => 'Record again';
  String get askThem => 'ASK THEM';
  String get another => 'Another question';
  String get photos => 'Photographs (up to four)';
  String get photosSub => 'The thing itself or the place: the churn, the ration book, the road. Grown-ups only with their say-so, and no children.';
  String get takeOne => 'Take one';
  String get fromPhone => 'From the phone';
  String get micNeeded => 'The app needs the microphone to record. You can allow it in the phone settings.';
  List<String> get followUps => const [
    'Where were you when that happened?', 'How old were you?', 'Who else was there?', 'What did it look like? What could you hear?',
    'What happened after?', 'Did anyone tell you about it when you were small?', 'What would you want me to remember about it?',
  ];

  String get whereQ => 'Where are you collecting this?';
  String get whereSub => 'Your own townland, town or village, like the school in 1937. The story itself can be from anywhere in the world: say that below.';
  String get farQ => 'From somewhere else?';
  String get farSub => 'If the story is from outside Ireland, say where. A grandparent in Lublin or Lagos counts, and so does how the family came here.';
  String get farPlaceHint => 'The town or village, like Lublin';
  String get farCountryHint => 'The country, like Poland';
  String get whichLanguage => 'Which language?';
  String get langHint => 'Like Polish. A machine puts it into English for the reader.';
  String get townlandHint => 'Type the townland, like Drumlane';
  String get findPlace => 'Find your townland, town or village';
  String get noPlaces => 'No place by that name. Try the nearest town or village, or another spelling.';
  String get noSignalTownland => 'No signal to look up townlands. You can save it for later and finish when you have signal.';
  String get change => 'Change';
  String get giveTitle => 'Give it a title';
  String get titleHint => 'The night the river came into the kitchen';
  String get aboutRec => 'A line or two about what is on the recording';
  String get inTheirWords => 'The story, in their words';
  String get recHint => 'Granny talks about the Big Snow of 1947 and walking to school over the ditches.';
  String get writeHint => 'Write it the way they said it.';
  String get whatLanguage => 'What language is it in?';
  Map<String, String> get langs => const {'en': 'English', 'ga': 'Gaeilge', 'both': 'Both', 'other': 'Another'};

  String get handOver => 'Now hand the phone to a grown-up.';
  String get handOverSub => 'A parent or guardian checks it and says yes. Nothing goes public until a person has read it.';
  String get collectorName => "The collector's first name";
  String get collectorHint => 'The child who asked the questions';
  String get collectorAge => "The collector's age";
  String get schoolLabel => 'School (if it is for school)';
  String get optional => 'Optional';
  String get yourName => 'Your first name';
  String get yourEmail => 'Your email (optional, never published)';
  String get emailHint => 'So we can tell you when it is on the map';
  String consent(String teller) => 'I am an adult. ${teller.isEmpty ? 'The teller' : teller} knows this will be published with their first name, decade of birth and townland, and is happy with that. The child who collected it is named by first name, age band and school, if there is one. No living person is named by surname and nobody is photographed without agreeing. It is checked by machine and read by a person before anything is public. It may be offered to the National Folklore Collection and kept for a hundred years. How we look after it: meitheal2027.ie/privacy';

  // Stories
  String get theStories => 'The stories';
  String get allIreland => 'All of Ireland';
  String get loadFailed => 'No signal, or the stories could not load.';
  String get tryAgain => 'Try again';
  String get nothingYet => 'Nothing here yet. Yours could be the first.';
  String nothingFrom(String co) => 'Nothing from Co. $co yet. Yours could be the first.';
  String county(String c) => c;
  String coOf(String c) => 'Co. $c';
  String placeKind(String k) => const {'city': 'City', 'town': 'Town', 'village': 'Village'}[k] ?? '';
  String toldBy(String teller, String? born) => 'told by $teller${born != null ? ', born in the $born' : ''}';
  String toldTo(String teller, String? born, String collector, String? school) => 'Told by $teller${born != null ? ', born in the $born' : ''}, to $collector${school != null ? ' of $school' : ''}.';
  String listenTo(String teller) => 'Listen to $teller';
  String get cantPlay => 'The recording could not play. Check the signal.';
  String get share => 'Share';
  String shareText(String title, String teller, String place, String url) => '$title, told by $teller of $place. $url';
}

class SGa extends S {
  const SGa();
  static const _co = <String, (String, String)>{ 'Carlow': ('Ceatharlach', 'Cheatharlach'), 'Cavan': ('An Cabhán', 'an Chabháin'),
    'Clare': ('An Clár', 'an Chláir'), 'Cork': ('Corcaigh', 'Chorcaí'), 'Donegal': ('Dún na nGall', 'Dhún na nGall'), 'Dublin': ('Baile Átha Cliath', 'Bhaile Átha Cliath'), 'Galway': ('Gaillimh', 'na Gaillimhe'),
    'Kerry': ('Ciarraí', 'Chiarraí'), 'Kildare': ('Cill Dara', 'Chill Dara'), 'Kilkenny': ('Cill Chainnigh', 'Chill Chainnigh'), 'Laois': ('Laois', 'Laoise'),
    'Leitrim': ('Liatroim', 'Liatroma'), 'Limerick': ('Luimneach', 'Luimnigh'), 'Longford': ('An Longfort', 'an Longfoirt'), 'Louth': ('Lú', 'Lú'),
    'Mayo': ('Maigh Eo', 'Mhaigh Eo'), 'Meath': ('An Mhí', 'na Mí'), 'Monaghan': ('Muineachán', 'Mhuineacháin'), 'Offaly': ('Uíbh Fhailí', 'Uíbh Fhailí'),
    'Roscommon': ('Ros Comáin', 'Ros Comáin'), 'Sligo': ('Sligeach', 'Shligigh'), 'Tipperary': ('Tiobraid Árann', 'Thiobraid Árann'),
    'Waterford': ('Port Láirge', 'Phort Láirge'), 'Westmeath': ('An Iarmhí', 'na hIarmhí'), 'Wexford': ('Loch Garman', 'Loch Garman'), 'Wicklow': ('Cill Mhantáin', 'Chill Mhantáin'),
  };
  static const _rel = {'grandmother': 'seanmháthair', 'grandfather': 'seanathair', 'great-grandparent': 'sin-seantuismitheoir', 'aunt or uncle': 'aintín nó uncail', 'neighbour': 'comharsa', 'family friend': 'cara clainne', 'other': 'eile', 'mother': 'máthair', 'father': 'athair'};
  static const _age = {'under 8': 'faoi 8', '8 to 9': '8 go 9', '10 to 12': '10 go 12', '13 to 15': '13 go 15', '16 to 18': '16 go 18', 'adult': 'duine fásta'};
  String _dec(String d) => d.replaceAll(RegExp(r's$'), 'idí');
  String _born(String? b) => b == null ? '' : b == 'later' ? ', a rugadh níos déanaí' : ', a rugadh sna ${_dec(b)}';

  @override String get code => 'ga';
  @override String get switchTo => 'English';
  @override String get switchToCode => 'en';

  @override String get read => 'Léigh';
  @override String get h1a => 'Cuir ceist orthu ';
  @override String get h1em => 'sula';
  @override String get h1b => ' n-imeoidh na scéalta.';
  @override String get lead => 'Sa bhliain 1937 shuigh céad míle páiste scoile síos le seantuismitheoir agus scríobh siad síos a raibh ar eolas ag na seandaoine. Nócha bliain ina dhiaidh sin, is é do sheal-sa é.';
  @override String get schoolCaption => 'c. 1902 · Scoil Náisiúnta Chill Ghlais, Áth Eascrach, Co. na Gaillimhe. Leabharlann Náisiúnta na hÉireann';
  @override String get doorCaption => 'c. 1900 · Ag doras tí cheann tuí. Leabharlann Náisiúnta na hÉireann';
  @override String get recordStory => 'Taifead scéal';
  @override String get readNear => 'Léigh na scéalta i do cheantar';
  @override String get waiting => 'AG FANACHT LE SEOLADH';
  @override String savedOnPhone(int n) => n == 1 ? '1 scéal sábháilte ar an bhfón' : '$n scéal sábháilte ar an bhfón';
  @override String get sendThemselves => 'Seolfar iad féin nuair a bheidh comhartha agat.';
  @override String get sendNow => 'Seol anois';
  @override String get sending => 'Á sheoladh…';
  @override String get notFinished => 'GAN CHRÍOCHNÚ';
  @override String get carryOn => 'Tapáil le leanúint ar aghaidh';
  @override String get delete => 'Scrios';
  @override String get myStories => 'MO SCÉALTA';
  @override String get readPrint => 'Léigh, priontáil nó bain é';
  @override String get howTo => 'CONAS SUÍ SÍOS LE SEANTUISMITHEOIR';
  @override String sentN(int n, int left) => '${n == 1 ? '1 scéal' : '$n scéal'} seolta.${left > 0 ? ' $left fós ag fanacht.' : ''}';
  @override String get stillNoSignal => 'Fós gan chomhartha. Fanfaidh siad.';
  @override String get throwAway => 'An gcaithfear an ceann seo amach?';
  @override String willDelete(String label) => 'Scriosfar "$label" agus a thaifeadadh ón bhfón.';
  @override String get keepIt => 'Coinnigh é';
  @override List<(String, String)> get tips => const [
    ('Roghnaigh ceannteideal amháin', 'Is leor ceist amháin chun tús a chur leo. Tagann an chuid eile leis féin.'),
    ('Áit chiúin', 'Bord na cistine, agus an raidió múchta. Cuir an fón síos eadraibh.'),
    ('Cuir ceist, ansin fan', 'Lig do na ciúnais fanacht. Is minic a thagann an chuid is fearr i ndiaidh sosa.'),
    ('Fiafraigh "agus ansin?"', 'Ainmneacha áiteanna, cé a bhí ann, an boladh a bhí air. Is iad na rudaí beaga an stór.'),
  ];

  @override String storyOf(String teller) => 'Scéal $teller';
  @override String get unnamed => 'Scéal gan ainm fós';

  @override List<String> get stepNames => const ['Cé atá ag insint', 'Cad le fiafraí', 'Taifead', 'Cá háit agus cad é', 'Duine fásta'];
  @override String get back => 'Siar';
  @override String get later => 'Ar ball';
  @override String get next => 'Ar aghaidh';
  @override String get sendIt => 'Seol isteach é';
  @override String get stopFirst => 'Stop an taifeadadh ar dtús.';
  @override String get needTeller => 'Cuir isteach céadainm an duine atá ag insint an scéil.';
  @override String get needTopic => 'Roghnaigh rud le fiafraí faoi.';
  @override String get needOwn => 'Tabhair ainm do do cheannteideal féin.';
  @override String get needTitle => 'Tabhair teideal don scéal.';
  @override String get needTownland => 'Roghnaigh do bhaile fearainn féin, an áit a bhfuil tú ag bailiú an scéil seo. Más ó áit eile an scéal, abair sin thíos.';
  @override String get needFarCountry => 'Abair cén tír ina bhfuil an áit i gcéin.';
  @override String get needLangOther => 'Abair cén teanga ina bhfuil an scéal.';
  @override String get needStory => 'Scríobh cúpla líne eile den scéal, ina bhfocail féin.';
  @override String get needNote => 'Scríobh líne nó dhó faoina bhfuil air.';
  @override String get noPhones => 'Ná cuir uimhreacha gutháin sa scéal, le do thoil.';
  @override String get needCollector => 'Cuir isteach céadainm an bhailitheora.';
  @override String get needConsentName => 'Cuir isteach céadainm an duine fhásta.';
  @override String get needConsent => 'Caithfidh duine fásta tic a chur sa bhosca.';
  @override String get somethingMissing => 'Tá rud éigin in easnamh.';
  @override String get inCopybook => 'Sa chóipleabhar';
  @override String get savedPhone => 'Sábháilte ar an bhfón';
  @override String thanks(String teller) => 'Go raibh maith agatsa agus ag $teller. Léifidh duine é, agus ansin rachaidh sé ar an léarscáil. Gheobhaidh tú é faoi "Mo scéalta".';
  @override String get noSignal => 'Níl comhartha ann faoi láthair. Tá sé slán sa bhosca amach agus seolfar é an chéad uair eile a osclóidh tú an aip agus comhartha agat.';
  @override String get seeIt => 'Féach air';
  @override String get done => 'Déanta';

  @override String get whoQ => 'Cé atá ag insint an scéil?';
  @override String get whoSub => 'Céadainmneacha amháin. Seantuismitheoir, comharsa, duine ar bith a bhfuil cuimhne fhada acu.';
  @override String get whoHint => 'A gcéadainm, mar Mháire';
  @override String get whoTo => 'Cé hiad duitse?';
  @override String get whenBorn => 'Cathain a rugadh iad?';
  @override String relation(String r) => _rel[r] ?? r;
  @override String decade(String d) => d == '' ? "b'fhearr liom gan a rá" : d == 'later' ? 'níos déanaí ná sin' : _dec(d);
  @override String age(String a) => _age[a] ?? a;

  @override String askAbout(String name) => 'Cad a fhiafróidh tú de $name?';
  @override String get askSub => 'Roghnaigh ceannteideal amháin. Is iad ceannteidil 1937 na ceisteanna a tugadh do na páistí nócha bliain ó shin.';
  @override String get pickForMe => 'Roghnaigh ceann dom';
  @override String get ownHeading => 'Ár gceannteideal féin';
  @override String get ownHeadingSub => 'Rud nach n-oireann do na cinn eile.';
  @override String get ownHint => 'Leoraí na huachtarlainne';
  @override String them(String teller) => teller.isEmpty ? 'é nó í' : teller;

  @override String get listening => 'Ag éisteacht…';
  @override String get gotIt => 'Tá sé agat.';
  @override String pressAndTalk(String name) => 'Brúigh an cnaipe agus lig do $name labhairt.';
  @override String get listeningSub => 'Cuir an fón síos eadraibh. Cuir ceist, ansin lig dóibh labhairt.';
  @override String get gotItSub => 'Éist siar leis más mian leat, nó taifead arís é.';
  @override String get pressSub => 'Is leor deich nóiméad. Nó léim thar seo agus scríobh síos é ar an gcéad leathanach eile.';
  @override String get startRec => 'Tosaigh ag taifeadadh';
  @override String get stopRec => 'Stop an taifeadadh';
  @override String paused(String mm) => 'Ar sos · $mm';
  @override String recorded(String mm) => 'Taifeadta · $mm';
  @override String get tapToRecord => 'Tapáil chun taifeadadh';
  @override String get carryOnRec => 'Lean ar aghaidh';
  @override String get pause => 'Sos';
  @override String get listenBack => 'Éist siar';
  @override String get stop => 'Stop';
  @override String get recordAgain => 'Taifead arís';
  @override String get askThem => 'FIAFRAIGH DÍOBH';
  @override String get another => 'Ceist eile';
  @override String get photos => 'Grianghraif (suas le ceithre cinn)';
  @override String get photosSub => 'An rud féin nó an áit: an chuinneog, an leabhar ciondála, an bóthar. Daoine fásta amháin má thugann siad cead, agus gan páistí.';
  @override String get takeOne => 'Tóg ceann';
  @override String get fromPhone => 'Ón bhfón';
  @override String get micNeeded => 'Teastaíonn an micreafón ón aip chun taifeadadh. Is féidir é a cheadú i socruithe an fhóin.';
  @override List<String> get followUps => const [
    'Cá raibh tú nuair a tharla sé sin?', 'Cén aois a bhí tú?', 'Cé eile a bhí ann?', 'Conas a bhí sé? Cad a chloisfeá?',
    'Cad a tharla ina dhiaidh sin?', 'Ar inis duine ar bith duit faoi nuair a bhí tú beag?', 'Cad ba mhaith leat go gcuimhneoinn air?',
  ];

  @override String get whereQ => 'Cá bhfuil tú ag bailiú an scéil seo?';
  @override String get whereSub => 'Do bhaile fearainn, do bhaile nó do shráidbhaile féin, mar an scoil in 1937. Is féidir leis an scéal féin a bheith ó áit ar bith ar domhan: abair sin thíos.';
  @override String get farQ => 'Ó áit éigin eile?';
  @override String get farSub => 'Más ó lasmuigh d\'Éirinn an scéal, abair cá háit. Tá seantuismitheoir i Lublin nó i Lagos chomh maith le duine ar bith, agus an chaoi ar tháinig an teaghlach anseo freisin.';
  @override String get farPlaceHint => 'An baile nó an sráidbhaile, mar Lublin';
  @override String get farCountryHint => 'An tír, mar an Pholainn';
  @override String get whichLanguage => 'Cén teanga?';
  @override String get langHint => 'Mar Pholainnis. Cuireann meaisín i mBéarla é don léitheoir.';
  @override String get townlandHint => 'Clóscríobh an baile fearainn, mar Dhroim Leathan';
  @override String get findPlace => 'Aimsigh do bhaile fearainn, do bhaile nó do shráidbhaile';
  @override String get noPlaces => 'Níl aon áit den ainm sin ann. Bain triail as an mbaile nó an sráidbhaile is gaire, nó as litriú eile.';
  @override String get noSignalTownland => 'Níl comhartha ann chun bailte fearainn a chuardach. Is féidir leat é a shábháil agus a chríochnú nuair a bheidh comhartha agat.';
  @override String get change => 'Athraigh';
  @override String get giveTitle => 'Tabhair teideal dó';
  @override String get titleHint => 'An oíche a tháinig an abhainn isteach sa chistin';
  @override String get aboutRec => 'Líne nó dhó faoina bhfuil ar an taifeadadh';
  @override String get inTheirWords => 'An scéal, ina bhfocail féin';
  @override String get recHint => 'Labhraíonn Mamó faoin Sneachta Mór in 1947 agus faoin siúl ar scoil thar na claíocha.';
  @override String get writeHint => 'Scríobh é mar a dúirt siad é.';
  @override String get whatLanguage => 'Cén teanga atá ann?';
  @override Map<String, String> get langs => const {'en': 'Béarla', 'ga': 'Gaeilge', 'both': 'An dá cheann', 'other': 'Ceann eile'};

  @override String get handOver => 'Anois tabhair an fón do dhuine fásta.';
  @override String get handOverSub => 'Seiceálann tuismitheoir nó caomhnóir é agus aontaíonn leis. Níl aon rud poiblí go dtí go léann duine é.';
  @override String get collectorName => 'Céadainm an bhailitheora';
  @override String get collectorHint => 'An páiste a chuir na ceisteanna';
  @override String get collectorAge => 'Aois an bhailitheora';
  @override String get schoolLabel => 'Scoil (más don scoil é)';
  @override String get optional => 'Roghnach';
  @override String get yourName => 'Do chéadainm';
  @override String get yourEmail => 'Do ríomhphost (roghnach, ní fhoilseofar riamh é)';
  @override String get emailHint => 'Ionas gur féidir linn insint duit nuair a bheidh sé ar an léarscáil';
  @override String consent(String teller) => 'Is duine fásta mé. Tá a fhios ag ${teller.isEmpty ? 'an scéalaí' : teller} go bhfoilseofar é seo lena chéadainm, na deich mbliana inar rugadh é agus an baile fearainn, agus tá sé nó sí sásta leis sin. Ainmnítear an páiste a bhailigh é lena chéadainm, a aoisghrúpa agus a scoil, más ann di. Ní ainmnítear aon duine beo le sloinne agus ní ghlactar grianghraf d\'éinne gan a thoiliú. Seiceálann meaisín é agus léann duine é sula mbíonn aon rud poiblí. Féadfar é a thairiscint do Chnuasach Bhéaloideas Éireann agus é a choinneáil ar feadh céad bliain. Conas a thugaimid aire dó: meitheal2027.ie/privacy';

  @override String get theStories => 'Na scéalta';
  @override String get allIreland => 'Éire ar fad';
  @override String get loadFailed => 'Níl comhartha ann, nó níorbh fhéidir na scéalta a lódáil.';
  @override String get tryAgain => 'Bain triail eile as';
  @override String get nothingYet => 'Níl aon rud anseo fós. D\'fhéadfadh do cheannsa a bheith ar an gcéad cheann.';
  @override String nothingFrom(String co) => 'Níl aon rud ó ${county(co)} fós. D\'fhéadfadh do cheannsa a bheith ar an gcéad cheann.';
  @override String county(String c) => _co[c]?.$1 ?? c;
  @override String placeKind(String k) => const {'city': 'Cathair', 'town': 'Baile mór', 'village': 'Sráidbhaile'}[k] ?? '';
  @override String coOf(String c) => _co[c] == null ? 'Co. $c' : 'Co. ${_co[c]!.$2}';
  @override String toldBy(String teller, String? born) => 'inste ag $teller${_born(born)}';
  @override String toldTo(String teller, String? born, String collector, String? school) => 'Inste ag $teller${_born(born)}. Bailithe ag $collector${school != null ? ', $school' : ''}.';
  @override String listenTo(String teller) => 'Éist le $teller';
  @override String get cantPlay => 'Níorbh fhéidir an taifeadadh a sheinm. Seiceáil an comhartha.';
  @override String get share => 'Roinn';
  @override String shareText(String title, String teller, String place, String url) => '$title, inste ag $teller as $place. $url';
}
