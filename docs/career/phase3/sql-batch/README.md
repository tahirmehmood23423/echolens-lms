# Phase 3 authoring batch: SQL Fundamentals

SQL Fundamentals is now a fully authored **AI-assisted draft**, not a human-approved release. The existing content engine and Python/Programming Foundations pilots are reused. No new LMS, enrollment model, scoring engine or database schema was introduced.

## Delivered content

- Four existing canonical modules, with three written lessons each: 12 lessons total.
- All nine canonical objectives covered; each of the 90 existing comprehensive questions maps to one or more draft lessons.
- 80 original formative MCQs, exactly four options and one key each, with explanations and distractor misconceptions. They are distinct from the comprehensive bank.
- Three-question lesson quizzes and nine-question checkpoints, using the existing server-side assessment service. Larger per-objective pools in the two-objective modules support alternative forms with coverage.
- Twelve executable SQL worked examples with fixture tables, expected rows, reasoning, mistakes, takeaways and pinned official references.
- Query projection, predicates, deterministic sorting/pagination, keys/relationships, NULL/three-valued logic, joins/filter placement, fan-out, grouping, entity counts, safe writes/transactions, subqueries and CASE. Complementary sections cover the existing bank's date buckets, weighted averages, conditional aggregation, safe retries, atomic stock changes and division behavior.
- Both existing learning pathways, targeted remediation, saved progress, historical attempts and mastery/read-completion distinctions tested against this course.

## Existing resources and source review

The 90-item SQL comprehensive bank is reused unchanged. Its legacy review metadata is not new human content approval. All lesson reads/quizzes/checkpoints use the current canonical course identity across roles.

The actual TT-06 course record, `tt-postgresql-internals`, was inspected. Its prerequisite explicitly requires SELECT/INSERT/UPDATE/DELETE, joins and GROUP BY, and its intended outcome is diagnosing query performance. It is an advanced follow-on resource rather than a complete beginner SQL replacement. No existing records were copied, overwritten or counted as reused foundational teaching. The previous 13 distinct CS-104 supplementary practice links remain unchanged.

Official PostgreSQL 17 documentation was inspected from `postgres/postgres`, branch `REL_17_STABLE`, pinned at `e6b2f7c2b41d6261dac15825dede55e94ca35614`. Recorded paths include `queries.sgml`, `ddl.sgml`, `dml.sgml`, `func.sgml` and `query.sgml`, with file hashes in the verification artifact. Source availability was checked through Git; public HTML links and production runtime content were not independently HTTP-verified.

The existing verifier executes SQL in an in-memory SQLite database within bubblewrap. All 12 examples use that explicitly stated engine/subset; the SQLite-only foreign-key PRAGMA is labelled. PostgreSQL-specific identity, scalar-subquery, grouping, date/time and concurrency details are distinguished in the text. Successful SQLite tests are **not** PostgreSQL integration evidence. Human review must check those version-specific statements and all reference links before release.

## Validation

| Check | Result |
| --- | --- |
| Structural validation, all three drafts | 36 lessons, 224 MCQs; zero errors/warnings |
| Isolated code/example verification, all drafts | 69 passed, including 12 new SQL examples |
| Relevant assessment/learning/dashboard/enrollment/TLS tests | 159 passed, zero failed |
| Local learning browser suite | 54 checks passed, zero JavaScript errors |
| Responsive reading/admin checks | 320, 390, 768, 1024, 1440 pixels |
| Full Node suite | 316 tests: 304 passed, 11 failed, one skipped |
| Patch whitespace and changed-script syntax checks | Passed |

The full-suite failures match the established baseline: unavailable generated Prisma client, Postgres-only Talent test without an isolated Postgres URL, demo admin/coordinator overview failures, and the legal-placeholder expectation. No baseline failures were hidden or unrelated tests removed.

SQL-specific tests exercise a failed direct assessment, real lesson recommendations, remediation gating, all 12 lesson quizzes/four checkpoints, a fresh passing final, history preservation, a separate prior-knowledge pass with zero lessons read, and hidden pregrade answer keys. Browser QA additionally completes the first SQL quiz through keyboard-accessible UI and reads the course at five widths. Disposable fixture publication is synthetic QA only; normal startup leaves SQL unpublished.

## Actual cumulative inventory

The [machine inventory](content-inventory.json) is produced from a disposable store and repository records, without loading production configuration. The [gap CSV](subtrack-gaps.csv) lists every subtrack. The original two-draft inventory remains intact in the parent folder.

- 16 public free-course listings, distinct from the six-course Trending Tech validator subset.
- 132 canonical subtracks, 36 roles, 680 objectives.
- Three structurally complete drafts: Python, Programming Foundations and SQL.
- 36 written lessons, 224 validated formative questions, 36 verified worked examples.
- 270 of the existing 450 comprehensive questions now have draft lesson mappings.
- Zero newly human-approved/published releases; zero complete approved role pathways.
- 129 subtracks still need full authored content; 647 canonical objectives still need confirmed written coverage in this pipeline. Existing resources may contribute after detailed review.
- 127 subtracks still lack a canonical comprehensive bank.

## Review and next work

Private staff HTML is generated at `/workspace/echolens-audit/phase3-sql-review/`. It includes all lessons, formative keys and comprehensive keys. **Never copy these packs to `public/`.** Admins review the exact draft in Career Assessments → Curriculum & QA → Lessons & publishing. No approval or publication has been performed.

Next authoring batches remain Git Collaboration and REST API Design, both with existing comprehensive banks, then the shared language/web foundations and the missing Junior Backend Developer prerequisites. Continue in complete reviewable subtracks; do not advertise a complete role until every required lesson/assessment/review is available.

Reproduce source verification with pinned local checkouts:

```sh
node scripts/validate-career-learning.js --source-root /path/to/cpython --source-root-postgres /path/to/postgres --output /tmp/learning-verification.json
node scripts/career-learning-inventory.js --output /tmp/content-inventory.json
node scripts/build-career-learning-review.js /tmp/private-content-review
npm run test:career:learning:browser
```

Implementation commit: `cfddbfb`, branch `codex/career-integrity-ux`, based on fetched `v8-test` at `2ad9e00`. The deployed implementation could not be verified. No push, deployment, production data changes or real student communication occurred in this batch.
