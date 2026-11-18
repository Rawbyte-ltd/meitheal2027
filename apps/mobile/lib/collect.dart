import 'dart:async';
import 'dart:io';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:record/record.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'drafts.dart';
import 'strings.dart';
import 'theme.dart';

/// Collecting a story, one small step at a time: who is telling, what to ask, the recording, where it belongs,
/// and the grown-up's part. The draft is saved at every step.
class CollectFlow extends StatefulWidget {
  final Draft draft;
  const CollectFlow({super.key, required this.draft});
  @override
  State<CollectFlow> createState() => _CollectFlowState();
}

const _steps = ['who', 'topic', 'record', 'where', 'grownup'];


class _CollectFlowState extends State<CollectFlow> {
  late final Draft d = widget.draft;
  late int _i = _steps.indexOf(d.step).clamp(0, _steps.length - 1);
  int _dir = 1; // which way the page turns: 1 forward, -1 back
  bool _recording = false, _sending = false;
  Timer? _auto;

  @override
  void dispose() { _auto?.cancel(); super.dispose(); }

  Future<void> _save() async { d.step = _steps[_i]; await Store.save(d); }

  String? _problem() {
    switch (_steps[_i]) {
      case 'who': return d.teller.trim().isEmpty ? s.needTeller : null;
      case 'topic':
        if (d.topic.isEmpty) return s.needTopic;
        if (d.topic == 'custom' && d.topicCustom.trim().length < 3) return s.needOwn;
        return null;
      case 'record': return _recording ? s.stopFirst : null;
      case 'where':
        if (d.title.trim().length < 2) return s.needTitle;
        if (d.townland == null) return s.needTownland;
        if (d.fromPlace.trim().isNotEmpty && d.fromCountry.trim().isEmpty) return s.needFarCountry;
        if (d.lang == 'other' && d.langOther.trim().length < 2) return s.needLangOther;
        if (d.body.trim().length < d.minBody) return d.mode == 'write' ? s.needStory : s.needNote;
        if (RegExp(r'\b(?:\d[ -]?){9,}\b').hasMatch(d.body)) return s.noPhones;
        return null;
      case 'grownup':
        if (d.collector.trim().isEmpty) return s.needCollector;
        if (d.consentName.trim().isEmpty) return s.needConsentName;
        if (!d.consent) return s.needConsent;
        return null;
    }
    return null;
  }

  void _say(String m) => ScaffoldMessenger.of(context)..hideCurrentSnackBar()..showSnackBar(SnackBar(content: Text(m)));

  Future<void> _next() async {
    _auto?.cancel();
    final p = _problem();
    if (p != null) { _say(p); return; }
    if (_i < _steps.length - 1) { setState(() { _dir = 1; _i++; }); await _save(); return; }
    await _send();
  }

  /// A step whose last choice has just been made turns the page by itself, after a beat so the tap is seen to land.
  /// Only when the step is complete: it never nags, and the Next button is always there. The last step is sent by hand.
  void _autoNext() {
    _auto?.cancel();
    if (_i >= _steps.length - 1 || _problem() != null) return;
    _auto = Timer(const Duration(milliseconds: 380), () { if (mounted && !_sending && _problem() == null) _next(); });
  }

  Future<void> _back() async {
    _auto?.cancel();
    if (_recording) { _say(s.stopFirst); return; }
    if (_i == 0) { await _save(); if (mounted) Navigator.pop(context); return; }
    setState(() { _dir = -1; _i--; }); await _save();
  }

