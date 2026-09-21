-- STAGE 3 of 3 - AFTER verification. Source: db/security/enable-rls.sql (unmodified).
-- Identical to stage 1's query. Run it after stage 2 commits.
--
-- CORRECT RESULT: ZERO rows. Every public table now has row security enabled.
--
-- IF IT RETURNS ROWS: those tables are still unprotected - stage 2 did not
--   commit, or a table was created between the two stages. Do not ignore it;
--   rerun stage 2 and then this query again.
--
-- SCOPE: this checks table flags only. It does not verify views, RPC/function
--   permissions, future tables, or whether the Data API is reachable at all.
--   Continue with the RUNBOOK steps after this passes.

SELECT schemaname, tablename, tableowner, rowsecurity
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;
