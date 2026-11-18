-- Stories shown from an existing archive (the 1937-38 Schools' Collection on dúchas.ie) as examples of what Meitheal
-- gathers. source_url links the original page; source_ref is the volume and page; source_credit names the transcriber and
-- the licence. These rows are not Meitheal submissions: no family, no keeper link, no consent record, and the archive
-- export (scripts/export.mjs) leaves them out. Remove them all with `node scripts/seed-1937.mjs --remove`.
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_ref TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS source_credit TEXT;