  Future<void> _send() async {
    setState(() => _sending = true);
    final r = await send(d);
    if (!mounted) return;
    setState(() => _sending = false);
    if (r.outcome == Sent.rejected) { _say(r.message ?? s.somethingMissing); return; }
    await showDialog(context: context, barrierDismissible: false, builder: (ctx) => AlertDialog(
      backgroundColor: kCard,
      title: Text(r.outcome == Sent.ok ? s.inCopybook : s.savedPhone, style: display(24)),
      content: Text(r.outcome == Sent.ok ? s.thanks(d.teller) : s.noSignal),
      actions: [
        if (r.outcome == Sent.ok) TextButton(onPressed: () => launchUrl(Uri.parse(Api.keeperUrl(r.id!, r.keeper!)), mode: LaunchMode.externalApplication), child: Text(s.seeIt)),
        FilledButton(onPressed: () => Navigator.pop(ctx), child: Text(s.done)),
      ],
    ));
    if (mounted) Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final last = _i == _steps.length - 1;
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) { if (!didPop) _back(); },
      child: Scaffold(
        appBar: AppBar(
          leading: IconButton(icon: const Icon(Icons.arrow_back), tooltip: s.back, onPressed: _back),
          title: Text(s.stepNames[_i]),
          bottom: PreferredSize(preferredSize: const Size.fromHeight(28), child: Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 10), child: Row(children: [
            for (var n = 0; n < _steps.length; n++) Expanded(child: AnimatedContainer(duration: const Duration(milliseconds: 260), height: 6, margin: const EdgeInsets.symmetric(horizontal: 3), decoration: BoxDecoration(color: n <= _i ? kGreen : kLine, borderRadius: BorderRadius.circular(3)))),
          ]))),
        ),
        body: Ruled(child: SafeArea(child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 260),
          switchInCurve: Curves.easeOutCubic, switchOutCurve: Curves.easeInCubic,
          transitionBuilder: (child, anim) => FadeTransition(opacity: anim, child: SlideTransition(
              position: Tween<Offset>(begin: Offset(0.12 * _dir, 0), end: Offset.zero).animate(anim), child: child)),
          // Each step is its own page: it starts at the top, not where the last one was scrolled to.
          child: ListView(key: ValueKey(_i), padding: const EdgeInsets.fromLTRB(20, 12, 20, 24), children: [
            switch (_steps[_i]) {
              'who' => _Who(d: d, onChanged: () => setState(() {}), onDone: _autoNext),
              'topic' => _TopicStep(d: d, onChanged: () => setState(() {}), onDone: _autoNext),
              'record' => _RecordStep(d: d, onRecording: (r) => setState(() => _recording = r), onChanged: _save),
              'where' => _Where(d: d, onChanged: () => setState(() {}), onDone: _autoNext),
              _ => _GrownUp(d: d, onChanged: () => setState(() {})),
            },
          ]),
        ))),
        bottomNavigationBar: SafeArea(child: Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 12), child: Row(children: [
          Expanded(child: OutlinedButton(onPressed: _sending ? null : _back, child: Text(_i == 0 ? s.later : s.back))),
          const SizedBox(width: 12),
          Expanded(flex: 2, child: FilledButton(onPressed: _sending ? null : _next, style: last ? FilledButton.styleFrom(backgroundColor: kRed) : null,
              child: Text(_sending ? s.sending : last ? s.sendIt : s.next))),
        ]))),
      ),
    );
  }
}

Widget _q(String big, [String? small]) => Padding(padding: const EdgeInsets.only(bottom: 16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
  Text(big, style: display(28)),
  if (small != null) Padding(padding: const EdgeInsets.only(top: 8), child: Text(small, style: const TextStyle(color: kMuted, fontSize: 16, height: 1.4))),
]));

Widget _label(String t) => Padding(padding: const EdgeInsets.only(top: 18, bottom: 8), child: Text(t, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)));

Widget _chips(List<String> options, String value, void Function(String) pick, {String Function(String)? label}) => Wrap(spacing: 8, runSpacing: 8, children: [
  for (final o in options) ChoiceChip(label: Text(label?.call(o) ?? o), selected: value == o, onSelected: (_) => pick(o)),
]);

class _Who extends StatelessWidget {
  final Draft d; final VoidCallback onChanged, onDone;
  const _Who({required this.d, required this.onChanged, required this.onDone});
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _q(s.whoQ, s.whoSub),
    TextFormField(initialValue: d.teller, autofocus: d.teller.isEmpty, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.done,
        style: const TextStyle(fontSize: 20), decoration: InputDecoration(hintText: s.whoHint), onChanged: (v) { d.teller = v; onChanged(); }),
    _label(s.whoTo),
    _chips(['grandmother', 'grandfather', 'great-grandparent', 'aunt or uncle', 'neighbour', 'family friend', 'other'], d.relation, (v) { d.relation = v; onChanged(); }, label: s.relation),
    _label(s.whenBorn),
    _chips(['1920s', '1930s', '1940s', '1950s', '1960s', '1970s', '1980s', 'later', ''], d.born, (v) { d.born = v; onChanged(); onDone(); }, label: s.decade),
  ]);
}

