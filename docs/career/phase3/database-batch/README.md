# Database Design: complete authored draft batch

## Delivered scope

**`database-design` — Database Design and PostgreSQL** now has **three canonical modules, 12 original lessons, 76 new formative MCQs, 90 new draft comprehensive items and 12 distinct worked database fixtures**. All six canonical objectives have teaching and question mappings. The course remains an AI-assisted draft, not a fully human-reviewed or published course.

The existing curriculum defines three modules (Modelling relationships, Constraints and integrity, Normalisation), not the suggested four. That structure was preserved with **four lessons per module**. Requirements, tenant-aware modeling, keys, the commerce case, types/constraints, referential rules, basic transactions, normalization, controlled denormalization/indexing and schema evolution are covered without changing canonical competencies. Advanced isolation, query-plan tuning and live migration operations remain in `db-integration-performance`.

## Initial audit and baseline

Local branch: `codex/career-integrity-ux`. Previous REST commits `199f362` and `6b31c56` were present and unpushed. Fetched `v8-test` was still `4799127`, an ancestor of this work; no remote history was overwritten. Deployment/runtime catalogue status could not be independently verified.

The actual role is `junior-backend-developer` (Junior Backend Developer), whose source references include junior Python positions. The separate Python/FastAPI specialist role and the junior optional requirements were not silently substituted. The prior matrix had five authored drafts and no approved new lesson releases. Database Design had zero lessons and no comprehensive bank.

Before editing, the relevant isolated baseline suite executed: **164 passed, zero failed**. Existing scoring, progression, remediation, teacher/admin authoring and publish/review paths were inspected and reused.

Existing SQL Fundamentals covers `sql-relations`, `sql-null`, `sql-inner-joins`, `sql-fanout`, `sql-grouping`, `sql-safe-insert` and `sql-safe-delete`. Those remain the prerequisite resources for SQL reading/query semantics. No lesson or enrollment was copied into a duplicate SQL course. TT-06’s actual PostgreSQL internals course assumes those skills and is a follow-on resource, not complete beginner database modeling teaching. **12 new lessons; zero copied/relabelled existing lessons.** Existing shared canonical identities and 13 CS-104 optional practice references remain unchanged.

## Lessons and competencies

| Module | Lessons | Canonical objectives |
| --- | --- | --- |
| Modelling relationships | Business requirements/invariants; cardinality/junctions/tenant ownership; candidate/natural/surrogate keys; orders/lines/inventory/payment history | `m1.c1` relationships; `m1.c2` key selection |
| Constraints and integrity | PostgreSQL data types; NULL/uniqueness/CHECK; referential actions; transactional/concurrent-operation invariants | `m2.c1` enforced integrity; `m2.c2` PostgreSQL types |
| Normalisation | Dependencies and normal forms; normalized library case; controlled redundancy/index patterns; compatible schema evolution/review | `m3.c1` anomaly removal; `m3.c2` justified denormalization |

Each lesson includes prerequisite context, measurable objectives, progressive theory, original business examples, worked schema statements and expected rows, steps/reasoning, mistakes, tradeoffs, takeaways and a three-item knowledge check. Relationship diagrams, before/after tables and highlighted/copyable SQL use existing UI components. The additional SQL snippet language is allowlisted; no raw HTML authoring or executable student submission path was introduced.

The content distinguishes candidate keys from sample uniqueness, one-to-one from an ordinary foreign key, business identity from surrogate row identity, tenant-compatible references from read authorization, historical line prices from current-data copies, and real normalization dependencies from “more tables is always better.” It covers 1NF/2NF/3NF reasoning with the stated domain assumptions and warns against merging real entities by display-name equality.

## Questions and existing engine integration

- **76 distinct formative questions**, four options/one key with explanations and distractor notes.
- 36 primary lesson-quiz items (three per lesson), plus 40 further pool items. Checkpoints draw nine items from covered module pools of 26, 26 and 24, including the lesson items. This is 76 unique questions, not 112.
- **90 original comprehensive items**, all draft/unreviewed. Difficulty counts: 18 easy, 32 medium, 31 hard and nine advanced; 63 tagged original workplace scenarios. Ratings are provisional author judgments, not psychometric calibration or human review.
- The existing 30-item form blueprint, configured 20/35/35/10 difficulty mix, minimum 70% scenarios, overall/critical passing rules, timers and retake rules are unchanged.
- No new assessment engine or mandatory SQL assignment/manual grading was added. Formal scoring stays MCQ-only.

The new bank is absent from the historical auto-approved bank list. Its `reviewed_by` is null and each item remains `draft`. Both individual item review/publication and exact-version lesson human approval are required before the new course becomes student-visible. Synthetic approval in disposable tests does not alter repository drafts or production settings.

Integration tests complete every reading/lesson quiz, all three checkpoints and a passing final; directly pass the final for another student without marking any lesson read; fail relevant competencies, link to actual fixture lessons, require remediation and generate a fresh final while preserving earlier attempts. Opaque choices and restricted pregrade keys remain in force. Existing student history, enrollment, certificate, reward and shared skill records retain their meaning.

