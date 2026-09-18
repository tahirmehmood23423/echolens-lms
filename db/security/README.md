# Supabase public-schema RLS review

Prepared 2026-09-18. **CASE A in this repository:** clients use the app server;
neither browser nor server code uses the Supabase SDK or Data API. Zero policies
deny ordinary API client roles access to protected table rows. This is conditional
on the production role, ownership, policy and API-surface checks below; repository
evidence does not establish the live configuration.

These are reviewed configuration files, not application migrations. No SQL has
been executed, no database has been connected to, and no real `.env`, keys or
connection strings were inspected. Application and persistence files are outside
this change. No npm dependency, application environment change or deployment is
required. The database owner must perform the dashboard changes manually.

## Repository findings

The audit searched first-party source, browser assets, package manifests/lockfile,
examples, migrations, scripts and documentation, including hidden/untracked source.
Third-party dependencies, generated/runtime records, backup/upload evidence and
real environment files were excluded. Counts below describe the repository before
these security review files introduced verification-only Supabase environment names.

| Requested pattern | Occurrences | Browser/server classification |
| --- | ---: | --- |
| `@supabase/supabase-js` | 0 | Neither; absent from `package.json` and `package-lock.json` |
| `createClient` | 0 | Neither |
| `SUPABASE_ANON_KEY` | 0 | Neither |
| `NEXT_PUBLIC_SUPABASE*` | 0 | Neither |
| `VITE_SUPABASE*` | 0 | Neither |
| `SUPABASE_URL` | 0 | Neither |
| `service_role` | 0 | Neither |

No application calls to Supabase `/rest/v1`, `/graphql/v1`, `/auth/v1`,
`/storage/v1`, `/realtime/v1` or `/functions/v1` were found. There is no Supabase
Auth, Storage, Realtime or Edge Function usage. Authentication is application JWT /
bcrypt with optional Google OAuth; uploads use local private files and optional
S3-compatible Cloudflare R2 for Showcase. These are not Supabase integrations.

### Database access paths

| Path | Transport and environment | Evidence |
| --- | --- | --- |
| Runtime normalized store reads/flushes | Prisma 7, `@prisma/adapter-pg`, PostgreSQL protocol, `DATABASE_URL` | `store.js:417`, `store.js:573`, `prisma-client.js:47–61`, `normalized-flush-plan.js:40` |
| Talent profile/search/project endpoints | Raw `pg`, shared pool, `DATABASE_URL` | `talent.js:67`, `talent.js:173`, `db.js:45–64` |
| Recruiter/student contact and hiring endpoints | Same raw `pg` pool | `talent-hiring.js:98`, `talent-hiring.js:159` |
| Suppression storage | Same raw `pg` pool | `store.js:3708`, `store.js:3729` |
| Startup Talent migration runner | Same PostgreSQL path, SQL migration files and bookkeeping | `migrations/run.js:39–85` |
| Talent sitemap | Read-only raw `pg` | `server.js:4873–4875` |
| Legacy JSONB store helper | Raw `pg`; helper exists but has no invocation in the current runtime | `store.js:354`; current flush invokes normalized persistence at `store.js:522` |
| Legacy/normalized imports | `migrations/import-json.js` uses shared `pg`; `migrations/import-prisma.js:311` uses its own Prisma/PG adapter and `DATABASE_URL` | One-shot utilities; not browser code |
| Isolated normalized staging import | Own raw `pg` client, **`NORMALIZED_DATABASE_URL`**, not runtime `DATABASE_URL` | `migrations/import-normalized.js:64`, `migrations/import-normalized.js:434` |
| Load-test seed and guarded flush benchmark | Prisma/PG adapter; seed uses `DATABASE_URL`, benchmark requires loopback `TEST_DATABASE_URL` | `scripts/loadtest-seed.js:98`, `scripts/benchmark-flush-step2.cjs:16` |
| Prisma CLI migrations | Direct PostgreSQL via `DIRECT_URL` | `prisma.config.ts:5–15` |
| Backup/restore utilities | `pg_dump` / `pg_restore`, PostgreSQL protocol; not Data API or application-row writes | `scripts/backup-pg-dump.js`, `RESTORE.md` |
| Isolated demo/tests | Local temporary PGlite / fixture databases | `demo/worker.cjs:35–60`; no Supabase credentials |

