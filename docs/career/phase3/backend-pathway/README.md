# Junior backend pathway: HTTP foundations batch

## Selection and repository state

The user’s “Junior Python Backend Developer” target is mapped to the existing `junior-backend-developer` role, titled **Junior Backend Developer**, whose job-description reference list includes a junior Python backend listing. The application separately defines `python-fastapi-developer`, with a larger mandatory path. Neither role was renamed or expanded. The junior role’s optional Intermediate Python/OOP, Data Structures and Deployment requirements remain optional. Its current role status is draft and its employer references are search summaries, not independently verified job specifications.

The current testing branch was fetched and inspected at `2ad9e00`. The unpushed SQL commits `cfddbfb` and `b4b1423` remain intact. The deployed SHA and production catalogue overrides could not be established from this workspace. The inventory is repository-backed and uses disposable runtime data, not production access.

Selected: **`http-web-architecture` — HTTP, Networking and Web Architecture**. It is the first unauthored mandatory prerequisite after Programming Foundations/Python and blocks REST API Design. It had neither written lessons nor a comprehensive bank. Choosing REST first would have left its own canonical prerequisite without teaching.

The [before-batch matrix](before-batch-matrix.json) records the prior three-draft state. The [current matrix](completion-matrix.json), [CSV](completion-matrix.csv) and [complete inventory](content-inventory.json) are generated from actual records.

## Mandatory completion matrix

The order comes from the existing prerequisite-aware role path. “Lessons” means authored drafts unless explicitly published. An assessment count does not imply completed teaching or human approval.

| Order | Canonical subtrack | Prerequisites | Lessons | Lesson quizzes | Checkpoints | Comprehensive items / state | Human review | Published lessons |
| ---: | --- | --- | ---: | ---: | ---: | --- | --- | --- |
| 1 | `programming-foundations` | None | 12 | 12 | 4 | 90 / published | pending | No |
| 2 | `python-fundamentals` | programming-foundations | 12 | 12 | 4 | 90 / published | pending | No |
| 3 | `http-web-architecture` | programming-foundations | 9 | 9 | 3 | 90 / draft | pending | No |
| 4 | `rest-api-design` | http-web-architecture | 0 | 0 | 0 | 90 / published | not authored | No |
| 5 | `sql-fundamentals` | None | 12 | 12 | 4 | 90 / published | pending | No |
| 6 | `database-design` | sql-fundamentals | 0 | 0 | 0 | 0 / planned | not authored | No |
| 7 | `api-security-auth` | rest-api-design | 0 | 0 | 0 | 0 / planned | not authored | No |
| 8 | `backend-testing-reliability` | python-fundamentals | 0 | 0 | 0 | 0 / planned | not authored | No |
| 9 | `git-collaboration` | programming-foundations | 0 | 0 | 0 | 90 / published | not authored | No |

Four of nine mandatory subtracks now have structurally complete lesson drafts. Five still need complete written lessons and formative banks: REST API Design, Database Design, API Security, Backend Testing and Git Collaboration. **All nine remain unreleased as new lesson courses**, and the role is not a complete approved learning pathway. Existing comprehensive availability is retained for five required subtracks; HTTP adds a sixth bank that remains draft. Database Design, API Security and Backend Testing still lack canonical comprehensive banks.

## Authored and reused material

New HTTP content:

- Three canonical modules, nine original lessons, all eight canonical objectives.
- Complete explanations, business cases, worked steps, expected outputs, mistakes, takeaways, references and next activities.
- URL components/origins, DNS and transport boundaries, HTTP/3 caveat, HTTPS trust, TLS termination, methods/statuses, headers/caching/cookies, safety/idempotency, uncertain retries, proxies/CDNs/replicas, session/token boundaries, and production request tracing.
- 56 new formative MCQs: three per lesson quiz, with larger objective pools for alternative eight-item checkpoints. Exactly four options, one key, explanations and distractor notes.
- 90 distinct new comprehensive MCQs, separate from immediate-feedback practice. Bank distribution: 18 easy, 32 medium, 31 hard, nine advanced; 63 tagged workplace scenarios. Difficulty labels are provisional author judgments for this foundation course, not psychometrically calibrated or human-approved ratings.
- Nine representative offline examples, executed using the existing isolated Python verifier. These parse synthetic URLs/messages/cookies, inspect default TLS settings and model state, replica behavior and traces. They do not make network requests, implement production authentication/deduplication or claim to verify a live protocol stack.

Existing infrastructure reused: canonical modules/competencies, form assembly, opaque answer choices, server scoring, versioned attempt rules, timers, read/progress storage, exact lesson remediation, historical results, dashboard and admin authoring. No new LMS, enrollment system, account type, schema or grading service was created. No new compulsory coding work was added.

Existing resource inspection: CS-106 has 15 HTML/CSS lessons and short concept notes, not this complete networking/HTTP curriculum. TT-05 has Go REST/connection/shutdown teaching but assumes HTTP familiarity and prior Go work. They remain candidate follow-on resources; neither was relabeled as complete beginner HTTP coverage. **No existing lessons were copied into this batch.** The previously linked 13 distinct CS-104 practice lessons remain unchanged.

## Source and assessment review status

Official HTTP Working Group published sources `rfc9110.xml`, `rfc9111.xml` and `rfc9112.xml` were inspected from `httpwg/http-core` at commit `bde37f634681bd5462568b73aa722af9c9a3ef5e`. References point to those pinned files rather than the moving latest-draft documents. Source file hashes are recorded in `career/curriculum/learning/verification.json`. HTTP semantics, caching and messaging claims were checked against those files; complete public HTML availability and deployment behavior are not claimed verified.