## Database verification: exact scope

Every one of the 12 fixtures executes twice through separate test paths:

1. The existing network-isolated bubblewrap verifier uses **in-memory SQLite** and compares declared output.
2. A fresh **PostgreSQL 17.5 on WASM**, through the app’s existing pinned **PGlite 0.4.3** dependency, executes explicit statement arrays and compares the same output. It then runs **29 additional probes** with expected SQLSTATEs or exact rows.

No new engine dependency or version upgrade was retained. Native PostgreSQL binaries/privileged installation were unavailable; the existing PGlite dependency used by the demo system was reused, with its original package and lockfile preserved. The verifier never reads `.env`, a database URL, the application store or student records. All schema creation/drop occurs only within a fresh in-memory engine.

Covered fixtures: student/application one-to-many; tenant-qualified enrollment junction; alternate keys; complete commerce schema/history; exact amount representation; flawed/corrected active-loan uniqueness; restrictive/cascading references; rollback/conditional stock updates; dependency-based decomposition; authorship normalization; composite access index; expand/backfill migration overlap.

PostgreSQL probes include rejected missing owners, missing/cross-tenant parents, duplicate keys, nonpositive quantities, NaN, overflow and false CHECK; allowed CHECK-unknown semantics; ordinary unique NULL behavior; a partial unique active-loan index; numeric rounding; equivalent timezone-qualified instants; JSONB extraction; actual index catalogue records; permitted nonunique secondary-index duplicates; rollback and sequential allocation predicates; and old/new writers during migration overlap.

**Limits are explicit:** PGlite is a single-process WASM PostgreSQL engine, not evidence about a deployed native server. Two independent concurrent sessions were **not** raced. Sequential guarded updates do not become a native race test. No power-loss/storage crash, production planner performance, live migration locking or actual provider reversal was tested. Concurrent reasoning is grounded in the documented semantics and still needs native multi-connection integration testing before operational claims.

See [recorded PostgreSQL evidence](postgresql-verification.json). It includes engine version, exact fixture/code hashes, each passed probe and `native_multi_connection_test:false` / `storage_crash_test:false`.

### Confirmed defensive verifier correction

The initial referential example exposed that the old SQLite verifier left `foreign_keys` disabled. It could therefore accept invalid child rows or fail to apply referential actions despite correct-looking DDL. The existing runner now enables `PRAGMA foreign_keys=ON` before executing SQL. A regression verifies that a nonexistent parent is rejected. All earlier worked/code examples still produce their expected outputs; no historical scores or assessment thresholds were changed.

### Evidence-bound approval and admin tracking

Database course approval additionally requires matching PostgreSQL/WASM evidence for each worked example and its checked fixture. Changing its code/expected result or fixture invalidates that evidence; publishing cannot rely on the unrelated SQLite success alone. The existing human review is still necessary for prose, keys, references and suitability. A title-only text edit does not manufacture new engine evidence or remove the exact-content human-review requirement.

The existing admin matrix shows PostgreSQL/WASM counts separately from generic worked-example counts. It does not label a structural pass as human approval, nor claim every course was run through PostgreSQL. The content inventory includes the explicit engine and native-test limitations.

## Sources and validation tools

Official PostgreSQL 17 source documentation is pinned at `e6b2f7c2b41d6261dac15825dede55e94ca35614` in `postgres/postgres`: `ddl.sgml`, `datatype.sgml`, `queries.sgml`, `indices.sgml`, `advanced.sgml`, `mvcc.sgml`. Reference files were compared with the pinned Git objects and hashes recorded. Public HTML URL availability and production behavior are not claimed verified. Human source review must still check normalization explanations, engine-specific behavior, references and all item keys.

New tool: `npm run verify:career:database -- --output /tmp/database-verification.json`. It emits evidence, never human approval/publication. The existing content validator still performs fresh bubblewrap code execution by default. Private reviewer HTML includes the full instructional/assessment material; the builder refuses output under `public/`.

## Tests executed

| Check | Result |
| --- | --- |
| Initial relevant baseline | 164 passed, zero failed |
| Final content structure, six drafts | 69 lessons, 432 formative MCQs; zero errors/warnings |
| Existing isolated example/code verifier | 102 executable checks passed |
| New PostgreSQL/WASM engine verification | 12 worked examples + 29 probes passed |
| New comprehensive bank validator | 90 items; zero errors/warnings; length-only guess rates 21%, 39%, 25% |
| Relevant Node regression suite | 168 passed, zero failed |
| Final learning browser suite | 100 checks passed, zero JavaScript errors |
| Responsive widths | 320, 390, 768, 1024, 1440 |
| Full Node suite | 325 tests: 313 passed, 11 failed, one skipped |
| Syntax/patch-whitespace checks | Passed |

