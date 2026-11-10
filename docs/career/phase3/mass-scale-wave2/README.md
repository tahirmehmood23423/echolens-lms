# Resumed curriculum wave: 24 new validated drafts

Starting from `1b5b6f7`, this execution increased authored coverage from **24 to 48 of 132 canonical subtracks**. **84 remain**. The original 24 course fingerprints are unchanged. Both earlier quarantined packages were recovered, completed and integrated after passing their gates.

This wave adds **75 modules, 226 lessons, 1,630 formative MCQs, 2,160 comprehensive MCQs, 226 verified worked examples and 127 newly taught canonical objectives**. Current totals: 466 lessons, 3,322 formative questions and 4,320 comprehensive questions. All 48 packages await human review; none was automatically approved or published.

## Completed packages

| Canonical subtrack | Modules | Lessons | Practice | Comprehensive | Verified worked examples |
| --- | ---: | ---: | ---: | ---: | ---: |
| `practical-data-structures` | 3 | 9 | 58 | 90 | 9 |
| `fastapi-backend` | 4 | 12 | 84 | 90 | 12 |
| `db-integration-performance` | 3 | 9 | 56 | 90 | 9 |
| `backend-deployment-ops` | 3 | 9 | 60 | 90 | 9 |
| `js-fundamentals` | 4 | 12 | 96 | 90 | 12 |
| `js-dom-async` | 4 | 12 | 96 | 90 | 12 |
| `typescript-fundamentals` | 3 | 9 | 72 | 90 | 9 |
| `pandas-fundamentals` | 3 | 9 | 63 | 90 | 9 |
| `data-cleaning` | 3 | 9 | 63 | 90 | 9 |
| `prompting-structured-output` | 3 | 9 | 72 | 90 | 9 |
| `embeddings-semantic-search` | 3 | 9 | 72 | 90 | 9 |
| `vector-databases` | 3 | 9 | 75 | 90 | 9 |
| `rag-fundamentals` | 3 | 9 | 75 | 90 | 9 |
| `advanced-sql` | 3 | 9 | 72 | 90 | 9 |
| `descriptive-stats-metrics` | 3 | 9 | 63 | 90 | 9 |
| `eda` | 3 | 9 | 66 | 90 | 9 |
| `cloud-aws-foundations` | 3 | 9 | 72 | 90 | 9 |
| `cloud-networking-iam` | 3 | 9 | 72 | 90 | 9 |
| `docker-containers` | 3 | 10 | 60 | 90 | 10 |
| `ci-cd` | 3 | 9 | 61 | 90 | 9 |
| `defect-management` | 3 | 9 | 54 | 90 | 9 |
| `functional-regression-exploratory` | 3 | 9 | 54 | 90 | 9 |
| `web-api-testing` | 3 | 9 | 60 | 90 | 9 |
| `test-data-management` | 3 | 9 | 54 | 90 | 9 |

All new banks retain the existing 30-item assessment blueprint and draft metadata. There is one canonical owner per shared skill; existing student history and enrollment semantics are unchanged. Direct assessment grants knowledge evidence without marking unread lessons complete. Guided reading, lesson quizzes, module checkpoints, remediation and fresh assessment forms use the existing services.

## Validation

- Final structural/source validation: 48 courses, zero errors/warnings, 499 matching executable checks (466 worked examples plus 33 historical question snippets). Unchanged code hashes reuse prior evidence; source bytes and structure are checked again.
- Final browser suite: **454 checks passed, zero JavaScript errors**, at 320/390/768/1024/1440 widths. It covers the seven legacy baseline courses and all 24 new packages.
- Full targeted suite: **224 passed, zero failed**.
- Full application suite: **381 tests: 369 passed, 11 existing failures, one skipped**. Failure names match the retained baseline. They concern generated Prisma-client/setup gaps, Postgres-only Talent setup, demo admin/coordinator overview failures and the legal-placeholder assertion; they remain unresolved.
- Native isolated verification supports actual JavaScript, strict TypeScript, pandas and FastAPI. Pinned React server-rendering support is also tested, but its unfinished course is not counted. Optional packages are development-only, read-only inside the sandbox, with no workspace/home/credential exposure or unsandboxed fallback. Application dependencies were not changed.
- Independently reproduced DB Integration supplemental verification: **7 fresh in-memory PostgreSQL/WASM case groups, 15 passing probes** using existing PGlite 0.4.3 / PostgreSQL 17.5. This is separate from generic worked-example counts and historical Database Design evidence. No native multi-connection, race, production performance or live deployment claim is made.

