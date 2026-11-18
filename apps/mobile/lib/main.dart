import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'collect.dart';
import 'drafts.dart';
import 'stories_screen.dart';
import 'strings.dart';
import 'theme.dart';

/// Shown at the foot of the home screen so a tester can tell which build is installed. Keep in step with pubspec.yaml.
const appVersion = '0.2.6';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await loadLang();
  runApp(const MeithealApp());
}

class MeithealApp extends StatelessWidget {
  const MeithealApp({super.key});
  @override
  // The whole app rebuilds when the language changes.
  Widget build(BuildContext context) => ValueListenableBuilder<String>(valueListenable: lang, builder: (_, _, _) =>
      MaterialApp(title: 'Meitheal 2027', debugShowCheckedModeBanner: false, theme: meithealTheme(), home: const HomeScreen()));
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  List<Draft> _drafts = [];
  List<Kept> _kept = [];
  bool _sending = false;

  @override
  void initState() { super.initState(); WidgetsBinding.instance.addObserver(this); lang.addListener(_relang); _load(flush: true); }
  // The home screen is const, so the app rebuilding is not enough: redraw it when the language changes.
  void _relang() { if (mounted) setState(() {}); }
  @override
  void dispose() { WidgetsBinding.instance.removeObserver(this); lang.removeListener(_relang); super.dispose(); }
  @override
  void didChangeAppLifecycleState(AppLifecycleState s) { if (s == AppLifecycleState.resumed) _load(flush: true); }

  /// Reload, and if anything is waiting in the outbox, try to send it.
  Future<void> _load({bool flush = false}) async {
    final d = await Store.drafts(), k = await Store.kept();
    if (!mounted) return;
    setState(() { _drafts = d; _kept = k; });
    if (flush && d.any((x) => x.status == 'outbox') && !_sending) await _flush(quiet: true);
  }

