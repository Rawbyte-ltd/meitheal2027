-- "Two flags take it off the map" (About; docs/data-protection.md) means two people. One flag per story per sender
-- (ip_hash); a repeat from the same sender changes nothing and sends no email. There were no flags when this was added.
CREATE UNIQUE INDEX IF NOT EXISTS flags_story_sender ON flags (story_id, ip_hash);
CREATE INDEX IF NOT EXISTS flags_sender_time ON flags (ip_hash, created_at);
