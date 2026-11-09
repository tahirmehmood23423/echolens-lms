# REST API Design: complete authored draft batch

## Outcome and repository baseline

`rest-api-design` now has **four canonical modules, 12 original lessons, 76 new formative MCQs and 12 verified offline worked examples**. It uses the existing comprehensive bank, scoring engine, lesson UI, authoring workflow, progress model and remediation service. The course is an AI-assisted draft; no new human approval or publication occurred.

The fetched `v8-test` branch and local history both contained HTTP commits `cb1c483` / `4799127`. Unlike the pasted brief’s older status statement, those commits and the SQL batch had already been pushed before this batch. Deployment success is still unverified; no Render credentials/deploy hook were available in the previous session. This batch starts from `4799127` and introduces local implementation commit `199f362` on `codex/career-integrity-ux`.

The actual junior role remains `junior-backend-developer` (Junior Backend Developer), with nine mandatory subtracks. The separate `python-fastapi-developer` role and junior optional Intermediate Python, Data Structures and Deployment requirements are unchanged. Employer-reference verification remains a separate open issue in the existing role metadata.

## Canonical course and objectives

The proposed 20-lesson outline was reconciled with the existing four-module, ten-objective structure rather than replacing it. Three focused lessons per module cover:

| Canonical module | Lessons | Objective coverage |
| --- | --- | --- |
| Resource design | Business resource contracts; bounded search/pagination; consistent private errors | URLs/methods/representations; filters/sort/pagination; errors |
| Validation and contracts | Syntax/shape/meaning/permissions; money/dates/fetch boundaries; OpenAPI/versioning | Input validation and correct rejection; documented compatible contracts |
| Reliability | Durable logical-operation identity; deadlines/rate limits; caching/concurrency | Idempotency keys; bounded retries/capacity; validators/cache policy |
| Integrating third-party APIs | Webhook provenance/ordering; partial failures/compensation; credentials and final contract review | Partial failures/webhooks; secrets and API-key handling |

Each lesson includes measurable canonical objectives, prerequisites, progressive theory, realistic original business requirements, a step-by-step technical example and expected output, common mistakes, takeaways, references and a three-item knowledge check. Examples span orders, enrollment, products, appointments, payments, tracking, subscriptions/partner access and support diagnostics. Framework implementation, SQL internals and advanced deployment remain outside this course.

HTTP Foundations is linked as the canonical prerequisite. Its definitions are applied to business choices instead of being copied as another introductory HTTP course. REST architectural constraints and hypermedia are distinguished from merely using noun-shaped URLs.

## Content reuse and questions

No existing lesson was copied, overwritten or relabelled as a new REST lesson. The actual TT-05 Go backend records include REST/HTTP implementation practice but assume prior Go/HTTP knowledge and short concept notes; they are not a complete substitute for this design course. All existing course identities, optional practice references, enrollments and certificate rules are preserved.

New formative bank:

- 76 distinct four-option, single-key items with explanations, distractor misconceptions and exact objective mappings.
- 36 primary lesson-quiz items (three per lesson).
- Four eight-item checkpoint forms, assembled from objective-covered pools of 18, 20, 18 and 20 items. These pools include the lesson items plus 40 additional questions; they are **76 unique items, not 112 newly authored questions**.
- The two-objective modules have additional alternatives so two covered checkpoint forms can be assembled.
- No comprehensive items were copied into immediate-feedback practice.

**Comprehensive bank: 90 existing questions reused; zero new comprehensive questions authored.** That bank was already available before this batch. Its stored publication state and historical behavior were retained rather than manufacturing a second bank or unpublishing an existing assessment.

The configurable 30-question form blueprint remains 20/35/35/10 percent easy/medium/hard/advanced and at least 70% scenario items, with the existing 80% overall and competency requirements. Tests assert the actual form quotas. The legacy pool itself has **20 easy, 30 medium, 30 hard and ten advanced items**, and all 90 carry scenario metadata. Thus its pool is not an exact 20/35/35/10 distribution, and a form drawn from an all-scenario pool can exceed the configured 70% minimum. Those existing annotations were not silently rewritten or represented as newly calibrated/human-reviewed. Human review should reassess the pool’s difficulty/scenario labels as part of content acceptance.

## Verified examples and narrow UI support

Twelve substantial offline fixtures verify resource-state/authorization decisions, deterministic product continuation, a public error projection, validation/overposting, exact decimal parsing, a minimal OpenAPI operation, sequential replay/payload conflict, retry budgeting, conditional edits, duplicate/out-of-order events, pending compensation and safe diagnostic projection.

