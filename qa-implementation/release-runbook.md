# Configuration, migrations and release checks

Changes are on `fix/qa-workflow-remediation`, based on `5fcab96`. They are local, uncommitted and undeployed. The original audit artifacts remain unchanged. No production data or external recipients were used.

## Local verification

From the repository root, use `node qa-implementation/local-server.cjs` in a dedicated terminal. It uses port 4318, its own JSON data/uploads under ignored `qa-implementation/runtime/`, synthetic `@qa.invalid` accounts, a fixed **test-only** JWT secret, disabled dotenv loading, disabled integration credentials and a test DNS response only for `qa.invalid`. Never run this harness as a public service. It is not a deployment entry point.

Run security checks before browser login tests because the former reset synthetic passwords and invalidate sessions. Workflow checks mutate only their synthetic fixtures and exercise idempotent repeats. A first seed creates the accounts; subsequent runs reuse them. `free@qa.invalid` becomes enrolled during the paid lifecycle test; `observer@qa.invalid` remains the unrelated free account. Login uses email because enrollment may update the username.

```powershell
node --test test/atomic-json.test.js test/certificate-final-project.test.js test/draft-store.test.js test/gem-totals.test.js test/learning-attempts.test.js test/registration.test.js test/upload-access.test.js
node qa-implementation/security-checks.cjs
node qa-implementation/workflow-checks.cjs
node qa-implementation/browser-regression.cjs
node qa-implementation/ui-survey.cjs
node qa-implementation/final-checks.cjs
node qa-implementation/capture-inventory.cjs
node qa-implementation/build-deliverables.cjs
node qa-implementation/review-artifacts.cjs
```

Browser scripts use the repository audit browser helper and the installed local Playwright/Chrome executable. On a different machine, adapt the executable/cache path in that helper; it is not a portable CI browser installation. For a fresh fixture set, stop the local server and manually archive only the resolved `qa-implementation/runtime` directory inside this workspace, then restart. Do not point the harness at an existing database or production uploads.

`node qa-implementation/video-checks.cjs` and `node qa-implementation/in-app-playback.cjs` contact public YouTube pages and resume their saved evidence. They do not deliver messages or use accounts. Network checks are time-sensitive. Full playback/content revalidation is still necessary when releasing later.

## Database modes: choose exactly one

This repository contains both a normalized Prisma schema and an older JSON-row migration runner. Determine the existing deployment mode from its established configuration/migration history **before** applying anything.

| Existing deployment | Required change |
|---|---|
| Normalized PostgreSQL/Prisma | Apply `prisma/migrations/20260909000000_qa_attempts_registration_guard/migration.sql` through the existing Prisma migration workflow. Generate the updated Prisma client. |
| Legacy JSON-row PostgreSQL | Apply the existing legacy runner's `migrations/0009_qa_attempts.sql`; collection registration is updated. |
| JSON file development mode | No SQL migration. The store initializes the new `open_attempts` collection and sequence without modifying existing grades/certificates. |

**Never apply both SQL variants to one database.** The schemas of `open_attempts` differ by persistence mode. `npm run migrate` is the legacy runner; it is not the normalized Prisma deployment command.

For the normalized mode, the configured `DIRECT_URL` must target the intended direct PostgreSQL connection; the app retains its normal `DATABASE_URL`. On an isolated staging database, inspect the migration plan and existing migration history, take a backup, then use the established Prisma CLI (`npx prisma migrate deploy` and `npx prisma generate`). Schema validation alone does not execute migration SQL. No database migration was applied during this task.

The new normalized table stores immutable submission payloads plus attempt status, owner, task identity and request key. Unique `(user_id, request_key)` enforces attempt request identity. The registration unique index applies only to rows marked `status.dedup_guard = v1`, preserving existing ambiguous duplicates. Test normalized email/course concurrent inserts and a duplicate-index rejection in staging; verify the API recovers cleanly rather than trusting local single-process evidence.

## Runtime requirements and integration checks

Use **one app/worker instance** for this release candidate. The existing store holds a process-local snapshot and the worker does not implement distributed leases. A SQL unique index alone does not make the whole application safe for multiple writers. Complete a separate distributed persistence/claim design before scaling horizontally.

Keep the established production JWT secret stable and configured. New sessions bind to the user's persisted password hash; existing tokens without the version field will require sign-in once after rollout. This is intentional. Do not use the local harness secret. Reset tokens remain process-local and expire after 30 minutes; a restart can require requesting a new link.

Use existing configured providers, without adding secrets to source control:

- SMTP/mail: test a sandbox recipient, provider acceptance identifier, actual inbox arrival, failure/retry, receipt recovery and duplicate click. `provider_accepted` must never be displayed as confirmed inbox delivery. Reconcile a process crash after a provider accepts but before its acknowledgment persists; there is no provider-side exactly-once guarantee.
- AI grading: test successful code and attachment grades, provider rejection, timeout, interruption/restart, bounded retry and an admin-reviewed failure. Confirm original best results and certificates persist. The local successful worker test uses a fake grader; the local HTTP workflow uses authorized manual grading.
- PostgreSQL: migrate a scratch copy; verify cold start/hydration, persisted attempts after restart, admin recovery, unique constraints and whole-record write failure behavior. Run the existing `talent.test.js` against its documented disposable database requirements. Do not run it against production.
- R2/storage: exercise showcase image publication and deletion and talent resume consent on staging, including unrelated-user denial. Local upload policy tests cover purpose/ownership rules, not a cloud lifecycle.
- Google/JaaS: test OAuth state/return-path validation and scheduled class join with designated sandbox configuration. Provider login and real meetings were not exercised here.

Before release, repeat the learner run/submit/feedback/resume and paid registration/invoice/manual sandbox clearance/enrollment paths against the selected real staging database. Test Firefox/Safari, real touch devices, screen-reader dialog use and contrast. The completed visual checks use Chrome at 1440px and 390px.

## Rollback

Take a database snapshot and retain the current code/artifact versions before rollout. Pause submissions, staff grading and outbound delivery during migration or rollback. Stop the worker before restoring a snapshot or reverting code so it cannot append competing results.

Prefer a forward correction. Older application code has the security and grading defects fixed here, so reverting application code is not a safe default. If a rollback is unavoidable, restrict affected routes while restoring the known version and arrange a security patch. Keep the additive attempts table and registration index; do not drop attempts or delete learner records merely to fit older code. An index/table rollback requires a separate reviewed data export and schema-specific plan. Restoring a pre-release database snapshot loses post-snapshot work unless those changes are reconciled first.

Password resets performed after rollout remain persisted. Do not restore older password hashes to make sessions work. Reverting session validation could accept old tokens again; rotate/revoke sessions deliberately if a security rollback is unavoidable.

## Release blockers and decisions

1. PostgreSQL migration/persistence and real provider grading/delivery checks above are not complete.
2. Restrict deployment to one writer/worker instance; horizontal scaling is not verified.
3. Correct the confirmed C++ classes-video mismatch, review advanced tooling/prerequisites and resolve all remaining content/playback UNVERIFIED rows before representing the complete curriculum as verified.
4. Keep PATH enrollment disabled until authoritative component, price, placement and repeat-purchase rules exist.
5. Talent, showcase and live-class full workflows remain integration-blocked. Capability handling is partial for image sharing/live sessions (E-04).

The patch can be reviewed now. These conditions prevent an unconditional whole-product production-readiness claim.
