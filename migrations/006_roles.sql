-- Reading becomes a role, not a person (docs/handoff.md, phase 1). Teachers approve their own class, county readers the
-- rest, the admin everything. Sign-in is by emailed link; no passwords are stored.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,            -- stored lower-case
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'reader')),
  county        TEXT,                            -- teacher and reader scope
  school        TEXT,                            -- teacher scope, matched to stories.school without case or spaces
  class_name    TEXT,                            -- teacher scope; empty means the whole school
  nominated_by  TEXT,                            -- the school, library, heritage office or society that vouches for them
  invited_by    INT REFERENCES users (id),
  disabled      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen     TIMESTAMPTZ
);

-- One-use sign-in links, valid 15 minutes. Only the hash of the token is kept.
CREATE TABLE IF NOT EXISTS logins (
  token_hash  TEXT PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ
);

-- Desk sessions (the `desk` cookie), 30 days. Deleting a row signs that browser out.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

ALTER TABLE stories ADD COLUMN IF NOT EXISTS reviewed_by INT REFERENCES users (id);
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS review_note TEXT;          -- shown to the family on the keeper page when sent back
ALTER TABLE stories ADD COLUMN IF NOT EXISTS second_look BOOLEAN NOT NULL DEFAULT false;  -- a teacher said yes but a check needs a person

CREATE TABLE IF NOT EXISTS audit (
  id        SERIAL PRIMARY KEY,
  at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id   INT REFERENCES users (id),       -- null when the admin key was used
  story_id  TEXT,
  action    TEXT NOT NULL,
  detail    TEXT
);
CREATE INDEX IF NOT EXISTS audit_at ON audit (at DESC);
CREATE INDEX IF NOT EXISTS stories_review ON stories (status, county, school) WHERE status = 'pending';
