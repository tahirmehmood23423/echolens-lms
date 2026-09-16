# Talent request crash interrupting certificates

Validated locally on 16 September 2026. These checks did not modify or deploy production.

## Cause and correction

The reported stack points to `GET /api/talent/me`, not the certificate renderer. The production database lacks `talent_profiles`. After the switch to normalized Prisma persistence, startup stopped invoking the legacy migration runner, but Talent continued using relational tables defined only in `migrations/0003` through `0006`. Express 4 does not handle rejected async route promises automatically, so the query rejection escaped the request and terminated Node.

- `store.initFromPostgres()` now awaits the four supplemental Talent migrations before loading records, starting the grading worker, or accepting requests. It never replays the legacy core LMS migrations on normalized tables.
- The migration runner retains checksums and transactions. Transaction-scoped advisory locks serialize migration work during overlapping boots. A failure rolls back the current migration and prevents startup with an incomplete schema.
- Talent profile, project, hiring, search, and admin routes use the existing async error forwarding pattern through a shared helper. Database failures reach the HTTP error handler and return a generic 503 without exposing SQL or terminating the server. Authentication and role restrictions still apply.
- Certificate requirements, grades, certificate records, and access rules are unchanged. No environment variables or production providers were added. PGlite is declared as a development dependency for isolated PostgreSQL regression checks.

The Gemini quota warning is separate: the grading worker catches provider errors. It can leave an assessment ungraded, which can still prevent automatic certificate eligibility. Existing manual staff grading or a configured `GROQ_API_KEY` fallback can address that condition; this repair does not manufacture passing grades.

## Verification

Result: **77 local tests passed**, including all five new schema/HTTP regressions and the existing certificate, grading, enrollment, support, registration, and access checks. JavaScript syntax and `git diff --check` passed. The external-Postgres-only `talent.test.js` suite was not run.

Run the focused checks with:

```sh
node --test test/talent-schema.test.js test/talent-resilience.test.js test/certificate-final-project.test.js
```

The schema checks execute the actual SQL in an isolated in-memory PostgreSQL engine (PGlite). They cover installation alongside normalized LMS tables, search and skill triggers, repeated startup without losing profiles or certificates, upgrading a partial installation, transaction rollback/retry, and checksum mismatch rejection.

The HTTP regression starts the actual server with synthetic JSON LMS records and a separate empty PGlite database for Talent queries. It reproduces real `42P01` errors in profile, hiring, and admin routes while issuing a certificate. It checks 401/403 access restrictions, controlled 503 responses, certificate creation, public verification, learner listing, PNG rendering, persistence, and repeat issuance without duplication. Applying the actual Talent migrations restores the profile and hiring APIs in the same process.

These checks do not exercise a hosted PostgreSQL connection, production pooler configuration, real email, or live AI grading. The older `test/talent.test.js` suite requires a disposable external PostgreSQL server with database creation privileges; it is excluded from local checks without that server.

## Render rollout

1. Deploy these code changes through the existing Render deployment workflow and restart the service. Pending Talent migrations run automatically before the usual `[store] loaded from Postgres` and listening messages.
2. If applying the supplemental schema explicitly, run `npm run migrate:talent` in the deployed Render Shell with its existing `DATABASE_URL`, then restart. Do not run the full legacy `npm run migrate`, any import script, or a schema reset against the normalized production database.
3. Verify that `/api/talent/me` returns 200 for an authenticated portal student, including students who have not created a profile. Retry certificate issuance for an eligible learner, then verify the serial and download its image.
4. If issuance reports incomplete assessments, review the learner's pending/failed grades separately from this server crash. If startup fails, inspect the named migration and database permissions in the log; do not bypass the failure by deleting existing records or migration history.

The SQL is additive and preserves existing LMS data. If reverting the application, retain the supplemental tables and migration history. Removing them recreates the reported failure in older application versions.
