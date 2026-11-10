The latest [mass-scale Wave 3 report](mass-scale-wave3/README.md) records 74 authored drafts, 15 complete job-role drafts and the exact 58-subtrack continuation inventory.

# Phase 3: content engine and first two authoring batches

This is the original two-draft batch report. The [mass-scale foundation wave](mass-scale-wave1/README.md) contains the latest 24-draft inventory, 12-career matrix and exact continuation checkpoint. The [API Security batch](security-batch/README.md) contains the latest seven-draft inventory, validation and nine-subtrack completion matrix. The [Database Design batch](database-batch/README.md) contains the latest six-draft inventory and junior-role matrix. See the [REST API Design batch](rest-batch/README.md) for the latest five-draft counts and junior-role matrix. The [junior backend / HTTP batch report](backend-pathway/README.md) contains the current role matrix and latest cumulative counts. See the [subsequent SQL batch report](sql-batch/README.md) for the latest cumulative inventory and validation.

## Delivery status

Two canonical short courses are fully authored and technically tested as **drafts**:

| Draft | Modules | Written lessons | New formative MCQs | Reused comprehensive questions | Canonical objectives covered |
| --- | ---: | ---: | ---: | ---: | ---: |
| Python Fundamentals | 4 | 12 | 72 | 90 | 12 |
| Programming and Computer Science Foundations | 4 | 12 | 72 | 90 | 12 |
| Total | 8 | 24 | 144 | 180 | 24 |

There are **zero human-approved releases, zero newly published short courses, and zero complete job-role pathways**. The other 130 subtracks still need full written lesson sets and their formative quizzes/checkpoints. Across the 680 canonical objectives, 656 still need confirmed written-lesson coverage in this content pipeline. Existing notes and practice may contribute, but are not automatically counted as complete teaching.

Your acceptance requirement says: **“Required human content review has been completed.”** New material is explicitly AI-assisted and stays draft until an authorized person reviews the exact version. Automated checks and synthetic QA approvals do not satisfy that requirement. The delivered offline review packs contain the concrete lessons, examples, formative keys and existing final-bank keys to make that review possible.

## Audit and catalogue reconciliation

The fetched testing branch was `v8-test` at `a54300a`. Implementation is on `codex/career-integrity-ux`, in local commits `01bc5af` (engine and Python pilot) and `de7b5f1` (shared Programming Foundations batch). No changes from this phase have been pushed or deployed. The deployed SHA and production catalogue overrides could not be independently verified because public-site/hosting access was unavailable.

The [complete inventory](content-inventory.json) comes from actual repository course definitions and an isolated runtime store. The same inventory is available through the authenticated admin API against an application's own runtime, so deployment overrides can be reconciled later without editing records.

Reconciled, separate inventories:

- **16 public free-course listings**, containing **214 lesson records** in their associated definitions.
- The existing validator's **six Trending Tech courses** are a subset: 24 modules, 72 lectures/quizzes, 360 quiz questions, 31 coding tasks, 41 optional projects and six capstones.
- **48 total course-track definitions**, including paid/legacy definitions. A definition's `free` flag is not by itself proof of a public free listing; the inventory records those fields separately.
- **13 legacy Career banks with 970 questions**; published formats include existing single-choice, scenario, multi-select and debugging items. Those historical formats and scoring remain intact.
- **Five canonical comprehensive banks with 450 questions**. The new content maps 180 of those questions to authored lessons; the other 270 still lack a complete authored lesson set in this pipeline.
- **132 canonical subtracks, 36 roles and 680 objectives**. All module/role/prerequisite records are retained in the inventory, along with gaps, candidate resources and the prerequisite-ordered backlog.

CS-104 contains 15 real Python lesson records, not 15 complete new short courses. Their concept notes are approximately 54–102 words each, accompanied by videos/coding practice. They are useful supplements but insufficient by themselves for the requested theoretical depth. The two drafts link to **13 distinct existing CS-104 practice lessons**, preserving their identity, enrollment, pacing, grades and certificate rules. Classes/inheritance remain outside the fundamentals pilot. No old notes were overwritten or relabeled as complete new lessons.

