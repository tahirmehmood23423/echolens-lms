# Flush failure diagnostics and recovery

Step 1 updates diagnostics only. The persistence transaction, its 60-second timeout and database schema remain unchanged.

`GET /api/admin/flush-health`, failure logs and the first-failure alert include the complete error message, code and metadata. Messages are no longer reduced to the first line, which Prisma can leave blank.

Failed-flush created/updated records use recursive redaction, including arrays, nested learner profiles, bank snapshots, student email fields and camelCase credential aliases. Source records are not mutated. Error messages and free-form text are diagnostic text and can contain private values; keep dump files and administrator diagnostics private.

The exported `assertReplayableDump` guard in `flush-diagnostics.js` must validate the entire parsed dump before any replay writes. It rejects `[redacted]` anywhere, reporting its field path. Restore original values from a trusted source before replay. Do not write placeholders, silently remove fields or rename a rejected dump to `.replayed`.

The replay CLI and chunked persistence implementation are deferred to the separately approved step 3. Current dumps are not complete backups: settings and issued-name registries are not captured. Do not import them directly into PostgreSQL.

Validation: `node --test test/flush-diagnostics.test.js` covers multiline error preservation, nested redaction without mutation, and rejection before writes. No production connection or real `.env` access is required.

Step 1 verification: four focused tests pass; syntax and diff checks pass. The sequential existing suite (`node --test --test-concurrency=1 test/*.test.js`, with an empty `DATABASE_URL`) reports 123 passing tests and one failure: `talent.test.js` explicitly requires a PostgreSQL test database. The default parallel run encountered server-fixture startup timeouts; those tests pass in the sequential run. No production database was contacted and no lint/typecheck tooling was added.

## Step 2: preparation before the transaction

The queue captures and recursively freezes a JSON snapshot when its serialized entry starts, after synchronous business mutations finish. This keeps a grade/gem or challan/registration operation together even when it calls save twice. Live changes during database awaits cannot alter the snapshot or committed baseline; they remain pending for the next queued flush.

`normalized-flush-plan.js` computes the entire diff, date/field conversions, query arguments, row counts and next baseline before BEGIN. The transaction callback executes only prepared database operations. Error context is tagged only on a rejected query, preserving collection/operation diagnostics. The baseline and successful-write accounting advance only after commit. An unchanged plan skips opening a transaction. Per-row updates and the existing 60-second whole-flush transaction deliberately remain until step 3.

`FLUSH_DISABLED=true` now guards the flush function itself, before snapshot capture or database-client construction. The previous module-level return prevented store exports from loading. Keep the default `FLUSH_DISABLED=false`. Pausing flushes does not make in-memory writes durable or stop application writes; restarting while paused can lose them. This is an emergency pause, pending the WAL step.

All three diagnostic GET endpoints require an authenticated admin and bypass response waiting on a failed persistence promise:

- `/api/admin/flush-health`: last successful flush, failure details, current pending record counts (including deletes), last duration and timing split.
- `/api/admin/list-dumps`: regular failed-flush JSON filenames, sizes and modification times.
- `/api/admin/inspect-dump?file=failed-flush-<timestamp>.json`: per-collection create/update/delete counts and one recursively masked record. Rejects traversal, symlinks, malformed JSON and files above 32 MiB.

Dump endpoints use the directory containing `DB_PATH`; keep Render's `DB_PATH=/data/echolens.json`. No additional provider credentials, schema changes, migration files, pool changes or timeout increases are required. Health pending counts still scan current records outside the transaction; step 3 will replace this with dirty-ID accounting.

Flush logs and health timings report `captureMs`, `preparationMs`, `scanSerializeMs`, `dbMs`, `totalMs`, query count and committed rows per collection. `dbMs` is database-phase wall time, including pool acquisition, driver serialization, query waits and commit; it is not PostgreSQL CPU time. Queue waiting and failure-alert/dump overhead are not included. The process-wide query-count delta can include concurrent Prisma activity; the benchmark uses a dedicated client.

Reproduce the step-2 measurement using `TEST_DATABASE_URL` pointing to an isolated localhost PostgreSQL server, then `node scripts/benchmark-flush-step2.cjs`. The benchmark refuses non-loopback servers, creates a generated scratch database, applies only checked-in schema SQL there, writes fictional records and drops that scratch database afterward. It compares commit `78736d0` with the current implementation, three runs each, using 5,000 updated Users with 1 KiB profiles. `FLUSH_BENCH_ROWS` can change that count (1–50,000). The pre-change scan time is callback wall time minus awaited query time; the after-change preparation time is measured directly. No real `.env`, live customer records or production connections are used.

Measured on 2026-09-18 against local PostgreSQL 16 in Docker with Prisma 7.9.0. A repeat with no competing test suite (`FLUSH_BENCH_RUNS=1`) produced:

| Metric, 5,000 changed Users | Before | After |
| --- | ---: | ---: |
| Total flush wall time | 35,384.88 ms | 32,156.53 ms |
| Non-query callback overhead / snapshot plus preparation | 1,895.83 ms (estimated) | 185.69 ms (directly timed, outside transaction) |
| Database phase wall time | 33,483.37 ms (estimated) | 31,968.99 ms |
| Open transaction wall time | 35,379.21 ms | 31,968.95 ms |
| Prisma query events | 5,001 | 5,001 |

The first three trials per version overlapped regression testing during the after phase: before total times were 37.05/35.23/37.10 seconds, after 38.89/43.18/41.38 seconds. These noisy trials do not establish a speed improvement. The repeat is one local comparison, not production performance evidence or proof that the remaining per-row database workload will stay under 60 seconds at higher volume. Old non-query callback overhead includes loop/control overhead; new database-phase time still includes executing the prepared-operation loop and Prisma's internal serialization. The application scan, diff and row conversions no longer run while the transaction is open.

Verification: eight focused diagnostics/preparation/API tests pass, including immutable nested records, pending live changes, no-op planning, parent/child ordering, disabled-client construction, masked dump samples, role authorization and diagnostics remaining available when persistence fails. Syntax and diff checks pass. The sequential existing suite reports 127 passes and one unchanged failure: `talent.test.js` exits because its legacy PostgreSQL integration setup requires `DATABASE_URL`. It was not connected to production; the separate benchmark did execute against real isolated PostgreSQL. No lint or typecheck tooling was added. Step 3 and later steps remain pending review.
