-- The written story goes through the same check as recording transcripts (src/lib/scan.ts, scanText).
ALTER TABLE stories ADD COLUMN IF NOT EXISTS scan TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS scan_note TEXT;