  Future<void> _flush({bool quiet = false}) async {
    setState(() => _sending = true);
    final n = await sendOutbox();
    if (!mounted) return;
    setState(() => _sending = false);
    await _load();
    if (!mounted) return;
    final left = _drafts.where((x) => x.status == 'outbox').length;
    if (n > 0 || !quiet) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(n > 0 ? s.sentN(n, left) : s.stillNoSignal)));
    }
  }

  Future<void> _collect([Draft? d]) async {
    // A new story starts on the townland the last one was collected in, so a class doing a few picks it once.
    final draft = d ?? (Draft.fresh()..townland = await Store.lastTownland());
    await Navigator.push(context, MaterialPageRoute(builder: (_) => CollectFlow(draft: draft)));
    _load();
  }

  Future<void> _discard(Draft d) async {
    final ok = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(backgroundColor: kCard, title: Text(s.throwAway),
        content: Text(s.willDelete(d.label)),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(s.keepIt)), FilledButton(style: FilledButton.styleFrom(backgroundColor: kRed), onPressed: () => Navigator.pop(ctx, true), child: Text(s.delete))]));
    if (ok == true) { await Store.discard(d); _load(); }
  }

  @override
  Widget build(BuildContext context) {
    final outbox = _drafts.where((x) => x.status == 'outbox').toList(), unfinished = _drafts.where((x) => x.status == 'draft').toList();
    return Scaffold(
      appBar: AppBar(title: RichText(text: TextSpan(style: display(22), children: [const TextSpan(text: 'Meitheal '), TextSpan(text: '2027', style: display(22, color: kRed, style: FontStyle.italic, weight: FontWeight.w500))])), actions: [
        TextButton(onPressed: () => setLang(s.switchToCode), child: Text(s.switchTo, style: const TextStyle(fontWeight: FontWeight.w700))),
        TextButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StoriesScreen())), icon: const Icon(Icons.menu_book_outlined), label: Text(s.read)),
      ]),
      body: Ruled(child: RefreshIndicator(color: kGreen, onRefresh: () => _load(flush: true), child: ListView(padding: const EdgeInsets.fromLTRB(20, 8, 20, 40), children: [
        Text(s.kicker, style: kicker()),
        const SizedBox(height: 10),
        RichText(text: TextSpan(style: display(40), children: [TextSpan(text: s.h1a), TextSpan(text: s.h1em, style: display(40, color: kGreen, style: FontStyle.italic, weight: FontWeight.w500)), TextSpan(text: s.h1b)])),
        const SizedBox(height: 12),
        Text(s.lead, style: const TextStyle(fontSize: 16.5, color: kMuted, height: 1.45)),
        const SizedBox(height: 22),
        Padding(padding: const EdgeInsets.symmetric(horizontal: 18), child: TapedPhoto(asset: 'assets/photos/school-700.jpg', caption: s.schoolCaption, tilt: -2)),
        const SizedBox(height: 26),
        FilledButton.icon(onPressed: () => _collect(), icon: const Icon(Icons.mic, size: 26), label: Text(s.recordStory),
            style: FilledButton.styleFrom(backgroundColor: kRed, minimumSize: const Size.fromHeight(64), textStyle: display(21))),
        const SizedBox(height: 10),
        OutlinedButton.icon(onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const StoriesScreen())), icon: const Icon(Icons.map_outlined), label: Text(s.readNear)),

        if (outbox.isNotEmpty) ...[
          _head(s.waiting),
          Card(color: const Color(0xFFFBF1DE), child: ListTile(leading: const Icon(Icons.outbox_outlined, color: kGold),
            title: Text(s.savedOnPhone(outbox.length)),
            subtitle: Text(s.sendThemselves),
            trailing: TextButton(onPressed: _sending ? null : () => _flush(), child: Text(_sending ? s.sending : s.sendNow)))),
        ],
        if (unfinished.isNotEmpty) ...[
          _head(s.notFinished),
          for (final d in unfinished) Padding(padding: const EdgeInsets.only(bottom: 8), child: Card(child: ListTile(
            leading: Icon(d.audioPath != null ? Icons.mic : Icons.edit_note, color: kGreen),
            title: Text(d.label, style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text(d.error ?? s.carryOn, style: TextStyle(color: d.error != null ? kRed : kMuted)),
            trailing: IconButton(icon: const Icon(Icons.delete_outline), tooltip: s.delete, onPressed: () => _discard(d)),
            onTap: () => _collect(d)))),
        ],
        if (_kept.isNotEmpty) ...[
          _head(s.myStories),
          for (final k in _kept) Padding(padding: const EdgeInsets.only(bottom: 8), child: Card(child: ListTile(
            leading: const Icon(Icons.auto_stories_outlined, color: kBlue),
            title: Text(k.title, style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text(s.readPrint),
            trailing: const Icon(Icons.open_in_new, size: 18),
            onTap: () => launchUrl(Uri.parse(Api.keeperUrl(k.id, k.keeper)), mode: LaunchMode.externalApplication)))),
        ],

        _head(s.howTo),
        const _Tips(),
        Padding(padding: const EdgeInsets.only(top: 24), child: Center(child: Text('Meitheal 2027 · $appVersion', style: const TextStyle(color: kMuted, fontSize: 12)))),
      ]))),
    );
  }

  Widget _head(String t) => Padding(padding: const EdgeInsets.only(top: 30, bottom: 10), child: Text(t, style: kicker()));
}

class _Tips extends StatelessWidget {
  const _Tips();
  @override
  Widget build(BuildContext context) => Column(children: [
    for (final (t, sub) in s.tips) Padding(padding: const EdgeInsets.only(bottom: 8), child: Card(child: Padding(padding: const EdgeInsets.all(14), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(width: 4, height: 40, margin: const EdgeInsets.only(right: 12, top: 2), color: kRed),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(t, style: display(18)), const SizedBox(height: 3), Text(sub, style: const TextStyle(color: kMuted, height: 1.4))])),
    ])))),
    const SizedBox(height: 10),
    Center(child: SizedBox(width: 230, child: TapedPhoto(asset: 'assets/photos/doorway-700.jpg', caption: s.doorCaption, tilt: 1.5))),
  ]);
}
