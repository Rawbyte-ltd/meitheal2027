import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

const apiBase = String.fromEnvironment('MEITHEAL_API', defaultValue: 'https://meitheal2027.ie');

/// While the site is behind SITE_PASSWORD, build with `--dart-define=MEITHEAL_GATE=...` (the site password) and the app sends the same
/// cookie the gate page sets (src/proxy.ts). Leave it out once the site is open.
const _gatePassword = String.fromEnvironment('MEITHEAL_GATE');
final Map<String, String> _headers = _gatePassword.isEmpty ? const {} : {
  'Cookie': 'meitheal_gate=${sha256.convert(utf8.encode('meitheal-gate:$_gatePassword')).toString().substring(0, 32)}',
};
Map<String, String> get mediaHeaders => _headers;

/// A townland, or a city, town or village (`kind`). For a town the server puts "Town" or "Village" in `ed`.
class Townland {
  final String en, ga, co, slug, ed, kind;
  Townland(this.en, this.ga, this.co, this.slug, this.ed, [this.kind = 'townland']);
  factory Townland.fromJson(Map<String, dynamic> j) => Townland(j['en'], j['ga'] ?? '', j['co'], j['slug'], j['ed'] ?? '', j['kind'] ?? 'townland');
  bool get isTown => kind != 'townland';
}

class Story {
  final String id, title, body, topic, county, townlandEn, tellerName, collectorName;
  final String? tellerBorn, school;
  final bool hasAudio, hasPhoto;
  final String? topicCustom, collection;
  Story.fromJson(Map<String, dynamic> j)
      : id = j['id'], title = j['title'], body = j['body'], topic = j['topic'], county = j['county'], townlandEn = j['townland_en'],
        tellerName = j['teller_name'], collectorName = j['collector_name'], tellerBorn = j['teller_born'], school = j['school'], hasAudio = j['has_audio'] == true, hasPhoto = j['has_photo'] == true, topicCustom = j['topic_custom'], collection = j['collection'];
}

class Collection {
  final String slug, name, blurb;
  final String? needs;
  const Collection(this.slug, this.name, this.blurb, this.needs);
}

const collections = [
  Collection('schools', "The Schools' Collection 2027", 'Collected by children from their elders, as in 1937.', null),
  Collection('main', 'The Main Collection', 'Collected by adults: families, societies, sheds, retirement groups.', null),
  Collection('photo', 'The Photographic Collection', 'A photograph of a thing or a place with the story behind it.', 'photo'),
  Collection('audio', 'The Audio Collection', 'The voice itself, with a short note of what is on it.', 'audio'),
];

class Topic {
  final String slug, name, ga, prompt;
  final int era;
  const Topic(this.slug, this.name, this.ga, this.era, this.prompt);
}