## Reused systems and implemented engine

The implementation extends the existing `/career` router, canonical curriculum service, assessment engine, admin Career area, profile JSON and store persistence barrier. It does not create a second LMS, student account system, course enrollment system, reward system or scoring engine.

Implemented:

- Structured, versioned lessons with measurable canonical objectives, prerequisites, progressive theory sections, tables/diagrams, worked problems, executable examples, expected output, mistakes, takeaways, references and optional practice/video references.
- Public reading only after release; private admin draft preview before release. Written instruction is sufficient without watching video.
- Three-question lesson quizzes and nine-question module checkpoints. Each module has an 18-item formative pool, allowing fresh alternative forms. The existing form assembler supplies competency coverage and easy/medium/challenging items.
- Existing server-only grading, random opaque option tokens, per-attempt saved rules/questions, deadlines, late-answer handling, idempotent submission and append-only history.
- Immediate explanatory feedback for formative items. Comprehensive questions are barred from being copied into the immediate-feedback bank; formal review keeps its existing answer-key restrictions.
- Configurable 70% formative passing, all-objective evidence and key-competency thresholds. The existing comprehensive blueprint remains 30 questions, 80% overall, critical coverage, its configured difficulty/scenario mix, and existing cooldowns.
- Direct comprehensive assessment credits knowledge while leaving unread lessons unread. Short quizzes never grant comprehensive skill evidence or issue duplicate certificates/rewards.
- A failed comprehensive attempt maps missed/unassessed competencies to actual published lessons and relevant module checkpoints. New assessments started with released teaching require those remediation checkpoints where appropriate. Older attempts retain their meaning and are not retroactively rewritten.
- Reading position, explicit read acknowledgements and quiz/checkpoint progress saved in the current learner's existing profile. Completion is derived from those records, not fabricated counters.
- Content fingerprints preserve unaffected learning credit across releases. Changed reading material requires rereading; changed quiz targets need relevant fresh evidence. Prior versions, read acknowledgements, questions, rules and scores remain available in history/archive.
- Unified dashboard integration for canonical lesson counts, checkpoint progress, real resume links and remediation. Course assignment completion, lesson learning and assessed knowledge remain distinct measures.
- Account identity refreshed before private view/draft use; assessment UI caches reset on account changes. Ownership comes from authenticated identity, and queued reading saves check the expected user.

## Authoring, review and publication

In the existing admin portal: **Career Assessments → Curriculum & QA → Lessons & publishing**.

1. Select the canonical subtrack. The editor supports lesson creation, module/lesson order, code examples, tables, diagrams, references, optional videos, objectives, lesson MCQs and checkpoint pools through structured JSON.
2. Preview the written lessons. Saving creates a new draft version, archives earlier content and invalidates that draft's previous approval. An existing release remains live until a replacement is approved and published.
3. Send the draft for human review. Structural failures and missing existing-course links prevent progression.
4. Review the text, examples, all formative keys, mappings, source references and existing comprehensive bank. Inspect that bank in the existing subtrack question-bank tools; legacy AI subject-review metadata is not a new human attestation.
5. Record personal review notes and the explicit human-review checkbox. The review is bound to this exact content hash and authorized admin identity.
6. Publish the approved version. Publication revalidates content, code evidence, practice references and comprehensive availability. Unpublishing removes student lesson links without deleting attempts or old progress.

Exact code/expected-output hashes can reuse the checked-in verification artifact. Changed examples require the existing isolated verifier; there is no unsandboxed fallback. Unsupported example languages/verifiers must be added before those courses can be released. This keeps the unchanged pilot publishable on a host that lacks a build-time execution sandbox while preventing unverified edited code from being approved automatically.

