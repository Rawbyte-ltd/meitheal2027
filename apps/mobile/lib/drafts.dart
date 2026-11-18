import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'strings.dart';

/// A story being collected. Saved on the phone after every step, with its recording and photos in the app's own
/// folder, so a closed app or a field with no signal loses nothing. status: 'draft' (still being filled in) or
/// 'outbox' (finished, waiting to send).
class Draft {
  final String id;
  final DateTime created;
  String status = 'draft', step = 'who';
  String? error;
  String teller = '', relation = '', born = '', topic = '', topicCustom = '', title = '', body = '', lang = 'en';
  /// lang 'other' names the language in [langOther]. A story from outside Ireland gives its town and country; the townland stays.
  String langOther = '', fromPlace = '', fromCountry = '';
  Townland? townland;
  String collector = '', age = '', school = '', email = '', consentName = '';
  bool consent = false;
  String? audioPath;
  int seconds = 0;
  List<String> photos = [];

  Draft(this.id, this.created);
  factory Draft.fresh({String? topic}) => Draft(DateTime.now().millisecondsSinceEpoch.toString(), DateTime.now())..topic = topic ?? ''..lang = uiLang;

  /// What the server calls the submission, from what was brought.
  String get mode => audioPath != null ? 'record' : photos.isNotEmpty && body.trim().length < 80 ? 'photo' : 'write';
  int get minBody => mode == 'write' ? 80 : 20;
  String get label => title.isNotEmpty ? title : teller.isNotEmpty ? s.storyOf(teller) : s.unnamed;

  Map<String, String> fields() => {
    'mode': mode, 'topic': topic, 'topic_custom': topicCustom, 'title': title, 'body': body, 'lang': lang, 'lang_other': langOther,
    'from_place': fromPlace, 'from_country': fromCountry,
    'county': townland?.co ?? '', 'townland': townland?.slug ?? '',
    'teller_name': teller, 'teller_born': born, 'teller_relation': relation, 'collector_name': collector, 'collector_age': age,
    'school': school, 'contact_email': email, 'consent_name': consentName, 'consent': consent ? 'on' : '', 'consent_version': kConsentVersion, 'ui_lang': uiLang,
  };

  Map<String, dynamic> toJson() => {
    'id': id, 'created': created.toIso8601String(), 'status': status, 'step': step, 'error': error,
    'teller': teller, 'relation': relation, 'born': born, 'topic': topic, 'topicCustom': topicCustom, 'title': title, 'body': body, 'lang': lang, 'langOther': langOther, 'fromPlace': fromPlace, 'fromCountry': fromCountry,
    'townland': townland == null ? null : {'en': townland!.en, 'ga': townland!.ga, 'co': townland!.co, 'slug': townland!.slug, 'ed': townland!.ed, 'kind': townland!.kind},
    'collector': collector, 'age': age, 'school': school, 'email': email, 'consentName': consentName, 'consent': consent,
    'audioPath': audioPath, 'seconds': seconds, 'photos': photos,
  };

  factory Draft.fromJson(Map<String, dynamic> j) => Draft(j['id'], DateTime.parse(j['created']))
    ..status = j['status'] ?? 'draft'..step = j['step'] ?? 'who'..error = j['error']
    ..teller = j['teller'] ?? ''..relation = j['relation'] ?? ''..born = j['born'] ?? ''..topic = j['topic'] ?? ''..topicCustom = j['topicCustom'] ?? ''
    ..title = j['title'] ?? ''..body = j['body'] ?? ''..lang = j['lang'] ?? 'en'
    ..langOther = j['langOther'] ?? ''..fromPlace = j['fromPlace'] ?? ''..fromCountry = j['fromCountry'] ?? ''
    ..townland = j['townland'] == null ? null : Townland.fromJson(Map<String, dynamic>.from(j['townland']))
    ..collector = j['collector'] ?? ''..age = j['age'] ?? ''..school = j['school'] ?? ''..email = j['email'] ?? ''..consentName = j['consentName'] ?? ''..consent = j['consent'] == true
    ..audioPath = j['audioPath']..seconds = j['seconds'] ?? 0..photos = List<String>.from(j['photos'] ?? const []);
}