Both the new lesson course **and all 90 comprehensive items remain draft**. The bank has no human reviewer, no approval entry and no implicit publication. Adding it does not add it to the historical auto-approved bank list. Existing bank approval behavior is preserved. Administrators must review question keys/wording/coverage, publish the assessment through existing controls, then attest to the exact lesson version and publish that release separately. Automated structural/code checks are not human review.

A private offline review HTML includes the full teaching and both banks’ answer keys. It lives outside `public/` at `/workspace/echolens-audit/phase3-http-review/http-web-architecture-review.html`. The accompanying review bundle is staff-only and must not be uploaded to public course assets.

## Integration and completion tracking

Every role returned by the authenticated learning inventory now has a prerequisite-ordered `completion_matrix`: lessons, individual quizzes, checkpoints, comprehensive count/state, human review, publication and remaining work. The existing admin Lessons & publishing page displays the junior role’s nine required rows in a horizontally scrollable matrix. Remaining-work records now explicitly include comprehensive review/publication when an assessment is unavailable, even if its lesson draft exists.

Beginner integration tests read all HTTP lessons, pass lesson quizzes/checkpoints and then pass the same 30-item comprehensive engine. Prior-knowledge tests pass the final without marking lessons read. Failed attempts map to actual published fixture lessons, require appropriate remediation, then allow fresh assessments while retaining both results. Public/student projections never include answer keys before permitted grading feedback. New content remains unavailable on ordinary startup; synthetic approval/publication happens only inside disposable QA fixtures.

No scoring thresholds, comprehensive quotas, timing rules or old pass histories changed. A test was corrected to fail a critical competency as well as retry semantics rather than incorrectly assuming a noncritical weakness alone must block a passing learner. No passing student was retroactively forced through lessons.

## Validation

| Check | Result |
| --- | --- |
| Learning content structure, four drafts | 45 lessons, 280 formative items; zero errors/warnings |
| Isolated representative code checks, all drafts | 78 passed, including nine new HTTP examples |
| New comprehensive bank quality checks | 90 items; zero errors/warnings; length-only guess rates 25%, 34%, 19% |
| Relevant Node tests | 161 passed, zero failed |
| Local learning browser suite | 67 checks passed, zero JavaScript errors |
| Responsive lesson/admin checks | 320, 390, 768, 1024, 1440 pixels |
| Full Node suite | 318 tests: 306 passed, 11 failed, one skipped |
| Changed script syntax and patch whitespace | Passed |

The 11 full-suite failures match the previous baseline: missing generated Prisma client in mapping/flush/certificate/course tests; Postgres-only Talent test without an isolated database; demo admin/coordinator overview failures; and the legal-placeholder assertion. They remain unresolved and were not hidden by removing tests or changing unrelated owner/legal facts. The final remaining-work matrix adjustment was followed by the 161-test targeted rerun; the browser/full runs cover the same implementation before that additional inventory wording/assertion.

Browser evidence includes genuine reading and first-quiz keyboard interaction, complete checkpoints/final, direct prior-knowledge assessment, role-matrix rendering, screen-width checks and mobile screenshots. It uses synthetic accounts, temporary stores and blocked external resources. No production accounts, email, destructive migrations or external intrusive testing were used.

## Actual cumulative counts and next gap

- 132 canonical subtracks, 680 objectives; 16 public free listings versus the separate six-course validator subset.
- Four authored drafts, 15 modules, 45 lessons/lesson quizzes, 15 module checkpoint pools.
- 280 validated formative questions, 45 verified worked examples, 78 executed example/code checks including existing question snippets.
- Six canonical comprehensive banks / 540 questions, including the new **draft** 90. Five existing comprehensive banks remain published by their prior metadata; HTTP is not one of them.
- 360 comprehensive questions have draft teaching mappings; this includes HTTP’s unpublished bank and does not mean 360 newly reviewed items.
- Zero new human-approved releases, zero newly published courses, zero complete approved role pathways.
- 128 subtracks still need full written content, covering 639 remaining objectives in this content pipeline. 126 subtracks have no canonical comprehensive bank; 127 have no published canonical assessment.

**Next required batch: `rest-api-design`.** Its 90-item comprehensive bank already exists; its new written course should build on these HTTP foundations, then be reviewed together with its prerequisite before release. Follow with Database Design → API Security as prerequisite-ready, Backend Testing, and Git Collaboration. Preserve the optional/specialist role distinction rather than silently expanding this junior pathway.

Reproduce with the existing scripts and pinned source checkouts:

```sh
node scripts/validate-career-learning.js --source-root /path/to/cpython --source-root-postgres /path/to/postgres --source-root-http /path/to/http-core --output /tmp/content-verification.json
node scripts/career-learning-inventory.js --output /tmp/content-inventory.json
node scripts/build-career-learning-review.js /tmp/private-review
npm run test:career:learning:browser
DATABASE_URL= DB_PATH=/tmp/career-tests.json MAIL_DRY_RUN=true node --test --test-concurrency=2 test/career*.test.js test/student-workspace.test.js test/free-enrollment.test.js test/postgres-tls.test.js
```

Implementation commit: `cb1c483`, branch `codex/career-integrity-ux`. Existing unpushed SQL commits are preserved. **Nothing from this batch has been pushed or deployed.** No student data, certificates, enrollments, rewards, historical scores, ShipLens or other competition behavior was migrated or deleted.