The completion tracker reports actual track/subtrack counts, objectives, lesson quizzes, checkpoint pools, verified examples, comprehensive availability, approval state and missing work. See [subtrack gaps](subtrack-gaps.csv) and [next batches](NEXT-BATCHES.md).

## Source and technical verification

The public Python documentation website was blocked in this environment. Official CPython documentation was retrieved through Git and inspected at commit `42155a0feaca9ba6991942c323cbe9fb7278be3c` on the 3.13 branch. References point to real files at that pinned official revision, with recorded file hashes. Public HTML URL availability was not HTTP-verified; the human source/reference review remains required.

The examples use Python 3.11-compatible syntax. All **24 worked examples and 33 executable formative-question snippets (57 checks)** ran in the existing bubblewrap sandbox with no network, a cleared environment, isolated temporary files and CPU/memory/time limits. All matched their declared outputs. Structural validation reported **zero errors and zero warnings**. The pre-existing verification script separately passed **145 existing code questions**. These are technical checks, not a claim of human approval or proven educational effectiveness.

## UI, API and database changes

Student views remain under `/career`: `#learn/<subtrack>`, `#lesson/<subtrack>/<lesson>`, plus admin-only preview routes. They share the existing assessment screens, results/history, white/teal tokens and navigation. Reading views have collapsible mobile module navigation, accessible code/table scrolling, copy-code controls, previous/next actions, honest save status and reduced-motion support. Navigation begins at the next lesson's top rather than retaining an old page's bottom scroll position.

API additions are inside existing Career routes:

- Public released course/lesson reads: `/api/career/learning/:id` and `/lessons/:lesson`.
- Learner reading and quiz starts: `/api/career/me/learning/:id/lessons/:lesson` and `/quizzes/:kind/:target`.
- Existing `/api/career/me/st/...` APIs still own attempts, saves, scoring, results and history.
- Admin inventory/content/preview/archive/review/approval/publication: `/api/admin/career/learning/...`.

No migration or new database table was introduced. `settings.career_learning` stores drafts, releases, review records and revisions. `profile.career.st.learning` stores versioned read/position records; existing `st.attempts` stores tagged formative attempts and immutable question snapshots. Settings and user profiles already map to JSON in the persistence layer. POST/PUT responses retain the existing persistence barrier. Live Postgres mapping/integration could not be revalidated while Prisma generation is blocked; local store/API preservation tests passed.

## Validation results

| Check | Result |
| --- | --- |
| Relevant Career/learning/dashboard/free-enrollment/TLS Node tests | 157 passed, 0 failed |
| New learning browser flow | 43 checks passed |
| Existing Career/onboarding/dashboard browser flow | 118 checks passed |
| Responsive widths | 320, 390, 768, 1024, 1440; no unintended page overflow |
| Browser JavaScript errors | 0 |
| New content/code verification | 24 lessons, 144 MCQs, 57 executable checks; 0 errors/warnings |
| Existing code-question verification | 145 checked, 0 problems, 0 unexecuted |
| Existing six-course catalogue validator | Passed |
| Complete Node suite | 314 tests: 302 passed, 11 failed, 1 skipped |
| Patch whitespace checks | Passed |

The 11 full-suite failures match the established baseline: generated Prisma client unavailable in mapping/flush-related tests, a Postgres-only Talent test without an isolated Postgres URL, demo admin/coordinator overview 503s, and an outdated legal-placeholder expectation. No unrelated legal facts or tests were changed to hide them.

Browser QA uses disposable stores, synthetic accounts and **synthetic test-only publication**. It exercises both courses' beginner and direct-assessment pathways, lesson reading/quizzes, every module checkpoint, comprehensive pass/fail, targeted remediation, fresh reassessment, preserved history, cross-user access checks, the dashboard and admin authoring at five widths. The repository and ordinary application startup still contain no approved release for either new course.

Reproduction:

