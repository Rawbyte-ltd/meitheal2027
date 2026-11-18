-- Stories removed before 4 November 2026 kept their text, names, school, email and IP hash: the desk removal cleared
-- nothing and the family removal only the body and email. The About page promises the email goes, the keeper page says
-- "for good", and /privacy lists what remains. This clears them once, with the same SET as src/lib/remove.ts (REMOVED_SET);
-- tests/remove.test.ts keeps the two identical. Their media rows were already deleted; flags on them go too.
DELETE FROM flags WHERE story_id IN (SELECT id FROM stories WHERE status = 'removed');
UPDATE stories SET status = 'removed', featured = false, second_look = false,
  title = '[removed]', body = '[removed]', words = 0, topic_custom = NULL, lang_other = NULL, body_en = NULL,
  teller_name = '', teller_born = NULL, teller_relation = NULL, collector_name = '', collector_age = NULL, school = NULL, class_name = NULL,
  contact_email = NULL, consent_name = '', ip_hash = NULL, from_place = NULL, from_country = NULL,
  note = NULL, scan_note = NULL, review_note = NULL,
  transcript = NULL, transcript_public = NULL, transcript_by = NULL, transcript_at = NULL, transcript_scan = NULL, transcript_scan_note = NULL,
  updated_at = now()
WHERE status = 'removed';