/// Mirrors src/lib/topics.ts. Keep in step.
const topics = [
  Topic('ghosts-and-fairies', 'Ghosts and Fairies', 'Taibhsí agus Sióga', 1937, 'Was there a fort, a lone bush or a house nobody would pass at night?'),
  Topic('local-cures', 'Local Cures', 'Leigheasanna', 1937, 'Who had the cure for warts, the sprain, the whooping cough?'),
  Topic('hidden-treasure', 'Hidden Treasure', 'Ór i bhFolach', 1937, 'Was gold ever said to be buried near here?'),
  Topic('weather-lore', 'Weather-Lore', 'Seanchas na hAimsire', 1937, 'How did people know rain was coming?'),
  Topic('severe-weather', 'Severe Weather', 'Drochaimsir', 1937, 'The Big Snow, the Big Wind, the flood. What happened?'),
  Topic('festival-customs', 'Festival Customs', 'Nósanna Féile', 1937, 'St Brigid\'s Day, Halloween, Christmas Eve, May Eve.'),
  Topic('games-i-play', 'Games We Played', 'Cluichí', 1937, 'What games were played in the yard and the road?'),
  Topic('the-local-forge', 'The Forge, the Mill, the Shop', 'An Cheárta', 1937, 'Where was the forge, the creamery, the shop? Who ran it?'),
  Topic('old-schools', 'Old Schools', 'Seanscoileanna', 1937, 'What was school like? The teacher, the walk, the sod of turf?'),
  Topic('the-famine', 'The Famine Times', 'Aimsir an Ghorta', 1937, 'What was said in the family about the Famine?'),
  Topic('emigration', 'Emigration and Coming Home', 'Imirce', 1937, 'Who went to America, England, Australia? Did they come back?'),
  Topic('local-heroes', 'Local Heroes and Characters', 'Laochra Áitiúla', 1937, 'Who was the strongest, the wittiest, the one still talked about?'),
  Topic('place-names', 'Local Place-Names', 'Logainmneacha', 1937, 'What are the fields, wells and crossroads called, and why?'),
  Topic('proverbs-riddles', 'Proverbs, Riddles and Sayings', 'Seanfhocail', 1937, 'What sayings and riddles were used by the fire?'),
  Topic('food', 'Food in Olden Times', 'Bia Fadó', 1937, 'What was eaten, baked, churned? Who killed the pig?'),
  Topic('crafts', 'Old Crafts and Work', 'Ceirdeanna', 1937, 'Thatching, baskets, turf, hay. Who did it and how?'),
  Topic('marriage-customs', 'Matches, Weddings and Wakes', 'Cleamhnas agus Tórramh', 1937, 'How did people meet? What was a wake like?'),
  Topic('animals', 'Animals and Birds', 'Ainmhithe', 1937, 'What was believed about the hare, the magpie, the cuckoo?'),
  Topic('funny-story', 'A Funny Story', 'Scéal Grinn', 1937, 'The one that still gets told at Christmas.'),
  Topic('the-day-the-power-came', 'The Day the Power Came', 'Lá an Leictreachais', 2027, 'The first bulb, the first television, the first fridge.'),
  Topic('the-phone-and-the-car', 'The Phone, the Car and the Road', 'An Guthán agus an Carr', 2027, 'The first phone, the first car, the day the road was tarred.'),
  Topic('working-away', 'Working Away', 'Ag Obair i gCéin', 2027, 'London buildings, Boston bars, the boats. What was sent home?'),
  Topic('dancing-and-courting', 'Dancing and Courting', 'Rince agus Suirí', 2027, 'The dance hall, the showband, the walk home.'),
  Topic('big-snow', 'The Big Snow, the Big Freeze, the Big Wind', 'An Sneachta Mór', 2027, '1947, 1963, 1982, 2010, Ophelia, Éowyn.'),
  Topic('the-match', 'The Match', 'An Cluiche', 2027, 'The county final, the day they got to Croke Park.'),
  Topic('the-spring-of-2020', 'The Spring of 2020', 'Earrach 2020', 2027, 'Where were they when the country stopped?'),
  Topic('coming-to-ireland', 'Coming to Ireland', 'Teacht go hÉirinn', 2027, 'Where did the family come from, and why? What was the first day like, what did they bring?'),
  Topic('what-to-remember', 'What They Want Remembered', 'Meabhrú', 2027, 'What should the people of 2117 know about this place?'),
];