class _TopicStep extends StatelessWidget {
  final Draft d; final VoidCallback onChanged, onDone;
  const _TopicStep({required this.d, required this.onChanged, required this.onDone});
  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _q(s.askAbout(s.them(d.teller)), s.askSub),
      OutlinedButton.icon(icon: const Icon(Icons.casino_outlined), label: Text(s.pickForMe), onPressed: () { d.topic = (topics.toList()..shuffle()).first.slug; onChanged(); onDone(); }),
      const SizedBox(height: 12),
      for (final t in topics) Padding(padding: const EdgeInsets.only(bottom: 8), child: _TopicCard(t: t, on: d.topic == t.slug, onTap: () { d.topic = t.slug; onChanged(); onDone(); })),
      _TopicCard(t: Topic('custom', s.ownHeading, s.ownHeading, 2027, s.ownHeadingSub), on: d.topic == 'custom', onTap: () { d.topic = 'custom'; onChanged(); }),
      if (d.topic == 'custom') Padding(padding: const EdgeInsets.only(top: 10), child: TextFormField(initialValue: d.topicCustom, autofocus: d.topicCustom.isEmpty, maxLength: 60, textInputAction: TextInputAction.done,
          decoration: InputDecoration(hintText: s.ownHint), onChanged: (v) { d.topicCustom = v; onChanged(); }, onFieldSubmitted: (_) => onDone())),
    ]);
  }
}

class _TopicCard extends StatelessWidget {
  final Topic t; final bool on; final VoidCallback onTap;
  const _TopicCard({required this.t, required this.on, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(color: on ? kGreen : kCard, borderRadius: BorderRadius.circular(14), child: InkWell(borderRadius: BorderRadius.circular(14), onTap: onTap, child: Container(
    padding: const EdgeInsets.all(14), decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: on ? kGreen : kLine)),
    child: Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(topicName(t, lang.value), style: display(19, color: on ? Colors.white : kInk)),
        if (t.ga.isNotEmpty && t.slug != 'custom') Text(topicOther(t, lang.value), style: display(14, color: on ? Colors.white70 : kMuted, style: FontStyle.italic, weight: FontWeight.w500)),
        const SizedBox(height: 4),
        Text(topicPrompt(t, lang.value), style: TextStyle(color: on ? Colors.white : kMuted, fontSize: 14.5, height: 1.35)),
      ])),
      const SizedBox(width: 10),
      Text('${t.era}', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: on ? Colors.white : t.era == 1937 ? kGold : kBlue)),
    ]),
  )));
}

class _RecordStep extends StatefulWidget {
  final Draft d; final void Function(bool) onRecording; final Future<void> Function() onChanged;
  const _RecordStep({required this.d, required this.onRecording, required this.onChanged});
  @override
  State<_RecordStep> createState() => _RecordStepState();
}

class _RecordStepState extends State<_RecordStep> {
  static const _max = 30 * 60; // the server takes 12 MB, which is about half an hour at this quality
  final _rec = AudioRecorder();
  final _player = AudioPlayer();
  Timer? _tick;
  StreamSubscription<Amplitude>? _amp;
  bool _on = false, _paused = false, _playing = false;
  int _secs = 0, _ask = 0;
  double _level = 0;
  Draft get d => widget.d;

  @override
  void initState() { super.initState(); _secs = d.seconds; _player.onPlayerComplete.listen((_) { if (mounted) setState(() => _playing = false); }); }
  @override
  void dispose() { _tick?.cancel(); _amp?.cancel(); _rec.dispose(); _player.dispose(); super.dispose(); }

  List<String> get _prompts {
    final t = topics.where((x) => x.slug == d.topic);
    return [if (t.isNotEmpty) topicPrompt(t.first, lang.value), ...s.followUps];
  }

  Future<void> _start() async {
    if (!await _rec.hasPermission()) { _say(s.micNeeded); return; }
    final dir = await Store.folder(d);
    final path = '${dir.path}/recording-${DateTime.now().millisecondsSinceEpoch}.m4a';
    await _rec.start(const RecordConfig(encoder: AudioEncoder.aacLc, bitRate: 48000, sampleRate: 22050, numChannels: 1), path: path);
    if (d.audioPath != null) { try { await File(d.audioPath!).delete(); } catch (_) {} }
    d..audioPath = null..seconds = 0;
    _amp = _rec.onAmplitudeChanged(const Duration(milliseconds: 120)).listen((a) { if (mounted) setState(() => _level = ((a.current + 50) / 50).clamp(0, 1)); });
    setState(() { _on = true; _paused = false; _secs = 0; });
    widget.onRecording(true);
    _tick = Timer.periodic(const Duration(seconds: 1), (_) { if (_paused) return; setState(() => _secs++); if (_secs >= _max) _stop(); });
  }

