-- Small key/value store for state that has to survive a restart: when the daily brief last went out (src/lib/brief.ts).
CREATE TABLE IF NOT EXISTS kv (
  k          TEXT PRIMARY KEY,
  v          TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
