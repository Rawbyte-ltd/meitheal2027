-- A story the family wants in the class copybook and not on the website. The wish is book_only; once a person at the
-- desk has read it the story is 'kept': printed in the copybook, never public (every public query asks for 'approved').
ALTER TABLE stories ADD COLUMN IF NOT EXISTS book_only BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE stories DROP CONSTRAINT IF EXISTS stories_status_check;
ALTER TABLE stories ADD CONSTRAINT stories_status_check CHECK (status IN ('pending', 'approved', 'kept', 'rejected', 'removed'));
CREATE INDEX IF NOT EXISTS stories_kept ON stories (county, school) WHERE status = 'kept';
