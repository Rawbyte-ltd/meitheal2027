-- A story from somewhere outside Ireland. One person in five living in Ireland was born elsewhere, so a grandparent in
-- Lublin or Lagos is collected the same way as one in Drumlane. The townland stays required: it is where the story was
-- collected, or where the family lives now, and it keeps the story on the map. from_place is the town or village and
-- from_country the country, both as the family wrote them (src/lib/stories.ts, farOf in src/lib/i18n.ts).
ALTER TABLE stories ADD COLUMN IF NOT EXISTS from_place TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS from_country TEXT;
CREATE INDEX IF NOT EXISTS stories_from_country ON stories (from_country) WHERE status = 'approved' AND from_country IS NOT NULL;

-- A story told in a language other than English or Irish: lang 'other', with lang_other naming it ("Polish").
-- The transcriber is left to hear which language a recording is in, and the machine puts the text into English beside
-- the original so a reader in Cavan can read it (src/lib/scan.ts): body_en for the written story, media.transcript_en
-- for a recording's transcript. The original is the record; the English is marked as machine-made wherever it shows.
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_lang_check;
ALTER TABLE stories ADD CONSTRAINT stories_lang_check CHECK (lang IN ('en', 'ga', 'both', 'other'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS lang_other TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS body_en TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS transcript_en TEXT;
