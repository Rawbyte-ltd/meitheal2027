-- Four collections like dúchas.ie, custom headings, and media (audio, photos) in object storage with a database fallback.

ALTER TABLE stories ADD COLUMN IF NOT EXISTS collection TEXT NOT NULL DEFAULT 'schools' CHECK (collection IN ('schools', 'main', 'photo', 'audio'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS topic_custom TEXT;   -- when topic = 'custom'
ALTER TABLE stories DROP COLUMN IF EXISTS audio;
ALTER TABLE stories DROP COLUMN IF EXISTS audio_mime;
ALTER TABLE stories DROP COLUMN IF EXISTS audio_bytes;
CREATE INDEX IF NOT EXISTS stories_collection ON stories (collection) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS stories_teller ON stories (teller_name, county, townland_slug) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS media (
  id          SERIAL PRIMARY KEY,
  story_id    TEXT NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('audio', 'photo')),
  mime        TEXT NOT NULL,
  bytes       INT NOT NULL,
  caption     TEXT,
  r2_key      TEXT,          -- object key in R2 when configured
  blob        BYTEA,         -- fallback when R2 is not configured
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_story ON media (story_id, kind);