One newly detected CI/CD question duplicate was replaced with a distinct promotion-decision case. The complete course-flow regression was repeated after that wording correction. One older HTTP/API Security repeated practice prompt remains flagged for SME review; the original completed packages were preserved.

Official references are checked against pinned Git objects. AWS references use separately labeled captured official HTTPS bytes, matching capture metadata and SHA-256; they are not described as immutable Git revisions. Source verification does not certify all business judgments, current public-page availability or deployed production behavior.

## Career coverage

Counts include each career's actual core and variants; shared subtracks occur in multiple rows and must not be summed as unique packages.

| Career | Starting | Authored / canonical | Incomplete | Missing prerequisite drafts | Complete draft role pathways |
| --- | ---: | ---: | ---: | --- | --- |
| frontend-web-developer | 5 | 8 / 14 | 6 | react-fundamentals | None |
| backend-developer | 10 | 17 / 18 | 1 | None | junior-backend-developer, python-fastapi-developer |
| full-stack-web-developer | 13 | 19 / 29 | 10 | react-fundamentals, node-express, fullstack-integration-state | None |
| mobile-app-developer | 3 | 4 / 18 | 14 | dart-programming, mobile-ui-fundamentals, flutter-fundamentals, mobile-apis-networking, mobile-testing-debugging, react-fundamentals | None |
| ai-machine-learning-engineer | 8 | 10 / 21 | 11 | numpy-arrays, ml-fundamentals, ml-preprocessing, supervised-learning, deep-learning, mlops-deployment | None |
| generative-ai-llm-developer | 7 | 12 / 17 | 5 | agents-tool-calling | None |
| data-analyst-business-intelligence | 5 | 10 / 15 | 5 | spreadsheet-analysis, data-visualization | None |
| data-engineer | 6 | 11 / 20 | 9 | etl-elt-architecture, data-transformation-pipelines, workflow-orchestration, cloud-data-platforms | None |
| cybersecurity-analyst | 4 | 6 / 16 | 10 | security-foundations, security-logging-monitoring, soc-siem, vulnerabilities-defense | None |
| cloud-devops-engineer | 6 | 10 / 15 | 5 | observability | None |
| software-qa-test-automation | 8 | 13 / 17 | 4 | playwright-automation, automation-frameworks | manual-qa-engineer, api-tester |
| software-engineering-dsa | 4 | 4 / 17 | 13 | complexity-analysis, recursion-backtracking, linear-structures, oop-principles | None |

Four mandatory draft pathways are complete: Junior Backend Developer, Python/FastAPI Developer, Manual QA Engineer and API Tester. These are authored pathways, not human-approved or published role certifications. Existing role-final gates remain intact.

## Junior Backend review preparation

A fresh private package contains exactly nine required subtracks: **31 modules, 99 lessons, 661 formative items, 810 comprehensive items and 99 matching verified worked examples**. It includes prerequisites, per-objective teaching/question mappings, duplication findings, technical evidence and an SME checklist. It performs no approval or publication. Start with `REVIEW-CHECKLIST.md` and `index.html` in the dedicated reviewer archive.

## Remaining work and recoverability

Parallel workers reached their execution usage limit. Three additional candidates are preserved under `career/curriculum/learning/quarantine/wave2/` and excluded from all completed totals:

- React Fundamentals: executable examples present, but 19 quality warnings remain.
- NumPy Arrays: seven question quality warnings and incomplete pinned source checkout evidence remain.
- Data Visualization: question quality warnings and two NumPy scalar-representation output mismatches remain.

A scripting helper is preserved without claiming a completed scripting course. Observability was not completed. The original two prior-wave partial snapshots remain unchanged for audit; their complete active copies are now accepted.

The additive wave manifest, exact fingerprints, full inventory, remaining-subtrack list and prerequisite-ordered next queue are saved alongside this report. The new summarizer checks current course/bank fingerprints and measured counts before writing aggregate reports; it refuses overwriting existing snapshot artifacts. No background continuation is claimed after execution ends.

Branch: `codex/career-integrity-ux`. Prior commits are preserved. New work is committed locally. **Nothing was pushed, merged, deployed or environment-published.** No production database or student records were used for tests; all fixtures are synthetic and disposable. Production override state was not inspected.

See [summary](summary.json), [career CSV](career-matrix.csv), [role matrix](job-role-matrix.json), [exact remaining inventory](remaining-subtracks.json), [checkpoint](checkpoint.json), [preserved original hashes](preserved-baseline.json) and [supplemental PostgreSQL evidence](postgres-supplemental.json).