Browser checks cover all six authored courses’ existing flows plus database guided/direct learning, individual MCQ keyboard interaction, each checkpoint/final, SQL code/relationship diagrams, mobile normalization-table scrolling and the admin engine-evidence display. Test-only publication uses synthetic accounts and temporary stores with external resources blocked.

The 11 full-suite failures match the established baseline: missing generated Prisma client in mapping/flush/certificate/course checks, a Postgres-only Talent test without an isolated database, demo admin/coordinator overview failures and the legal-placeholder assertion. They remain unresolved, separately reported and unchanged; no tests were removed to hide them. Final worked-problem wording was made distinct from each introduction after the full run, then content validation and the 100-check browser run were repeated; executable SQL and behavior did not change.

## Updated mandatory-path matrix

The actual role remains nine required subtracks. Counts below represent **authored drafts**, not fully human-reviewed/published courses. Every authored lesson has a primary quiz; no new lesson release is published.

| Order | Canonical subtrack | Modules | Lessons | Practice MCQs | Checkpoints | Comprehensive / state | Verified worked examples | Human review | New lessons published |
| ---: | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| 1 | `programming-foundations` | 4 | 12 | 72 | 4 | 90 / published | 12 | pending | No |
| 2 | `python-fundamentals` | 4 | 12 | 72 | 4 | 90 / published | 12 | pending | No |
| 3 | `http-web-architecture` | 3 | 9 | 56 | 3 | 90 / draft | 9 | pending | No |
| 4 | `rest-api-design` | 4 | 12 | 76 | 4 | 90 / published | 12 | pending | No |
| 5 | `sql-fundamentals` | 4 | 12 | 80 | 4 | 90 / published | 12 | pending | No |
| 6 | `database-design` | 3 | 12 | 76 | 3 | 90 / draft | 12 | pending | No |
| 7 | `api-security-auth` | 3 | 0 | 0 | 0 | 0 / planned | 0 | not authored | No |
| 8 | `backend-testing-reliability` | 3 | 0 | 0 | 0 | 0 / planned | 0 | not authored | No |
| 9 | `git-collaboration` | 3 | 0 | 0 | 0 | 90 / published | 0 | not authored | No |

[Full matrix JSON](completion-matrix.json) · [CSV](completion-matrix.csv) · [complete content inventory](content-inventory.json).

Cumulative actual totals:

- **6 of 9 mandatory subtracks have authored drafts**; 22 authored modules, 69 lessons/lesson quizzes, 22 checkpoint pools and 432 formative items across those courses.
- Seven canonical comprehensive banks / 630 questions, including **two draft banks** (HTTP and Database Design); five prior banks remain published under their existing metadata.
- 540 comprehensive questions map to draft teaching; those mappings include unpublished banks and are not new human approval.
- 69 distinct worked examples; the 12 Database Design examples verified in both engines are not counted twice. The 102 generic code checks include 33 pre-existing question snippets; the 29 PostgreSQL probes are reported separately.
- Zero newly human-approved lesson releases, zero newly published courses, zero complete approved role pathways.
- 126 global subtracks still need full authored lesson sets, covering 623 objectives without confirmed written coverage in this pipeline. Existing resource candidates can contribute after detailed review.
- The catalogue remains 16 public free listings, distinct from the six-course Trending Tech subset. These are repository/runtime snapshots, not proof of deployed overrides.

## Remaining mandatory work and release status

**Next: `api-security-auth`**, following the authored REST prerequisite. It needs full lessons, formative pools and a canonical comprehensive bank. Then `backend-testing-reliability` (Python prerequisite; no bank) and `git-collaboration` (existing 90-item bank) remain unauthored. All six authored courses still need actual human content review/publication. The role final and pathway must not be represented as complete before all mandatory components are ready and accepted.

Implementation: `dd5a7e2`, branch `codex/career-integrity-ux`. Previous unpushed REST commits remain intact. **No push, merge or deployment occurred in this batch.** No production database, student records, actual payments or external API credentials were used. No migrations, account/enrollment duplication, certificate/reward rewrites, ShipLens or competition changes occurred.

Private review materials live under `/workspace/echolens-audit/phase3-database-review/`; the bundle contains full lessons, practice/comprehensive keys, PostgreSQL fixtures/evidence, reports, patch and test/browser logs. **It contains answer keys and must not be copied into public assets.**

Reproduce with pinned reference checkouts:

```sh
npm run verify:career:database -- --output /tmp/database-verification.json
node scripts/validate-career-learning.js --source-root /path/to/cpython --source-root-postgres /path/to/postgres --source-root-http /path/to/http-core --source-root-openapi /path/to/openapi --output /tmp/learning-verification.json
node scripts/career-learning-inventory.js --output /tmp/content-inventory.json
node scripts/build-career-learning-review.js /tmp/private-review
npm run test:career:learning:browser
DATABASE_URL= DB_PATH=/tmp/career-tests.json MAIL_DRY_RUN=true node --test --test-concurrency=2 test/career*.test.js test/student-workspace.test.js test/free-enrollment.test.js test/postgres-tls.test.js
```
