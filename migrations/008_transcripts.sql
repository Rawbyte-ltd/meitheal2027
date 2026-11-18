-- The written-out version of a story's recordings, which the copybook and the story page need (src/lib/transcript.ts).
-- `transcript` is the latest text, saved by the family on their keeper page or by someone at the desk.
-- `transcript_public` is the version a person at the desk has read: the one shown on the story page and printed.
-- They differ when the family has changed it since; the desk's Transcripts tab lists those.
-- transcript_by holds 'family' or the desk role (src/lib/transcript.ts, WRITERS).
ALTER TABLE stories ADD COLUMN IF NOT EXISTS transcript TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS transcript_public TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS transcript_by TEXT CHECK (transcript_by IN ('family', 'teacher', 'reader', 'admin'));
ALTER TABLE stories ADD COLUMN IF NOT EXISTS transcript_at TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS transcript_scan TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS transcript_scan_note TEXT;
