-- Which consent wording the adult saw, and in which language: "<version>:<ui language>", e.g. "web-2026-11-04:ga".
-- The wordings live in src/lib/i18n.ts (CONSENT_VERSION) and apps/mobile/lib/strings.dart; git history keeps every one.
-- NULL means the story came in before versions were recorded (up to 4 November 2026).
ALTER TABLE stories ADD COLUMN IF NOT EXISTS consent_version TEXT;
