import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'api.dart';
import 'strings.dart';
import 'theme.dart';

/// The 26 counties of the 1937 Schools' Collection (src/lib/townlands.ts COUNTIES).
const counties = ['Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow'];

class StoriesScreen extends StatefulWidget {
  const StoriesScreen({super.key});
  @override
  State<StoriesScreen> createState() => _StoriesScreenState();
}

class _StoriesScreenState extends State<StoriesScreen> {
  String? _county;
  late Future<List<Story>> _future = Api.stories();
  void _pick(String? c) => setState(() { _county = c; _future = Api.stories(county: c); });

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(s.theStories)),
    body: Column(children: [
      SizedBox(height: 56, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6), children: [
        Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(s.allIreland), selected: _county == null, onSelected: (_) => _pick(null))),
        for (final c in counties) Padding(padding: const EdgeInsets.only(right: 8), child: ChoiceChip(label: Text(s.county(c)), selected: _county == c, onSelected: (_) => _pick(c))),
      ])),
      Expanded(child: FutureBuilder<List<Story>>(future: _future, builder: (context, snap) {
        if (snap.hasError) return _Empty(text: s.loadFailed, action: TextButton(onPressed: () => _pick(_county), child: Text(s.tryAgain)));
        if (!snap.hasData) return const Center(child: CircularProgressIndicator(color: kGreen));
        final rows = snap.data!;
        if (rows.isEmpty) return _Empty(text: _county == null ? s.nothingYet : s.nothingFrom(_county!));
        return ListView.separated(padding: const EdgeInsets.fromLTRB(16, 6, 16, 30), itemCount: rows.length, separatorBuilder: (_, _) => const SizedBox(height: 8), itemBuilder: (_, i) {
          final st = rows[i];
          return Card(child: ListTile(contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            title: Text(st.title, style: display(18)),
            subtitle: Padding(padding: const EdgeInsets.only(top: 4), child: Text('${st.townlandEn}, ${s.coOf(st.county)} · ${s.toldBy(st.tellerName, st.tellerBorn)}', style: const TextStyle(color: kMuted))),
            trailing: st.hasAudio ? const Icon(Icons.graphic_eq, color: kGreen) : null,
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => StoryScreen(story: st)))));
        });
      })),
    ]),
  );
}

class _Empty extends StatelessWidget {
  final String text; final Widget? action;
  const _Empty({required this.text, this.action});
  @override
  Widget build(BuildContext context) => Center(child: Padding(padding: const EdgeInsets.all(28), child: Column(mainAxisSize: MainAxisSize.min, children: [
    Text(text, textAlign: TextAlign.center, style: display(20, color: kMuted, weight: FontWeight.w500)), ?action,
  ])));
}

class StoryScreen extends StatefulWidget {
  final Story story;
  const StoryScreen({super.key, required this.story});
  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen> {
  final _player = AudioPlayer();
  bool _playing = false;
  @override
  void initState() { super.initState(); _player.onPlayerComplete.listen((_) { if (mounted) setState(() => _playing = false); }); }
  @override
  void dispose() { _player.dispose(); super.dispose(); }

  Future<void> _listen() async {
    if (_playing) { await _player.stop(); setState(() => _playing = false); return; }
    setState(() => _playing = true);
    try { await _player.play(UrlSource(Api.audioUrl(widget.story.id))); }
    catch (_) { if (mounted) { setState(() => _playing = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.cantPlay))); } }
  }

  @override
  Widget build(BuildContext context) {
    final st = widget.story;
    final topic = topics.where((x) => x.slug == st.topic);
    final heading = st.topic == 'custom' ? (st.topicCustom ?? s.ownHeading) : topic.isNotEmpty ? topicName(topic.first, lang.value) : '';
    return Scaffold(
      appBar: AppBar(actions: [IconButton(icon: const Icon(Icons.ios_share), tooltip: s.share, onPressed: () => Share.share(s.shareText(st.title, st.tellerName, '${st.townlandEn}, ${s.coOf(st.county)}', Api.storyUrl(st.id))))]),
      body: Ruled(child: ListView(padding: const EdgeInsets.fromLTRB(20, 4, 20, 40), children: [
        Text('${heading.toUpperCase()} · ${st.townlandEn.toUpperCase()}, ${s.coOf(st.county).toUpperCase()}', style: kicker()),
        const SizedBox(height: 8),
        Text(st.title, style: display(32)),
        const SizedBox(height: 8),
        Text(s.toldTo(st.tellerName, st.tellerBorn, st.collectorName, st.school), style: const TextStyle(color: kMuted, fontSize: 15)),
        const SizedBox(height: 16),
        if (st.hasPhoto) Padding(padding: const EdgeInsets.only(bottom: 16), child: ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.network(Api.photoUrl(st.id), headers: mediaHeaders, fit: BoxFit.cover,
            errorBuilder: (_, _, _) => const SizedBox.shrink()))),
        if (st.hasAudio) Padding(padding: const EdgeInsets.only(bottom: 16), child: FilledButton.icon(onPressed: _listen, icon: Icon(_playing ? Icons.stop : Icons.play_arrow), label: Text(_playing ? s.stop : s.listenTo(st.tellerName)))),
        for (final p in st.body.split(RegExp(r'\n\s*\n'))) Padding(padding: const EdgeInsets.only(bottom: 14), child: Text(p.trim(), style: display(19, weight: FontWeight.w400).copyWith(height: 1.55))),
      ])),
    );
  }
}