class Kept {
  final String id, keeper, title;
  Kept(this.id, this.keeper, this.title);
}

class Store {
  static const _drafts = 'drafts', _keepers = 'keepers', _lastTownland = 'last_townland';

  static Future<List<Draft>> drafts() async {
    final p = await SharedPreferences.getInstance();
    return (p.getStringList(_drafts) ?? []).map((s) { try { return Draft.fromJson(jsonDecode(s)); } catch (_) { return null; } }).whereType<Draft>().toList();
  }

  static Future<void> save(Draft d) async {
    final p = await SharedPreferences.getInstance();
    final all = await drafts();
    final i = all.indexWhere((x) => x.id == d.id);
    if (i >= 0) { all[i] = d; } else { all.insert(0, d); }
    await p.setStringList(_drafts, all.map((x) => jsonEncode(x.toJson())).toList());
    if (d.townland != null) await p.setString(_lastTownland, jsonEncode(d.toJson()['townland']));
  }

  /// The townland the last saved story was collected in, offered as the start for the next one.
  static Future<Townland?> lastTownland() async {
    final p = await SharedPreferences.getInstance();
    final s = p.getString(_lastTownland);
    if (s == null) return null;
    try { return Townland.fromJson(Map<String, dynamic>.from(jsonDecode(s))); } catch (_) { return null; }
  }

  static Future<void> discard(Draft d) async {
    final p = await SharedPreferences.getInstance();
    final all = (await drafts())..removeWhere((x) => x.id == d.id);
    await p.setStringList(_drafts, all.map((x) => jsonEncode(x.toJson())).toList());
    final dir = await folder(d);
    if (await dir.exists()) await dir.delete(recursive: true);
  }

  /// The draft's own folder for its recording and photos (not the temp folder, which the system can empty).
  static Future<Directory> folder(Draft d) async {
    final base = await getApplicationDocumentsDirectory();
    return Directory('${base.path}/drafts/${d.id}').create(recursive: true);
  }

  static Future<String> keepFile(Draft d, String from, String name) async {
    final dir = await folder(d);
    final to = '${dir.path}/$name';
    if (from != to) await File(from).copy(to);
    return to;
  }

  static Future<List<Kept>> kept() async {
    final p = await SharedPreferences.getInstance();
    return (p.getStringList(_keepers) ?? []).map((s) { final x = s.split('|'); return Kept(x[0], x.length > 1 ? x[1] : '', x.length > 2 ? x.sublist(2).join('|') : x[0]); }).toList();
  }

  static Future<void> addKept(String id, String keeper, String title) async {
    final p = await SharedPreferences.getInstance();
    await p.setStringList(_keepers, ['$id|$keeper|$title', ...(p.getStringList(_keepers) ?? [])]);
  }
}

enum Sent { ok, rejected, offline }

class SendResult {
  final Sent outcome;
  final String? id, keeper, message;
  SendResult(this.outcome, {this.id, this.keeper, this.message});
}

/// Try to send a finished story. On success it moves to "My stories"; if the server turns it down it goes back to
/// being a draft with the reason; if there is no signal it waits in the outbox.
Future<SendResult> send(Draft d) async {
  d.status = 'outbox';
  await Store.save(d);
  try {
    final r = await Api.submit(d.fields(), audioPath: d.audioPath, photoPaths: d.photos);
    await Store.addKept(r['id']!, r['keeper']!, d.label);
    await Store.discard(d);
    return SendResult(Sent.ok, id: r['id'], keeper: r['keeper']);
  } on SubmitRejected catch (e) {
    d..status = 'draft'..error = e.message;
    await Store.save(d);
    return SendResult(Sent.rejected, message: e.message);
  } catch (_) {
    d.error = null;
    await Store.save(d);
    return SendResult(Sent.offline);
  }
}

/// Send everything waiting in the outbox. Returns how many went.
Future<int> sendOutbox() async {
  var n = 0;
  for (final d in (await Store.drafts()).where((x) => x.status == 'outbox')) {
    if ((await send(d)).outcome == Sent.ok) n++;
  }
  return n;
}