  Future<void> _pause() async {
    if (_paused) { await _rec.resume(); } else { await _rec.pause(); }
    setState(() { _paused = !_paused; _level = 0; });
  }

  Future<void> _stop() async {
    _tick?.cancel(); await _amp?.cancel();
    final p = await _rec.stop();
    d..audioPath = p..seconds = _secs;
    setState(() { _on = false; _paused = false; _level = 0; });
    widget.onRecording(false);
    await widget.onChanged();
  }

  Future<void> _play() async {
    if (_playing) { await _player.stop(); setState(() => _playing = false); return; }
    await _player.play(DeviceFileSource(d.audioPath!));
    setState(() => _playing = true);
  }

  Future<void> _photo(ImageSource src) async {
    final x = await ImagePicker().pickImage(source: src, maxWidth: 1800, imageQuality: 85);
    if (x == null) return;
    final kept = await Store.keepFile(d, x.path, 'photo-${DateTime.now().millisecondsSinceEpoch}.jpg');
    setState(() => d.photos.add(kept));
    await widget.onChanged();
  }

  void _say(String m) => ScaffoldMessenger.of(context)..hideCurrentSnackBar()..showSnackBar(SnackBar(content: Text(m)));

  @override
  Widget build(BuildContext context) {
    final mm = '${_secs ~/ 60}:${(_secs % 60).toString().padLeft(2, '0')}';
    final has = d.audioPath != null && !_on;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _q(_on ? s.listening : has ? s.gotIt : s.pressAndTalk(s.them(d.teller)), _on ? s.listeningSub : has ? s.gotItSub : s.pressSub),
      Center(child: Column(children: [
        GestureDetector(
          onTap: _on ? _stop : _start,
          child: AnimatedContainer(duration: const Duration(milliseconds: 120), width: 150 + _level * 26, height: 150 + _level * 26,
            decoration: BoxDecoration(shape: BoxShape.circle, color: _on ? kRed.withValues(alpha: .16) : Colors.transparent),
            alignment: Alignment.center,
            child: Container(width: 128, height: 128, decoration: BoxDecoration(shape: BoxShape.circle, color: kRed, boxShadow: const [BoxShadow(color: Color(0x40D9534F), blurRadius: 24, offset: Offset(0, 10))]),
              child: Icon(_on ? Icons.stop_rounded : Icons.mic, color: Colors.white, size: 60, semanticLabel: _on ? s.stopRec : s.startRec)),
          ),
        ),
        const SizedBox(height: 10),
        Text(_on ? (_paused ? s.paused(mm) : mm) : has ? s.recorded(mm) : s.tapToRecord, style: display(22, color: _on ? kRed : kInk)),
        if (_on) Padding(padding: const EdgeInsets.only(top: 8), child: TextButton.icon(onPressed: _pause, icon: Icon(_paused ? Icons.play_arrow : Icons.pause), label: Text(_paused ? s.carryOnRec : s.pause))),
        if (has) Padding(padding: const EdgeInsets.only(top: 8), child: Wrap(spacing: 10, children: [
          OutlinedButton.icon(onPressed: _play, icon: Icon(_playing ? Icons.stop : Icons.play_arrow), label: Text(_playing ? s.stop : s.listenBack)),
          OutlinedButton.icon(onPressed: _start, icon: const Icon(Icons.refresh), label: Text(s.recordAgain)),
        ])),
      ])),
      const SizedBox(height: 22),
      Card(color: kPaper2, child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(s.askThem, style: kicker()),
        const SizedBox(height: 8),
        Text(_prompts[_ask % _prompts.length], style: display(21, weight: FontWeight.w500)),
        Align(alignment: Alignment.centerRight, child: TextButton(onPressed: () => setState(() => _ask++), child: Text(s.another))),
      ]))),
      _label(s.photos),
      Text(s.photosSub, style: const TextStyle(color: kMuted)),
      const SizedBox(height: 10),
      Wrap(spacing: 10, runSpacing: 10, children: [
        for (final p in d.photos) Stack(children: [
          ClipRRect(borderRadius: BorderRadius.circular(10), child: Image.file(File(p), width: 92, height: 92, fit: BoxFit.cover)),
          Positioned(right: 2, top: 2, child: InkWell(onTap: () async { setState(() => d.photos.remove(p)); await widget.onChanged(); }, child: const CircleAvatar(radius: 13, backgroundColor: Colors.black54, child: Icon(Icons.close, size: 16, color: Colors.white)))),
        ]),
        if (d.photos.length < 4) ...[
          OutlinedButton.icon(onPressed: () => _photo(ImageSource.camera), icon: const Icon(Icons.photo_camera_outlined), label: Text(s.takeOne)),
          OutlinedButton.icon(onPressed: () => _photo(ImageSource.gallery), icon: const Icon(Icons.photo_library_outlined), label: Text(s.fromPhone)),
        ],
      ]),
    ]);
  }
}

