# Meitheal 2027 for phones (Flutter)

The copybook in the pocket. A child sits down with a grandparent and the app walks them through it in five steps:

1. **Who is telling**: first name, who they are, the decade they were born.
2. **What to ask**: the 1937 and 2027 headings as big cards, or "Pick one for me".
3. **Record**: one big button, pause, listen back, and a question card ("Ask them…") to keep the talk going. Photos too.
4. **Where and what**: townland search, a title, a line about the recording or the whole story written down, the language.
5. **A grown-up**: collector's name and age, school, consent. Then it sends.

Every story is saved on the phone at every step, with its recording in the app's own folder. With no signal it waits in the outbox and sends the next time the app opens with signal. Sent stories appear under "My stories" with their keeper link, so the family can read, print or remove them on the website.

## Irish

The **Gaeilge / English** switch on the home screen changes the whole app and is remembered on the phone. The strings are in `lib/strings.dart` (English is the base class, Irish overrides it) and match the website's (`src/lib/i18n.ts`); the headings' Irish prompts are in `lib/api.dart`. Stories are sent with `ui_lang`, so the server's messages come back in the same language. A new story's language defaults to the app's.

## Run

```sh
cd apps/mobile
flutter pub get
flutter run                                   # talks to https://meitheal2027.ie
flutter build apk --debug                     # build/app/outputs/flutter-apk/app-debug.apk
flutter test
```

`MEITHEAL_API` points it at another server (`--dart-define=MEITHEAL_API=http://10.0.2.2:3000` for a local dev server from the Android emulator). `MEITHEAL_GATE` is only needed if the site is ever put behind `SITE_PASSWORD` again: it sends the same cookie as the password page and is baked into that build.

Android test builds without a Flutter install: `gh workflow run android.yml` builds the .apk on a GitHub runner (`.github/workflows/android.yml`); download it with `gh run download` or from the Actions tab and install it over the old one. Every such build is signed with the same test key (kept in the repository secrets and in `~/.meitheal/` on Steven's phone, never in the repo), which is what lets Android treat the new one as an update. A build from a laptop, or a build before 14 October 2026, carries a different key, and the old app has to be uninstalled first, once. To sign a local build the same way, put the key at `android/app/test.p12` and write `android/key.properties` (storeFile, storePassword, keyAlias, keyPassword).

iPhone test builds: `gh workflow run ios.yml` builds an unsigned `.ipa` on a GitHub Mac (`.github/workflows/ios.yml`); install it with Sideloadly and a free Apple ID (it lasts 7 days).

## Files

- `lib/collect.dart`: the five steps.
- `lib/drafts.dart`: drafts, the outbox and "My stories", all on the phone.
- `lib/api.dart`: the website's API, and the headings (mirrors `src/lib/topics.ts`; keep them in step).
- `lib/strings.dart`: every word on screen, in English and Irish.
- `lib/theme.dart`: the copybook look, the same palette and fonts as the site.
- `assets/photos/`: two of the site's National Library of Ireland photographs.

## Not done yet

- Store signing (the Play Store upload key and the Apple team; the test key above is not it) and store listings.
- A map view of stories near the phone's location.
