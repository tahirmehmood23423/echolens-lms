-- STAGE 2 of 3 - enable RLS. Source: db/security/enable-rls.sql (unmodified).
-- Do NOT run this until stage 1's result is saved to a file.
-- One transaction: if anything raises, the whole stage rolls back and no table
-- is left half-changed. lock_timeout is 5s, so it fails rather than queueing
-- behind live traffic.
--
-- CORRECT RESULT: "Success. No rows returned" (or a COMMIT with no error).
--
-- IF IT FAILS, read the message and STOP. Do not edit this SQL to get past it:
--   * "An API client role bypasses RLS or effectively owns a public table"
--       -> anon/authenticated is superuser, has BYPASSRLS, or owns your tables.
--          RLS would not actually restrict them, so enabling it would give you
--          false confidence. Fix the role privileges first.
--   * "Existing public-table policies found"
--       -> policies already exist. Enabling RLS activates them, and this
--          zero-policy design assumes there are none. No policy was dropped.
--          Review db/security/inspect-api-surface.sql output before proceeding.
--   * lock_timeout / "canceling statement due to lock timeout"
--       -> traffic held a conflicting lock. Nothing changed; retry when quieter.
--   * A permission error on ALTER TABLE means the editor role does not own the
--       tables. Stop; running as the wrong role is the main risk here.
-- After any failure, rerun this entire file from the top once the cause is fixed.

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
