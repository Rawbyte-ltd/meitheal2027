-- The 1937 examples were seeded with updated_at set to their 1937-38 date, so the sitemap told search engines their
-- pages were last changed in 1938. updated_at is when the row changed on this site; created_at keeps the archive date.
-- scripts/seed-1937.mjs sets now() from 5 November 2026. Only rows still carrying an archive-era date are touched.
UPDATE stories SET updated_at = now() WHERE source_url IS NOT NULL AND updated_at < '2000-01-01';
