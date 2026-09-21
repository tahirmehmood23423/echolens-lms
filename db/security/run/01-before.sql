-- STAGE 1 of 3 - BEFORE snapshot. Source: db/security/enable-rls.sql (unmodified).
-- Run this FIRST, on its own, in the Supabase SQL Editor.
--
-- CORRECT RESULT: a list of public tables that currently have rowsecurity = false.
--   Any number of rows is fine, including zero. SAVE THIS RESULT TO A FILE NOW -
--   export it or copy it out of the editor. Stage 2 protects exactly these tables,
--   and the rollback template can only undo those same tables. Without this list
--   there is no safe way back.
--
-- IF IT FAILS: nothing has changed yet. A permission error means the editor role
--   cannot read pg_catalog.pg_tables - stop and check which role the SQL Editor
--   is using. Do not continue to stage 2 without a saved result.

SELECT schemaname, tablename, tableowner, rowsecurity
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;