String _placeName(Townland h) => lang.value == 'ga' && h.ga.isNotEmpty ? h.ga : h.en;
String _placeSub(Townland h) =>
    '${h.isTown ? '${s.placeKind(h.kind)} · ' : ''}${s.coOf(h.co)}${!h.isTown && h.ed.isNotEmpty && h.ed.toLowerCase() != h.en.toLowerCase() ? ' · ${h.ed}' : ''}${h.ga.isNotEmpty ? ' · ${lang.value == 'ga' ? h.en : h.ga}' : ''}';

class _Where extends StatelessWidget {
  final Draft d; final VoidCallback onChanged, onDone;
  const _Where({required this.d, required this.onChanged, required this.onDone});

  Future<void> _pick(BuildContext context) async {
    final h = await Navigator.push<Townland>(context, MaterialPageRoute(builder: (_) => const _PlacePicker()));
    if (h != null) { d.townland = h; onChanged(); }
  }

  @override
  Widget build(BuildContext context) {
    final rec = d.audioPath != null, t = d.townland;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _q(s.whereQ, s.whereSub),
      if (t == null) OutlinedButton.icon(onPressed: () => _pick(context), icon: const Icon(Icons.search), label: Text(s.findPlace),
          style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(56), alignment: Alignment.centerLeft, backgroundColor: kCard))
      else Card(child: ListTile(leading: Icon(t.isTown ? Icons.location_city_outlined : Icons.place, color: kRed),
          title: Text(_placeName(t), style: const TextStyle(fontWeight: FontWeight.w700)), subtitle: Text(_placeSub(t)),
          onTap: () => _pick(context), trailing: TextButton(onPressed: () => _pick(context), child: Text(s.change)))),
      _label(s.farQ),
      Text(s.farSub, style: const TextStyle(color: kMuted)),
      const SizedBox(height: 8),
      TextFormField(initialValue: d.fromPlace, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.next,
          decoration: InputDecoration(hintText: s.farPlaceHint), onChanged: (v) { d.fromPlace = v; onChanged(); }),
      const SizedBox(height: 8),
      TextFormField(initialValue: d.fromCountry, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.next,
          decoration: InputDecoration(hintText: s.farCountryHint), onChanged: (v) { d.fromCountry = v; onChanged(); }),
      _label(s.giveTitle),
      TextFormField(initialValue: d.title, maxLength: 120, textCapitalization: TextCapitalization.sentences, textInputAction: TextInputAction.next,
          decoration: InputDecoration(hintText: s.titleHint), onChanged: (v) { d.title = v; onChanged(); }),
      _label(rec ? s.aboutRec : s.inTheirWords),
      TextFormField(initialValue: d.body, minLines: rec ? 3 : 8, maxLines: 16, maxLength: 20000, textCapitalization: TextCapitalization.sentences,
          style: display(18, weight: FontWeight.w400).copyWith(height: 1.5),
          decoration: InputDecoration(hintText: rec ? s.recHint : s.writeHint),
          onChanged: (v) { d.body = v; onChanged(); }),
      _label(s.whatLanguage),
      // Another language needs its name before the page turns; the other three turn it at once.
      _chips(['en', 'ga', 'both', 'other'], d.lang, (v) { d.lang = v; onChanged(); if (v != 'other') onDone(); }, label: (v) => s.langs[v] ?? v),
      if (d.lang == 'other') Padding(padding: const EdgeInsets.only(top: 10), child: TextFormField(initialValue: d.langOther, autofocus: d.langOther.isEmpty, maxLength: 40, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.done,
          decoration: InputDecoration(labelText: s.whichLanguage, hintText: s.langHint), onChanged: (v) { d.langOther = v; onChanged(); }, onFieldSubmitted: (_) => onDone())),
    ]);
  }
}