/// Irish prompts for the headings, the same as the website (src/lib/i18n.ts PROMPT_GA). Keep in step.
const promptGa = <String, String>{
  'ghosts-and-fairies': "An raibh lios, sceach aonair nó teach ann nach rachadh éinne thairis san oíche? Cad a deirtí faoi?",
  'local-cures': "Cé aige a raibh an leigheas ar fhaithní, ar leonadh, ar an triuch? Cad a dhéanaidís?",
  'hidden-treasure': "Ar dúradh riamh go raibh ór curtha in aice láimhe? Ar thochail éinne ar a lorg?",
  'weather-lore': "Conas a bhí a fhios ag daoine go raibh báisteach chucu? Cad iad na comharthaí a léidís sa spéir, sna hainmhithe, sna cnoic?",
  'severe-weather': "An Sneachta Mór, Oíche na Gaoithe Móire, an tuile. Cad a tharla agus cé a bhí sáinnithe cá háit?",
  'festival-customs': "Cad a dhéantaí Lá Fhéile Bríde, Oíche Shamhna, Oíche Nollag, Oíche Bhealtaine, Oíche Fhéile Eoin?",
  'games-i-play': "Cad iad na cluichí a d'imrítí sa chlós, ar an mbóthar, sa pháirc? Cad iad na rialacha agus na rainn?",
  'the-local-forge': "Cá raibh an cheárta, an muileann, an uachtarlann, an siopa? Cé a bhí i mbun agus cad a tharlaíodh ann?",
  'old-schools': "Conas a bhí an scoil? An máistir, an siúl, an scláta, an bata, an fód móna don tine?",
  'the-famine': "Cad a deirtí sa teaghlach faoin nGorta, faoi theach na mbocht, faoin anraith, faoi na daoine a d'imigh?",
  'emigration': "Cé a chuaigh go Meiriceá, go Sasana, go dtí an Astráil? Ar tháinig siad ar ais? An raibh tórramh Meiriceánach ann?",
  'local-heroes': "Cé ba láidre, ba sciobtha, ba ghreannmhaire, an duine a mbíonn caint air fós?",
  'place-names': "Cad is ainm do na páirceanna, na toibreacha, na cnoic agus na crosbhóithre, agus cén fáth?",
  'proverbs-riddles': "Cad iad na seanfhocail a bhíodh ag do sheantuismitheoirí? Cad iad na tomhaiseanna a chuirtí cois tine?",
  'food': "Cad a d'ití, a bhácáiltí, a dhéantaí sa chuinneog, a shaillítí? Cad a bhí don dinnéar Domhnaigh? Cé a mharaigh an mhuc?",
  'crafts': "Tuíodóireacht, ciseáin, móin a bhaint agus a chnuchairt, féar a shábháil, sníomh. Cé a rinne é agus conas?",
  'marriage-customs': "Conas a bhuail daoine le chéile? Conas a bhí tórramh? An raibh babhtaí cleamhnais, buachaillí tuí, mná caointe ann?",
  'animals': "Cad a chreidtí faoin ngiorria, faoin snag breac, faoin spideog, faoin gcuach, faoin gcéad uan?",
  'funny-story': "An ceann a insítear fós faoi Nollaig. Inis é mar a insíonn siadsan é.",
  'the-day-the-power-came': "An Scéim Leictreachais Tuaithe, an chéad bholgán, an chéad teilifís, an chéad chuisneoir. Cé a chuimhníonn air?",
  'the-phone-and-the-car': "An chéad ghuthán sa bhaile fearainn, an chéad charr, an lá ar cuireadh tarra ar an mbóthar, an bus go dtí an baile mór.",
  'working-away': "Foirgnimh Londan, beáir Bhostún, na báid, an mhonarcha. Conas a bhí sé agus cad a cuireadh abhaile?",
  'dancing-and-courting': "An halla rince, an t-ollphuball, an seóbhanna, an siúl abhaile. Conas a bhuail siad le do sheanmháthair?",
  'big-snow': "1947, 1963, 1982, 2010, Ophelia, Éowyn. Cá raibh siad agus cad a rinne siad le haghaidh uisce agus aráin?",
  'the-match': "Cluiche ceannais an chontae, an iomaíocht idir paróistí, an lá a shroich siad Páirc an Chrócaigh, an achrann ina dhiaidh.",
  'the-spring-of-2020': "Cá raibh siad nuair a stad an tír? Cé a d'fhág na earraí ag an doras?",
  'coming-to-ireland': "Cad as ar tháinig an teaghlach, agus cén fáth? Cén chuma a bhí ar an gcéad lá anseo, cad a thug siad leo, agus cad a airíonn siad uathu?",
  'what-to-remember': "Cuir an cheist go díreach: cad ba cheart do mhuintir 2117 a bheith ar eolas acu faoin áit seo agus faoin teaghlach seo?",
};