**Role and port are GAPs requiring owner confirmation.** `.env.example:13` has a
blank `DATABASE_URL`; it specifies neither. `RESTORE.md:82–86` documents a session
pooler on 5432 with the sample username `postgres.<project-ref>`, and
`RESTORE.md:249–253` describes runtime `DATABASE_URL` as transaction pooler 6543.
`prisma.config.ts:5–15` distinguishes direct 5432 migrations from pooled runtime
access. `db-guard.js:17–18` also expects the Supabase pooled postgres username.
`README.md:453` still describes Render-hosted Postgres; that older guidance does
not establish today's host or credentials.

The Supavisor project-qualified username normally maps to the PostgreSQL role
`postgres`. That is evidence of intended configuration, **not confirmation of the
live role or ownership of every table**. Confirm Render's username and pool mode
privately in its dashboard, then compare the database role with catalog owners,
memberships, `rolsuper`, `rolbypassrls` and `relforcerowsecurity`. Do not paste a
password, key or complete URL into an issue/chat. SQL Editor `current_user` is the
dashboard role, not necessarily the app role.

5432 is documented for direct/session connections; 6543 for transaction pooling.
Supavisor configuration can change mode, so do not infer it solely from the port.
Confirm a direct/session endpoint for the application's interactive transaction
requirements. This task does not change the connection or diagnose flush timeouts.

### Complete repository write inventory, grouped by writer

**Normalized Prisma persistence — 61 mapped tables** (`schema-map.js:36`;
`normalized-flush-plan.js:49`):

```text
courses, companies, users, batches, enrollments, sessions, live_classes,
quests, quest_submissions, open_attempts, open_submissions, task_files,
gem_events, certificates, attendance, course_messages, chat_reads,
announcements, public_announcements, ai_reports, events, event_entries,
event_submissions, event_comments, leads, discount_categories, registrations,
challans, expenses, staff_groups, staff_records, departments,
department_members, department_tasks, department_task_status,
department_announcements, coordinator_queries, contracts, ambassadors,
ambassador_gem_events, ambassador_duties, ambassador_duty_status,
ambassador_reports, jobs, job_comments, lessons, assignments, submissions,
challenges, challenge_submissions, hackathons, hackathon_entries,
hackathon_submissions, quizzes, quiz_attempts, showcase_posts, showcase_images,
showcase_likes, showcase_comments, showcase_reports, audit_log
```

**Five additional normalized tables** (`normalized-flush-plan.js:80–120`):
`feedback`, `seq`, `issued_usernames`, `issued_regnos`, `settings`. This gives **66**
tables in this path. Server modules including Showcase mutate this store and flush
through the same path; there is no browser database connection.

**Talent raw `pg`** (`talent.js`):

| Table | Representative write line |
| --- | ---: |
| `talent_profiles` | 174; also 400, 428, 438, 443, 456 |
| `saved_searches` | 290, 651, 657 |
| `skills` | 483 |
| `student_skills` | 492, 498 |
| `projects` | 515, 537, 555, 577, 586, 597, 607 |
| `search_log` (singular) | 637 |

**Hiring raw `pg`** (`talent-hiring.js`):

| Table | Representative write line |
| --- | ---: |
| `contact_requests` | 98, 158, 168, 184 |
| `contact_reveals` | 159 |
| `blocked_companies` | 174, 194 |
| `messages` | 213 |
| `shortlists` | 244, 248 |
| `shortlist_candidates` | 262, 269 |
| `reports` | 297, 306, 310 |
| `talent_profiles` (shared) | 318 |
| `projects` (shared) | 328 |

Together Talent/hiring write **13 distinct additional tables**. Suppression
storage adds `email_suppressions` (`store.js:3708`, `store.js:3729`). The startup
migration runner writes `schema_migrations` (`migrations/run.js:85`) and applies
existing schema/skill seed/profile backfill SQL. Its current table-creation SQL
does not enable RLS automatically on future tables.