/// Finding the townland, town or village on a page of its own: a search box with the keyboard up and the matches
/// underneath it, nothing in between. Tapping a match goes straight back with it.
class _PlacePicker extends StatefulWidget {
  const _PlacePicker();
  @override
  State<_PlacePicker> createState() => _PlacePickerState();
}

class _PlacePickerState extends State<_PlacePicker> {
  final _text = TextEditingController();
  List<Townland> _hits = [];
  Timer? _debounce;
  bool _offline = false, _looking = false, _searched = false;

  @override
  void dispose() { _debounce?.cancel(); _text.dispose(); super.dispose(); }

  void _search(String q) {
    _debounce?.cancel();
    final t = q.trim();
    if (t.length < 2) { setState(() { _hits = []; _looking = false; _searched = false; }); return; }
    setState(() => _looking = true);
    _debounce = Timer(const Duration(milliseconds: 250), () async {
      try {
        final h = await Api.townlands(t);
        if (mounted && _text.text.trim() == t) setState(() { _hits = h; _offline = false; _looking = false; _searched = true; });
      } catch (_) {
        if (mounted) setState(() { _hits = []; _offline = true; _looking = false; _searched = true; });
      }
    });
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: Text(s.whereQ)),
    body: Ruled(child: SafeArea(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 0), child: TextField(controller: _text, autofocus: true, textInputAction: TextInputAction.search, textCapitalization: TextCapitalization.words,
          style: const TextStyle(fontSize: 20),
          decoration: InputDecoration(hintText: s.townlandHint, prefixIcon: const Icon(Icons.search),
              suffixIcon: _text.text.isEmpty ? null : IconButton(icon: const Icon(Icons.clear), onPressed: () { _text.clear(); _search(''); })),
          onChanged: _search)),
      Padding(padding: const EdgeInsets.fromLTRB(20, 8, 20, 4), child: Text(
          _offline ? s.noSignalTownland : _searched && !_looking && _hits.isEmpty ? s.noPlaces : s.whereSub,
          style: TextStyle(color: _offline ? kRed : kMuted, fontSize: 15, height: 1.4))),
      SizedBox(height: 3, child: _looking ? const LinearProgressIndicator(minHeight: 3, color: kGreen, backgroundColor: Colors.transparent) : null),
      Expanded(child: ListView(keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag, padding: const EdgeInsets.fromLTRB(16, 6, 16, 24), children: [
        for (final h in _hits) Padding(padding: const EdgeInsets.only(bottom: 6), child: Card(child: ListTile(
          leading: Icon(h.isTown ? Icons.location_city_outlined : Icons.place_outlined, color: kGreen),
          title: Text(_placeName(h), style: const TextStyle(fontWeight: FontWeight.w700)),
          subtitle: Text(_placeSub(h)),
          onTap: () => Navigator.pop(context, h)))),
      ])),
    ]))),
  );
}

class _GrownUp extends StatelessWidget {
  final Draft d; final VoidCallback onChanged;
  const _GrownUp({required this.d, required this.onChanged});
  @override
  Widget build(BuildContext context) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    _q(s.handOver, s.handOverSub),
    _label(s.collectorName),
    TextFormField(initialValue: d.collector, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.next, decoration: InputDecoration(hintText: s.collectorHint), onChanged: (v) { d.collector = v; onChanged(); }),
    _label(s.collectorAge),
    _chips(['under 8', '8 to 9', '10 to 12', '13 to 15', '16 to 18', 'adult'], d.age, (v) { d.age = v; onChanged(); }, label: s.age),
    _label(s.schoolLabel),
    TextFormField(initialValue: d.school, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.next, decoration: InputDecoration(hintText: s.optional), onChanged: (v) { d.school = v; onChanged(); }),
    _label(s.yourName),
    TextFormField(initialValue: d.consentName, textCapitalization: TextCapitalization.words, textInputAction: TextInputAction.next, onChanged: (v) { d.consentName = v; onChanged(); }),
    _label(s.yourEmail),
    TextFormField(initialValue: d.email, keyboardType: TextInputType.emailAddress, textInputAction: TextInputAction.done, decoration: InputDecoration(hintText: s.emailHint), onChanged: (v) { d.email = v; onChanged(); }),
    const SizedBox(height: 14),
    Card(child: CheckboxListTile(value: d.consent, onChanged: (v) { d.consent = v ?? false; onChanged(); }, controlAffinity: ListTileControlAffinity.leading, activeColor: kGreen,
      title: Text(s.consent(d.teller),
          style: const TextStyle(fontSize: 14, height: 1.4)))),
  ]);
}