String topicName(Topic t, String lang) => lang == 'ga' ? t.ga : t.name;
String topicOther(Topic t, String lang) => lang == 'ga' ? t.name : t.ga;
String topicPrompt(Topic t, String lang) => lang == 'ga' ? (promptGa[t.slug] ?? t.prompt) : t.prompt;

class Api {
  static const _timeout = Duration(seconds: 20);

  static Future<List<Townland>> townlands(String q) async {
    final r = await http.get(Uri.parse('$apiBase/api/townlands?q=${Uri.encodeQueryComponent(q)}'), headers: _headers).timeout(_timeout);
    if (r.statusCode != 200) return [];
    return (jsonDecode(r.body) as List).map((e) => Townland.fromJson(e)).toList();
  }

  static Future<List<Story>> stories({String? county, String? topic}) async {
    final u = Uri.parse('$apiBase/api/stories').replace(queryParameters: {if (county != null) 'county': county, if (topic != null) 'topic': topic, 'limit': '60'});
    final r = await http.get(u, headers: _headers).timeout(_timeout);
    if (r.statusCode != 200) throw Exception('Could not load the stories');
    return (jsonDecode(r.body) as List).map((e) => Story.fromJson(e)).toList();
  }

  static Future<Story> story(String id) async {
    final r = await http.get(Uri.parse('$apiBase/api/story/$id'), headers: _headers).timeout(_timeout);
    if (r.statusCode != 200) throw Exception('Not published');
    return Story.fromJson(jsonDecode(r.body));
  }

  /// Returns {id, keeper}. Throws [SubmitRejected] when the server refuses the story (fix and resend),
  /// anything else when it could not be reached (keep it in the outbox and try later).
  static Future<Map<String, String>> submit(Map<String, String> fields, {String? audioPath, List<String> photoPaths = const []}) async {
    final req = http.MultipartRequest('POST', Uri.parse('$apiBase/api/stories'))..headers.addAll(_headers);
    req.fields.addAll(fields);
    if (audioPath != null) req.files.add(await http.MultipartFile.fromPath('audio', audioPath, contentType: _mime(audioPath)));
    // The server checks the type, so it has to be sent: a bare upload arrives as application/octet-stream.
    for (final p in photoPaths) { req.files.add(await http.MultipartFile.fromPath('photo', p, contentType: _mime(p))); }
    final res = await http.Response.fromStream(await req.send().timeout(const Duration(minutes: 5)));
    Map<String, dynamic> j;
    try { j = jsonDecode(res.body); } catch (_) { throw Exception('The server sent back something unexpected (${res.statusCode})'); }
    if (res.statusCode == 201) return {'id': j['id'], 'keeper': j['keeper']};
    if (res.statusCode >= 400 && res.statusCode < 500 && res.statusCode != 429) throw SubmitRejected(j['error'] ?? 'Something is missing');
    throw Exception(j['error'] ?? 'The server could not take it just now');
  }

  static String audioUrl(String id) => '$apiBase/api/story/$id/media/audio';
  static String photoUrl(String id) => '$apiBase/api/story/$id/media/photo';
  static String storyUrl(String id) => '$apiBase/story/$id';
  static String keeperUrl(String id, String k) => '$apiBase/keep/$id?k=$k';
}

class SubmitRejected implements Exception {
  final String message;
  SubmitRejected(this.message);
  @override
  String toString() => message;
}

MediaType? _mime(String path) {
  final p = path.toLowerCase();
  final t = p.endsWith('.m4a') || p.endsWith('.mp4') ? 'audio/mp4' : p.endsWith('.png') ? 'image/png' : p.endsWith('.webp') ? 'image/webp' : p.endsWith('.jpg') || p.endsWith('.jpeg') ? 'image/jpeg' : null;
  return t == null ? null : MediaType.parse(t);
}