```sh
npm run validate:career:learning
npm run inventory:career:learning -- --output /tmp/career-inventory.json
npm run review:career:learning -- /tmp/career-review
npm run test:career:learning:browser
npm run test:career:browser
npm run validate:catalogue
DATABASE_URL= DB_PATH=/tmp/career-tests.json MAIL_DRY_RUN=true node --test --test-concurrency=2 test/career*.test.js test/student-workspace.test.js test/free-enrollment.test.js test/postgres-tls.test.js
DATABASE_URL= DB_PATH=/tmp/full-tests.json MAIL_DRY_RUN=true node --test --test-concurrency=2 test/*.test.js
```

For source regeneration, check out the pinned official CPython revision and pass `--source-root /path/to/cpython --output career/curriculum/learning/verification.json` to the content validator. The verification artifact must be generated by actually executing the checks in a supported isolated environment. It does not approve or publish content.

## Per-career content state

Shared canonical subtracks occur in more than one row; do not sum these rows as unique subtracks. “Comprehensive” means existing published assessments, not complete written teaching. “Approved” means a human-approved new lesson release.

| Career | Subtracks | Authored lessons | Lesson quizzes | Checkpoint pools | Comprehensive | Approved |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| frontend-web-developer | 14 | 12 | 12 | 4 | 2 | 0 |
| backend-developer | 18 | 24 | 24 | 8 | 5 | 0 |
| full-stack-web-developer | 29 | 24 | 24 | 8 | 5 | 0 |
| mobile-app-developer | 18 | 12 | 12 | 4 | 2 | 0 |
| ai-machine-learning-engineer | 21 | 12 | 12 | 4 | 2 | 0 |
| generative-ai-llm-developer | 17 | 12 | 12 | 4 | 3 | 0 |
| data-analyst-business-intelligence | 15 | 24 | 24 | 8 | 3 | 0 |
| data-engineer | 20 | 12 | 12 | 4 | 3 | 0 |
| cybersecurity-analyst | 16 | 0 | 0 | 0 | 0 | 0 |
| cloud-devops-engineer | 15 | 24 | 24 | 8 | 3 | 0 |
| software-qa-test-automation | 17 | 24 | 24 | 8 | 4 | 0 |
| software-engineering-dsa | 17 | 24 | 24 | 8 | 3 | 0 |

## Files, review artifacts and remaining work

Main implementation files:

- `career/curriculum/learning/`: both instructional drafts, their MCQs, validator/content/progress helpers and verification evidence.
- `career/curriculum/service.js`, `career/routes.js`, `career/service.js`: integration with the existing attempt engine, authorization, remediation and workspace.
- `public/js/career-learning.js`, `career-curriculum.js`, `career-curriculum-admin.js`, `career-ui.js`, `career.js`; `public/css/career.css`, `career/page.js`, `public/dashboard.html`: student/admin views and asset versions.
- `scripts/validate-career-learning.js`, `career-learning-inventory.js`, `build-career-learning-review.js`, and npm script entries.
- `test/career-learning.test.js`, `career-learning.browser.cjs`, and the isolated fixture extension.
- This report, the complete inventory, subtrack gap CSV and next-batch plan.

Private review HTML and evidence are under `/workspace/echolens-audit/phase3-review/` and `/workspace/echolens-audit/evidence/phase3-learning/`. **Review HTML contains instructor answer keys and must not be copied into `public/`.** The builder enforces that placement rule.

Remaining work is explicit: actual human content review; full lessons/formative banks for the other 130 subtracks; comprehensive banks for 127 subtracks that do not yet have them; additional language-specific example verifiers; complete role pathways and their final availability checks; and deployment/runtime-catalogue verification. The legacy assessment system's existing multi-select formats are preserved; new canonical lesson/module items use exactly four options and one correct key.

No student accounts, course enrollments, certificates, historical scores or reward ledgers were migrated or deleted. ShipLens, unrelated competitions, pricing and subscription behavior were untouched. No production testing, Git push or deployment occurred in this phase. After approval to push to the testing branch, use the existing deployment workflow, verify the actual runtime inventory, then perform human content review and publication separately.
