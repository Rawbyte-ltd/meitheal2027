import 'package:flutter_test/flutter_test.dart';
import 'package:meitheal/drafts.dart';

void main() {
  test('a draft picks the right mode and survives a save', () {
    final d = Draft.fresh(topic: 'local-cures')..teller = 'Mary'..body = 'short note';
    expect(d.mode, 'write');
    expect(d.minBody, 80);
    d.audioPath = '/x/recording.m4a';
    expect(d.mode, 'record');
    expect(d.minBody, 20);
    final back = Draft.fromJson(d.toJson());
    expect(back.teller, 'Mary');
    expect(back.audioPath, '/x/recording.m4a');
    expect(back.fields()['topic'], 'local-cures');
    expect(back.label, "Mary's story");
  });

  test('a story from far away, in another language, keeps its place and its language', () {
    final d = Draft.fresh()..teller = 'Babcia'..lang = 'other'..langOther = 'Polish'..fromPlace = 'Lublin'..fromCountry = 'Poland';
    final back = Draft.fromJson(d.toJson());
    expect(back.langOther, 'Polish');
    expect(back.fromPlace, 'Lublin');
    final f = back.fields();
    expect(f['lang'], 'other');
    expect(f['lang_other'], 'Polish');
    expect(f['from_place'], 'Lublin');
    expect(f['from_country'], 'Poland');
  });
}
