-- The owner: the one admin who can invite, disable and re-enable admins. Other admins run the desk and its teachers and
-- readers. The earliest admin becomes the owner (steven@rawbyte.ie on the live site); scripts/add-admin.mjs also makes one.
ALTER TABLE users ADD COLUMN IF NOT EXISTS owner BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET owner = true
  WHERE id = (SELECT min(id) FROM users WHERE role = 'admin')
    AND NOT EXISTS (SELECT 1 FROM users WHERE owner);