Legacy helpers/imports write the **57 JSONB collection tables** in
`migrations/collections.js:22`, overlapping the normalized names, and `store_meta`
for sequence/settings/issued-name metadata. Standalone import/seed tools also
write normalized tables. These counts describe code paths, not the number of
tables present in Supabase; the live inventory is unknown.

**Unmapped dashboard tables:** `curriculum_store` and plural `search_logs` have
no repository references. Their purpose/writer/owner and any extra `contact_*`
tables are **NEEDS-DECISION / owner inventory**, not guessed access rules.
The all-public-table SQL covers them if they are ordinary/partitioned tables.

## Prepared configuration and limitations

- `enable-rls.sql` captures the starting flags, atomically enables all existing
  public ordinary/partitioned tables, repeats the same verification, and contains
  a selective commented rollback. It creates **no policies**, does not FORCE RLS,
  and does not alter grants. It refuses existing policies or API roles with
  bypass/owner privileges rather than guessing how to replace them.
- `inspect-api-surface.sql` is read-only catalog inspection for roles, ownership,
  FORCE flags, grants, policies, exact `contact_*` names, views, materialized views,
  foreign tables, callable functions, sequences and default privileges. You run
  it manually; it does not select student records or execute RPCs.
- No `policies.sql` is appropriate for CASE A. App-level public content is served
  by server routes; that does not require granting direct database API access.

**Can enabling RLS break the application?** Yes, if Render's actual role is
restricted or some tables have a different owner/forced RLS. Ordinary table owners
bypass RLS unless FORCE is set. Superusers and BYPASSRLS roles bypass it even with
FORCE. If the actual app role has effective owner access without FORCE, or
superuser/BYPASSRLS access, zero policies preserve its SQL reads/writes. Otherwise
they block reads/writes; the app supplies no Supabase Auth identity to policies.
This cannot be resolved from the repository alone. Do not add FORCE or grant new
bypass privileges as a workaround without separate review.

**Can public be removed from Data API exposed schemas?** For this repository's
application, yes: Prisma/raw `pg` use PostgreSQL directly and no API consumers
were found. Removing API exposure does not remove the SQL schema or change SQL
`search_path`. Confirm there are no outside integrations first. If the Data API is
unused entirely, disable it; otherwise remove `public` from its exposed schemas.
Review GraphQL exposure/permissions separately; do not assume a REST setting
disables every API surface. No Supabase SDK feature in this app depends on it.

**Where RLS alone is insufficient:**

1. Existing permissive policies: enabling RLS activates them; the prepared SQL
   stops for review. API-role effective ownership/superuser/BYPASSRLS also defeats
   this configuration and causes the prepared SQL to stop.
2. Owner-context views and SECURITY DEFINER RPC functions can bypass underlying
   table RLS. Materialized views cache separate data; foreign tables cannot be
   secured by this RLS loop. No such exposure is proven in production, and none
   is defined in repository SQL. Review catalog results and revoke/unexpose unsafe
   access or design reviewed invoker rules; this file does not guess those changes.
3. RLS does not guard sequences or whole-table operations such as TRUNCATE. Normal
   PostgREST table endpoints do not offer TRUNCATE, but privileged callable RPCs
   can. Client-role grants and callable functions therefore still need review.
4. Future tables/default grants: this one-time script protects current tables
   only. Disable automatic API exposure/default client grants in dashboard where
   available and keep the unused schema/API unexposed. Recheck after schema work.
5. Other exposed schemas, leaked privileged credentials, and server-route
   authorization are outside public-table RLS. An anon read test does not test
   authenticated/service-role access or writes.

## Owner execution order

1. Privately confirm Render's actual database username/role and port/pool mode.
   Run **only** `inspect-api-surface.sql` in the dashboard and save results. Match
   every application table to its owner/FORCE status and the app role's effective
   privileges. Review existing policies, API-role privileges, views and functions.
   Stop if the app role cannot bypass zero-policy RLS or an access rule is unknown.
