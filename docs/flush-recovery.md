# Flush failure diagnostics and recovery

Step 1 updates diagnostics only. The persistence transaction, its 60-second timeout and database schema remain unchanged.

`GET /api/admin/flush-health`, failure logs and the first-failure alert include the complete error message, code and metadata. Messages are no longer reduced to the first line, which Prisma can leave blank.

Failed-flush created/updated records use recursive redaction, including arrays, nested learner profiles, bank snapshots, student email fields and camelCase credential aliases. Source records are not mutated. Error messages and free-form text are diagnostic text and can contain private values; keep dump files and administrator diagnostics private.

The exported `assertReplayableDump` guard in `flush-diagnostics.js` must validate the entire parsed dump before any replay writes. It rejects `[redacted]` anywhere, reporting its field path. Restore original values from a trusted source before replay. Do not write placeholders, silently remove fields or rename a rejected dump to `.replayed`.

The replay CLI and chunked persistence implementation are deferred to the separately approved step 3. Current dumps are not complete backups: settings and issued-name registries are not captured. Do not import them directly into PostgreSQL.

Validation: `node --test test/flush-diagnostics.test.js` covers multiline error preservation, nested redaction without mutation, and rejection before writes. No production connection or real `.env` access is required.

Step 1 verification: four focused tests pass; syntax and diff checks pass. The sequential existing suite (`node --test --test-concurrency=1 test/*.test.js`, with an empty `DATABASE_URL`) reports 123 passing tests and one failure: `talent.test.js` explicitly requires a PostgreSQL test database. The default parallel run encountered server-fixture startup timeouts; those tests pass in the sequential run. No production database was contacted and no lint/typecheck tooling was added.
