-- Meitheal 2027: stories collected by children from their elders, townland by townland.
-- Only first names are stored for people; the contact email belongs to the consenting adult and is never shown.

CREATE TABLE IF NOT EXISTS stories (
  id              TEXT PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'removed')),
  featured        BOOLEAN NOT NULL DEFAULT false,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  lang            TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'ga', 'both')),
  topic           TEXT NOT NULL,
  county          TEXT NOT NULL,
  townland_slug   TEXT NOT NULL,
  townland_en     TEXT NOT NULL,
  townland_ga     TEXT,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  teller_name     TEXT NOT NULL,          -- first name only
  teller_born     TEXT,                   -- decade, e.g. 1940s
  teller_relation TEXT,                   -- grandmother, neighbour, ...
  collector_name  TEXT NOT NULL,          -- first name only
  collector_age   TEXT,                   -- age band
  school          TEXT,
  class_name      TEXT,
  contact_email   TEXT,                   -- consenting adult; private
  consent_name    TEXT NOT NULL,          -- adult who ticked the box
  consent         BOOLEAN NOT NULL DEFAULT false,
  audio           BYTEA,
  audio_mime      TEXT,
  audio_bytes     INT,
  words           INT NOT NULL DEFAULT 0,
  secret_hash     TEXT NOT NULL,          -- sha256 of the keeper secret in the family's link
  ip_hash         TEXT,
  note            TEXT                    -- moderator note, private
);
CREATE INDEX IF NOT EXISTS stories_status_created ON stories (status, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_county ON stories (county) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS stories_townland ON stories (county, townland_slug) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS stories_topic ON stories (topic) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS stories_school ON stories (school) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS flags (
  id          SERIAL PRIMARY KEY,
  story_id    TEXT NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash     TEXT
);