2. Export the exact `contact_*` names as one name per line. Run the read-only
   verifier **before** changes if you need an exposure baseline. It will not print
   PII. Save its status output, not any raw record response.
3. Confirm external integrations. Contain access immediately by removing unused
   `public` Data API exposure, or disabling the unused Data API entirely. Review
   the GraphQL surface too. This repository has no dependency on these APIs.
4. Run `enable-rls.sql` manually. Save its BEFORE table list for selective rollback.
   If a guard or lock timeout fails, roll back the transaction in the SQL Editor
   if necessary; do not proceed by deleting the guard. AFTER must return zero rows.
5. Rerun the catalog checks and verifier. A 200 `[]` is compatible with zero-policy
   RLS but also with a genuinely empty table; compare your saved baseline and the
   catalog flags/policies. A 404 or invalid-key response is **not proof**. If the
   Data API is disabled and returns generic 404, confirm that setting explicitly.
   The verifier deliberately never attempts INSERT/UPDATE/DELETE or calls RPCs.
6. Check the app's normal authentication, course, support, Talent/hiring and admin
   workflows, plus flush health, using appropriate test accounts/staging for
   writes. Monitor database permission errors and persistence health after rollout.
7. Keep API exposure closed, review any callable functions/grants, and rerun the
   flags/inventory checks after future table creation. A rollout is complete only
   when actual role compatibility and all exposed surfaces have been verified.

If rollback is needed, **close API exposure first**, then uncomment the rollback
and fill its array with only the saved BEFORE table names. It deliberately refuses
an empty list and will not blanket-disable tables that were already protected.

### Read-only verification command

Use Bash (Git Bash on Windows), curl and the existing Node runtime. Do not source
the real `.env` or put a key in a command argument/history. For example:

```bash
set +x
read -r -p 'Supabase project HTTPS URL: ' SUPABASE_URL
read -r -s -p 'Supabase anon/publishable key: ' SUPABASE_ANON_KEY
printf '\n'
export SUPABASE_URL SUPABASE_ANON_KEY
bash scripts/verify-rls.sh --tables contact-tables.txt
unset SUPABASE_ANON_KEY SUPABASE_URL
```

Omit `--tables` if using only the six known sensitive tables plus anonymous
OpenAPI-discovered `contact_*` paths. Hidden paths can be omitted from OpenAPI,
so use the catalog inventory for complete contact coverage. Additional sensitive
tables can be added to that file too. Table names are validated and deduplicated.
Credentials go to curl via stdin, never argv/files. No redirects are followed,
curl user configuration is ignored, TLS validation stays enabled, and HTTP is
allowed only for loopback test fixtures. JWT role decoding only rejects unsuitable
test credentials; the API still validates the key/signature.

| Exit | Meaning |
| --- | --- |
| 0 | Every requested table probe was permission-denied or rejected the public schema; not a claim about writes or undiscovered objects |
| 1 | At least one table returned rows: exposure remains |
| 2 | Empty/missing/unexpected/auth/config/transport result: inconclusive; inspect the baseline and catalog |

### Local validation, without database access

```bash
bash -n scripts/verify-rls.sh
node --test test/rls-security.test.js
```

Tests use fake keys and a loopback HTTP fixture only. They verify GET-only probes,
no output of record contents/keys, exposure and denial classification, rejection
of privileged credentials, publishable-key headers, contact discovery/inventory,
deduplication, and ambiguous/error responses. No SQL is executed. SQL files require
owner dashboard review; they have not been validated against a database. The full
existing suite is intentionally not run here because some tests execute SQL.

## Primary references

- [Supabase RLS: grants, zero policies and view exposure](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API hardening and disabling unused Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [PostgreSQL RLS: owners, FORCE, bypass roles and non-row operations](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supavisor modes and project-qualified usernames](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI)
- [Supavisor pool-mode configuration](https://supabase.com/docs/guides/troubleshooting/how-do-i-update-connection-pool-settings-in-my-dashboard-wAxTJ_)
- [Supabase API key types](https://supabase.com/docs/guides/getting-started/api-keys)
