-- READ-ONLY CATALOG INSPECTION. Owner runs manually in Supabase SQL Editor.
-- No student records, function bodies, secrets, or connection strings are read.
-- SQL Editor current_user is NOT evidence of Render's DATABASE_URL role.

-- Match Render's username to a database role locally, without sharing its URL.
-- Supavisor's postgres.<project-ref> username normally maps to postgres.
SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolinherit
FROM pg_catalog.pg_roles
ORDER BY rolname;

-- Role memberships matter when a login inherits an owning role's privileges.
SELECT member.rolname AS member_role, granted.rolname AS granted_role
FROM pg_catalog.pg_auth_members AS membership
JOIN pg_catalog.pg_roles AS member ON member.oid = membership.member
JOIN pg_catalog.pg_roles AS granted ON granted.oid = membership.roleid
ORDER BY member.rolname, granted.rolname;

-- Ownership, FORCE status, and effective API-role grants for every public table.
-- Owner bypass only applies when relforcerowsecurity is false. Superusers and
-- BYPASSRLS roles still bypass FORCE. Do not assume every table has one owner.
SELECT namespace.nspname AS schema_name, relation.relname AS table_name,
       owner.rolname AS table_owner, relation.relrowsecurity AS rls_enabled,
       relation.relforcerowsecurity AS force_rls,
       api_role.rolname AS api_role,
       has_table_privilege(api_role.oid, relation.oid, 'SELECT') AS can_select,
       has_table_privilege(api_role.oid, relation.oid, 'INSERT') AS can_insert,
       has_table_privilege(api_role.oid, relation.oid, 'UPDATE') AS can_update,
       has_table_privilege(api_role.oid, relation.oid, 'DELETE') AS can_delete,
       has_table_privilege(api_role.oid, relation.oid, 'TRUNCATE') AS can_truncate
FROM pg_catalog.pg_class AS relation
JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
JOIN pg_catalog.pg_roles AS owner ON owner.oid = relation.relowner
CROSS JOIN pg_catalog.pg_roles AS api_role
WHERE namespace.nspname = 'public' AND relation.relkind IN ('r', 'p')
  AND api_role.rolname IN ('anon', 'authenticated')
ORDER BY relation.relname, api_role.rolname;

-- Existing policies must be reviewed. enable-rls.sql refuses to activate them.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Exact contact_* inventory, including tables not present in this repository.
-- Save the table_name column as one name per line for verify-rls.sh --tables.
SELECT relation.relname AS table_name
FROM pg_catalog.pg_class AS relation
JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
WHERE namespace.nspname = 'public' AND relation.relkind IN ('r', 'p')
  AND left(relation.relname, 8) = 'contact_'
ORDER BY relation.relname;

-- Views can apply their owner's permissions/RLS unless security_invoker=true.
-- Materialized views contain separate cached rows; foreign tables are not
-- protected by this table-RLS script. No view definition/data is selected.
SELECT relation.relname AS object_name, relation.relkind AS object_kind,
       owner.rolname AS object_owner, relation.reloptions AS options,
       api_role.rolname AS api_role,
       has_table_privilege(api_role.oid, relation.oid, 'SELECT') AS can_select
FROM pg_catalog.pg_class AS relation
JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
JOIN pg_catalog.pg_roles AS owner ON owner.oid = relation.relowner
CROSS JOIN pg_catalog.pg_roles AS api_role
WHERE namespace.nspname = 'public' AND relation.relkind IN ('v', 'm', 'f')
  AND api_role.rolname IN ('anon', 'authenticated')
ORDER BY relation.relname, api_role.rolname;

-- RLS is not a permission check for RPC functions. SECURITY DEFINER functions
-- may reach protected tables as their owner. Review every executable function,
-- including invoker functions performing non-row operations. Never call it here.
SELECT procedure.proname AS function_name,
       pg_get_function_identity_arguments(procedure.oid) AS arguments,
       owner.rolname AS function_owner, procedure.prosecdef AS security_definer,
       api_role.rolname AS api_role,
       has_function_privilege(api_role.oid, procedure.oid, 'EXECUTE') AS can_execute
FROM pg_catalog.pg_proc AS procedure
JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
JOIN pg_catalog.pg_roles AS owner ON owner.oid = procedure.proowner
CROSS JOIN pg_catalog.pg_roles AS api_role
WHERE namespace.nspname = 'public'
  AND api_role.rolname IN ('anon', 'authenticated')
ORDER BY procedure.proname, arguments, api_role.rolname;

-- RLS does not guard sequences. Grants can also be inherited or granted PUBLIC.
SELECT relation.relname AS sequence_name, api_role.rolname AS api_role,
       has_sequence_privilege(api_role.oid, relation.oid, 'USAGE') AS can_use,
       has_sequence_privilege(api_role.oid, relation.oid, 'SELECT') AS can_select,
       has_sequence_privilege(api_role.oid, relation.oid, 'UPDATE') AS can_update
FROM pg_catalog.pg_class AS relation
JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = relation.relnamespace
CROSS JOIN pg_catalog.pg_roles AS api_role
WHERE namespace.nspname = 'public' AND relation.relkind = 'S'
  AND api_role.rolname IN ('anon', 'authenticated')
ORDER BY relation.relname, api_role.rolname;

-- Inspect future-object defaults as well as current objects. NULL schema means
-- global defaults, which can combine with schema-specific defaults.
SELECT owner.rolname AS creator_role, namespace.nspname AS schema_name,
       defaults.defaclobjtype AS object_type, defaults.defaclacl AS default_acl
FROM pg_catalog.pg_default_acl AS defaults
JOIN pg_catalog.pg_roles AS owner ON owner.oid = defaults.defaclrole
LEFT JOIN pg_catalog.pg_namespace AS namespace ON namespace.oid = defaults.defaclnamespace
WHERE namespace.nspname = 'public' OR defaults.defaclnamespace = 0
ORDER BY owner.rolname, namespace.nspname, defaults.defaclobjtype;