Eight pretty-printed JSON blocks and one HTTP wire-request block supplement those fixtures. The HTTP example uses CRLF separation and a checked UTF-8 Content-Length. Every JSON block is syntax-validated. The existing student lesson component now renders these blocks through its escaped syntax highlighter and offers per-example copy actions. The private review renderer includes the same blocks. Unsupported snippet languages, malformed JSON and oversized/empty snippets fail content validation; public projection exposes only allowed `lang` and `code` fields.

The worked examples use the existing bubblewrap Python verifier, with no network and no external credentials. Their outputs passed. They **do not** prove a concurrent/durable payment implementation, actual provider authentication, production cache behavior, a live protocol exchange or full OpenAPI conformance. Those limitations are stated beside the examples. The minimal OpenAPI fixture checks selected structural rules; a generic JSON parser is not presented as a full OpenAPI/JSON Schema validator.

Pinned authoritative sources:

- HTTP Working Group `httpwg/http-core`, commit `bde37f634681bd5462568b73aa722af9c9a3ef5e`: published RFC 9110/9111 source files.
- Official `OAI/OpenAPI-Specification` tag 3.1.1, commit `69d8b7953c3259e243cf746388a0951b89649763`: `versions/3.1.1.md`.

OpenAPI 3.1.1 is explicitly version-pinned, not claimed to be the latest specification. The validator now groups references by repository, verifies every selected checkout commit and compares the local reference bytes with the pinned Git object before recording hashes. Source availability was checked through Git; public HTML URL availability and production records were not independently verified. Human source/reference review remains required.

## Integration, data and review status

Both pathways use the existing attempt service:

- Guided learning: all 12 readings/individual quizzes, four checkpoints and final assessment pass while keeping formative progress separate from comprehensive evidence.
- Prior knowledge: direct final pass credits knowledge with zero personally read/completed lessons.
- Failed assessment: missed resource/idempotency competencies recommend real fixture lessons; required remediation blocks reassessment until addressed; fresh forms retain both previous and current history.
- Opaque options, server grading, saved rules, timers, ownership, historical scores and restricted pregrade keys remain unchanged.

The admin mandatory-path matrix now includes modules, practice-question totals, verified-example counts and structural-validation state. These are actual runtime/repository values. “Structure passed” is not a claim of human review or an invented per-row test result. The exported matrix adds explicitly scoped current-suite evidence for the five courses actually exercised by guided/direct browser and integration tests.

New lesson content stays draft. The **existing** REST assessment remains in its prior published state; its legacy AI review metadata is not new human approval. A reviewer must check the complete text, examples, all 76 practice keys, all 90 comprehensive keys, competency mappings, source links, difficulty labels and compatibility claims before attesting to the exact new lesson version. No synthetic test attestation persists outside disposable QA stores.

No database migration/table, duplicate course, account, progress record or grading system was introduced. Existing JSON settings/profile paths and the persistence barrier are reused. ShipLens, competitions, pricing, certificates and rewards were untouched.

## Actual nine-subtrack matrix

“Lessons” and “examples” below count authored/verified drafts. Every lesson has a primary quiz. All new lesson releases remain unpublished; the role is not a complete approved pathway.

| Order | Subtrack | Modules | Lessons | Practice MCQs | Checkpoints | Comprehensive / state | Verified examples | Human review | New lessons published |
| ---: | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- |
| 1 | `programming-foundations` | 4 | 12 | 72 | 4 | 90 / published | 12 | pending | No |
| 2 | `python-fundamentals` | 4 | 12 | 72 | 4 | 90 / published | 12 | pending | No |
| 3 | `http-web-architecture` | 3 | 9 | 56 | 3 | 90 / draft | 9 | pending | No |
| 4 | `rest-api-design` | 4 | 12 | 76 | 4 | 90 / published | 12 | pending | No |
| 5 | `sql-fundamentals` | 4 | 12 | 80 | 4 | 90 / published | 12 | pending | No |
| 6 | `database-design` | 3 | 0 | 0 | 0 | 0 / planned | 0 | not authored | No |
| 7 | `api-security-auth` | 3 | 0 | 0 | 0 | 0 / planned | 0 | not authored | No |
| 8 | `backend-testing-reliability` | 3 | 0 | 0 | 0 | 0 / planned | 0 | not authored | No |
| 9 | `git-collaboration` | 3 | 0 | 0 | 0 | 90 / published | 0 | not authored | No |

