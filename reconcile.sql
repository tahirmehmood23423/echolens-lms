-- EchoLens LMS — post-import reconciliation checks
--
-- Run this against DATABASE_URL after migrations/import-prisma.js has
-- completed (see that file's header for how to run it as a Render one-off
-- Job). Every statement below is self-contained and returns its own
-- check/actual/expected/pass columns, so each can be read independently in
-- any Postgres client (psql, Render's built-in query console, TablePlus,
-- DataGrip, ...) — run the whole file, or copy-paste one query at a time.
--
-- Expected counts (from the source echolens-full-backup-2026-07-21.json):
--   78 real users (86 total once the 8 deleted-but-referenced tombstones
--   are counted), 46 courses, 50 quest submissions, 26 certificates, 51 leads.

-- 1. Real (non-tombstone) users == 78
SELECT 'users_real' AS check, count(*) AS actual, 78 AS expected, count(*) = 78 AS pass
FROM users WHERE is_deleted_placeholder = false;

-- 2. Total users including tombstones == 86
SELECT 'users_total_with_tombstones' AS check, count(*) AS actual, 86 AS expected, count(*) = 86 AS pass
FROM users;

-- 3. Courses == 46 (real courses only — excludes the -1 tombstone-batch anchor course, which is not a real course)
SELECT 'courses' AS check, count(*) AS actual, 46 AS expected, count(*) = 46 AS pass
FROM courses WHERE id > 0;

-- 4. Quest submissions == 50
SELECT 'quest_submissions' AS check, count(*) AS actual, 50 AS expected, count(*) = 50 AS pass
FROM quest_submissions;

-- 5. Certificates == 26
SELECT 'certificates' AS check, count(*) AS actual, 26 AS expected, count(*) = 26 AS pass
FROM certificates;

-- 6. Leads == 51
SELECT 'leads' AS check, count(*) AS actual, 51 AS expected, count(*) = 51 AS pass
FROM leads;

-- ── Bonus integrity checks (not part of the requested counts, but cheap and directly relevant) ──

-- 7. Exactly 8 user tombstones (matches the known 5/8/21/25/27/30/31/42 list)
SELECT 'user_tombstone_count' AS check, count(*) AS actual, 8 AS expected, count(*) = 8 AS pass
FROM users WHERE is_deleted_placeholder = true;

-- 8. Exactly 1 batch tombstone (batch 1)
SELECT 'batch_tombstone_count' AS check, count(*) AS actual, 1 AS expected, count(*) = 1 AS pass
FROM batches WHERE is_deleted_placeholder = true;

-- 9. No certificate references a user id that doesn't exist (would mean a tombstone was missed)
SELECT 'certificates_no_orphaned_user_fk' AS check, count(*) AS actual, 0 AS expected, count(*) = 0 AS pass
FROM certificates c LEFT JOIN users u ON u.id = c.user_id WHERE u.id IS NULL;

-- 10. No quest_submission references a user (author) id that doesn't exist
SELECT 'quest_submissions_no_orphaned_user_fk' AS check, count(*) AS actual, 0 AS expected, count(*) = 0 AS pass
FROM quest_submissions qs LEFT JOIN users u ON u.id = qs.user_id WHERE u.id IS NULL;

-- 11. No quest references a batch id that doesn't exist
SELECT 'quests_no_orphaned_batch_fk' AS check, count(*) AS actual, 0 AS expected, count(*) = 0 AS pass
FROM quests q LEFT JOIN batches b ON b.id = q.batch_id WHERE b.id IS NULL;

-- 12. users.id sequence is ahead of the current max id (so the next signup gets a fresh id, not a collision)
SELECT 'users_sequence_ahead_of_max_id' AS check,
       (SELECT last_value FROM users_id_seq) AS actual,
       (SELECT max(id) FROM users) AS expected,
       (SELECT last_value FROM users_id_seq) >= (SELECT max(id) FROM users) AS pass;

-- 13. courses.id sequence is ahead of the current max real course id (ignoring the -1 tombstone-anchor course)
SELECT 'courses_sequence_ahead_of_max_id' AS check,
       (SELECT last_value FROM courses_id_seq) AS actual,
       (SELECT max(id) FROM courses WHERE id > 0) AS expected,
       (SELECT last_value FROM courses_id_seq) >= (SELECT max(id) FROM courses WHERE id > 0) AS pass;
