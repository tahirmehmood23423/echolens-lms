-- CASE A: this repository uses server-side Prisma/pg, not the Supabase Data API.
-- REVIEW ONLY. Run manually in the Supabase SQL Editor; never through app startup.
-- FIRST follow README.md and inspect-api-surface.sql. Confirm Render's actual
-- database role owns every app table (without FORCE RLS), or has BYPASSRLS.
-- A restricted app role will be blocked by this zero-policy configuration.
-- This file deliberately does not FORCE RLS, create policies, or change grants.

-- 1. BEFORE: save this result externally. These are the tables rollback may disable.
SELECT schemaname, tablename, tableowner, rowsecurity
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

BEGIN;
-- Fail rather than queue indefinitely behind traffic. A failure rolls back ALL
-- changes in this transaction; fix the cause and rerun the entire file.
SET LOCAL lock_timeout = '5s';

-- 2. Enable RLS on ALL existing public ordinary/partitioned tables, including
-- partitions and unknown legacy tables. Quote catalog identifiers, never data.
DO $enable_rls$
DECLARE
    target record;
BEGIN
    -- RLS cannot protect API access made as a superuser, BYPASSRLS role, or
    -- effective table owner. Fail closed if client roles have these privileges.
    IF EXISTS (
        SELECT 1 FROM pg_catalog.pg_roles
        WHERE rolname IN ('anon', 'authenticated') AND (rolsuper OR rolbypassrls)
    ) OR EXISTS (
        SELECT 1
        FROM pg_catalog.pg_class AS relation
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        CROSS JOIN pg_catalog.pg_roles AS api_role
        WHERE namespace.nspname = 'public' AND relation.relkind IN ('r', 'p')
          AND api_role.rolname IN ('anon', 'authenticated')
          AND pg_has_role(api_role.oid, relation.relowner, 'USAGE')
    ) THEN
        RAISE EXCEPTION 'An API client role bypasses RLS or effectively owns a public table: review role privileges before proceeding';
    END IF;

    -- Enabling RLS activates existing policies; it does not remove them.
    -- CASE A needs zero policies. Do not silently delete an unknown access rule.
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.pg_policy AS policy
        JOIN pg_catalog.pg_class AS relation ON relation.oid = policy.polrelid
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public' AND relation.relkind IN ('r', 'p')
    ) THEN
        RAISE EXCEPTION 'Existing public-table policies found: review inspect-api-surface.sql results before enabling CASE A zero-policy RLS. No policies were dropped.';
    END IF;

    FOR target IN
        SELECT namespace.nspname AS schema_name, relation.relname AS table_name
        FROM pg_catalog.pg_class AS relation
        JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
        WHERE namespace.nspname = 'public' AND relation.relkind IN ('r', 'p')
        ORDER BY relation.relname
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', target.schema_name, target.table_name);
    END LOOP;
END;
$enable_rls$;
COMMIT;

-- 3. AFTER: identical verification. Must return ZERO rows after a successful run.
-- This checks table flags, not views/RPC permissions, future tables, or API access.
SELECT schemaname, tablename, tableowner, rowsecurity
FROM pg_catalog.pg_tables
WHERE schemaname = 'public' AND rowsecurity = false
ORDER BY tablename;

-- 4. ROLLBACK, deliberately commented out. Disable the unused Data API/remove
-- public from its exposed schemas FIRST, so rollback cannot reopen the hole.
-- Paste ONLY table names saved in the BEFORE result into the empty text array.
-- Do not disable tables that were already protected before this change.
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- DO $rollback_rls$
-- DECLARE
--     previously_unprotected constant text[] := ARRAY[]::text[];
--     table_name text;
-- BEGIN
--     IF cardinality(previously_unprotected) = 0 THEN
--         RAISE EXCEPTION 'Fill previously_unprotected from the saved BEFORE result first';
--     END IF;
--     FOREACH table_name IN ARRAY previously_unprotected LOOP
--         EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', 'public', table_name);
--     END LOOP;
-- END;
-- $rollback_rls$;
-- COMMIT;