Machine-readable details, prerequisites, validation errors and remaining work: [matrix JSON](completion-matrix.json), [CSV](completion-matrix.csv), [full inventory](content-inventory.json).

Current cumulative totals: five structurally complete authored drafts, 19 modules, 57 lessons/individual quizzes, 19 checkpoint pools, 356 formative items and 57 verified worked examples. Across all courses, 90 executable example/question snippets passed. Six comprehensive banks still contain 540 questions; 450 have draft teaching mappings, including the unpublished HTTP bank’s mappings. Five existing comprehensive banks remain published; HTTP is still a draft bank. There are zero newly human-approved lesson releases and zero complete approved role pathways.

127 subtracks still need full written teaching, covering 629 remaining canonical objectives in this content pipeline. Existing resource candidates may contribute after detailed review; these figures do not declare those resources absent. The actual catalogue still has 16 public free listings, distinct from the six-course Trending Tech validator subset.

## Tests executed

| Check | Result |
| --- | --- |
| Learning structure/content validator | Five drafts, 57 lessons, 356 formative MCQs; zero errors/warnings |
| Isolated code/example outputs | 90 passed overall, including 12 new REST examples |
| Existing REST comprehensive bank quality check | 90 items; zero errors/warnings; unchanged pool annotations |
| Relevant Node tests | 164 passed, zero failed |
| Final local learning browser suite | 83 checks passed, zero JavaScript errors |
| Responsive learner/admin widths | 320, 390, 768, 1024, 1440 |
| Full Node suite | 321 tests: 309 passed, 11 failed, one skipped |
| Syntax and patch-whitespace checks | Passed |

New tests cover draft status, existing bank reuse, all objective mappings, three-item lesson forms, eight-item checkpoint forms, JSON validation, HTTP byte framing, restricted snippet projection, unchanged form quotas, targeted lessons, direct/learned distinction, fresh questions/history and the expanded role matrix. Browser QA verifies highlighted wire/JSON blocks and the copy action using a controlled clipboard boundary, plus the complete new learning/final/direct flows at mobile/desktop widths. The application handles unavailable real clipboard permission with a select-and-copy fallback.

The 11 full-suite failures match the documented baseline: missing generated Prisma client in mapping/flush/certificate/course tests, Postgres-only Talent test without an isolated database, demo admin/coordinator overview failures, and the legal-placeholder assertion. No new regression failures appeared. The relevant 164-test run preceded the additional HTTP-byte assertion; that assertion passed in the full run. Final screenshot-only settling changes were verified by the last 83-check browser run.

All tests use temporary stores and synthetic identities. Test-only publication does not publish repository drafts or production content. No production API probing, real mail, destructive database operations or actual provider calls occurred.

## Next gap, commits and delivery

Five of nine mandatory subtracks now have authored drafts. The remaining four are:

1. **`database-design` — next batch**, building on the authored SQL Fundamentals prerequisite; it also needs a canonical comprehensive bank.
2. `api-security-auth`, building on authored REST API Design; it needs a comprehensive bank.
3. `backend-testing-reliability`, building on Python; it needs a comprehensive bank.
4. `git-collaboration`, whose existing 90-item comprehensive bank can be reused.

All previously authored drafts still need human review/publication. The junior pathway and role-final availability must not be advertised as complete before every required component is actually available and accepted.

Implementation: `199f362`, branch `codex/career-integrity-ux`. This batch has **not been pushed, merged or deployed**. The previously pushed baseline is `4799127`; its deployment remains unverified.

Private reviewer HTML lives at `/workspace/echolens-audit/phase3-rest-review/`; the reviewer bundle includes teaching, keys, reports, patch, logs and responsive evidence. **It contains answer keys and must stay outside public assets.** The builder refuses output under `public/`.

Reproduction with pinned checkouts:

```sh
node scripts/validate-career-learning.js --source-root /path/to/cpython --source-root-postgres /path/to/postgres --source-root-http /path/to/http-core --source-root-openapi /path/to/openapi --output /tmp/verification.json
node scripts/career-learning-inventory.js --output /tmp/inventory.json
node scripts/build-career-learning-review.js /tmp/private-review
npm run test:career:learning:browser
DATABASE_URL= DB_PATH=/tmp/career-tests.json MAIL_DRY_RUN=true node --test --test-concurrency=2 test/career*.test.js test/student-workspace.test.js test/free-enrollment.test.js test/postgres-tls.test.js
```
