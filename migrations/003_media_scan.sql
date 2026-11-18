-- Checks on photographs and recordings (src/lib/scan.ts). scan: 'safe', 'mild:<category>', 'unsafe:<category>',
-- 'skipped:<reason>', 'error:<reason>'; null when the check is off. scan_note: the passage behind a flag.
ALTER TABLE media ADD COLUMN IF NOT EXISTS scan TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS scan_note TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS transcript TEXT;
