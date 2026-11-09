# API Security: complete authored draft

`api-security-auth` (Authentication, Authorization and API Security) now contains **three canonical modules, 12 original lessons, 76 formative MCQs, 90 draft comprehensive questions and 12 verified defensive worked examples**. All eight canonical objectives have teaching and assessment mappings. This is the seventh authored draft in the nine-subtrack Junior Backend Developer pathway. Human review and new lesson publication remain pending.

## Scope and initial inspection

The recovered workspace retained the completed Database Design commits `dd5a7e2` and `4918bc0`, the earlier REST batch and the unfinished API Security draft. The latest user authorized pushing previous work. After fetching and checking ancestry, the four completed REST/Database commits were pushed without rewriting history: `v8-test` advanced from `4799127` to `4918bc0`. The new security batch remains local on `codex/career-integrity-ux`; no deployment or environment publication was performed.

The canonical curriculum has three modules, rather than the suggested four: Authentication; Authorization; Web and API attacks. Each retains four lessons. The actual role remains `junior-backend-developer`, with its existing nine mandatory requirements and three optional subtracks. The separate Python/FastAPI role was not substituted. REST API Design is the security prerequisite; existing HTTP, REST and SQL explanations remain available without duplicate enrollments or changed identifiers.

## Teaching and assessment

The twelve lessons cover adaptive salted password hashing; session/refresh lifecycle; trusted token acceptance; recovery/MFA; own-resource access; scoped RBAC; tenant-aware response minimization; a payment-related design review; parameterized input and contextual output; TLS/CORS/CSRF browser boundaries; rate/resource limits; and configuration, dependencies and privacy-aware audit logs. A concluding university-portal review connects identity, object/field permissions, input/output, lifecycle, limits, diagnostics and operational behavior.

Each lesson has beginner prose, terminology, a business context, prerequisites, a worked problem with steps/output/limitations, mistakes, takeaways and pinned references. White/teal reading pages reuse the existing interface, with a distinct security-note heading, control table, trust-boundary diagram, highlighted/copyable Python and responsive module navigation. No unrelated dashboard redesign was introduced.

- Twelve lesson quizzes select three questions each. Three checkpoints select nine items each from objective-mapped pools of 24, 26 and 26. There are **76 unique formative questions**, not the sum of every delivered quiz form.
- The new comprehensive bank has **90 original, unreviewed draft items**: 18 easy, 32 medium, 31 hard and nine advanced; 63 tagged original workplace scenarios. Difficulty is an author estimate, not psychometric calibration.
- Existing 30-item forms retain the configured 20/35/35/10 difficulty mix, at least 70% scenarios, scoring/critical-evidence rules, timers and retake policy. No mandatory coding, essay or manual grading was added.
- Structural and bank validation report zero errors/warnings. Length-only guessing succeeds on 23% longest, 30% shortest and 19% second-longest choices. Automated checks cannot certify that every distractor or key is educationally sound.

The bank is excluded from historical automatic approvals. Item review/publication and exact-version human lesson approval are separate gates. Synthetic approvals exist only in disposable regression fixtures. No real student records, scores, enrollments, certificates or skill evidence were edited.

## Defensive verification and limits

All twelve worked examples execute as Python in the existing network-isolated bubblewrap verifier. They test PBKDF2 equality/salt behavior, exact session expiry/revocation, acceptance policy on already cryptographically verified token claims, recovery expiry/single use, ownership, role/tenant decisions, field projection, narrow refund requests, parameterized SQLite and HTML-text encoding, origin/CSRF policy decisions, local fixed-window limits and allowlisted synthetic logging/configuration flags.

The password fixture retains PBKDF2-HMAC-SHA256 at 600,000 iterations. Its salts and inputs are explicitly synthetic; production guidance requires appropriate random salts and maintained formats. OWASP prefers Argon2id; PBKDF2's FIPS-oriented use still requires appropriate implementation/configuration validation. Security parameters and application TLS/authentication were not weakened for tests.

These examples are bounded educational predicates, not production authentication middleware or proof of deployed security. In particular: claim-policy checks do not perform JWT signature validation; single-process reset consumption does not establish concurrent atomicity; local rate limits do not establish distributed enforcement; CORS is not authorization; HTML-text encoding is not universal sanitization; accepted refund requests are not completed provider effects; configuration flags do not inspect actual production settings. No public system received intrusive testing.

Thirteen official OWASP Cheat Sheet files are pinned to `OWASP/CheatSheetSeries` commit `121e76561a58a28790fd7fa927236eec8d63ea59`. The source validator compares local files to the pinned Git objects and records SHA-256 hashes in the repository verification artifact. Password Storage, Authentication, Session Management, Forgot Password, MFA, Authorization, Input Validation, SQL Injection Prevention, XSS Prevention, CSRF Prevention, REST Security, Secrets Management and Logging are included. This checks source identity, not public HTML availability or human educational approval. Existing pinned Python/PostgreSQL/HTTP/OpenAPI sources were also rechecked.

## Tests executed

| Check | Result |
| --- | --- |
| Prior relevant baseline | 168 passed, zero failed |
| Final seven-course structural validation | 81 lessons, 508 formative MCQs; zero errors/warnings |
| Fresh isolated example/question-code execution | 114 passed, including 12 security worked examples |
| Security comprehensive bank | 90 items; zero errors/warnings |
| Relevant Node regressions | 170 passed, zero failed |
| Final Chromium browser suite | 114 checks passed; zero JavaScript errors |
| Responsive widths | 320, 390, 768, 1024, 1440 |
| Full Node suite | 327 tests: 315 passed, 11 failed, one skipped |
| Syntax and patch whitespace | Passed |

Node tests cover canonical mappings, draft/publication gates, bank mix/scenarios, every lesson quiz and module checkpoint, failed-skill recommendations, remediation, fresh final forms and preserved history. Guided reading does not itself grant formal mastery. A direct comprehensive pass grants knowledge evidence without marking unread lessons complete. Pregrade responses retain opaque choices and exclude answer keys. Browser tests exercise all seven authored courses, including the security guided/direct routes, keyboard MCQs, mobile notes/tables/diagram and the existing admin matrix.

The full-suite failure names were compared with the retained Database Design log and match exactly. The eleven failures remain: missing generated Prisma client in mapping, flush, certificate and course checks; Postgres-only Talent tests without an isolated database; demo admin/coordinator overview failures (including the parent test); and the legal-placeholder assertion. These were not hidden or fixed as part of the curriculum batch. See [validation results](validation-results.json); raw logs are in the private reviewer bundle.

## Mandatory-path completion matrix

| Subtrack | Modules | Lessons | Practice | Comprehensive/state | Worked examples | Human review / new publication |
| --- | ---: | ---: | ---: | --- | ---: | --- |
| `programming-foundations` | 4 | 12 | 72 | 90 / published | 12 | Pending / no |
| `python-fundamentals` | 4 | 12 | 72 | 90 / published | 12 | Pending / no |
| `http-web-architecture` | 3 | 9 | 56 | 90 / draft | 9 | Pending / no |
| `rest-api-design` | 4 | 12 | 76 | 90 / published | 12 | Pending / no |
| `sql-fundamentals` | 4 | 12 | 80 | 90 / published | 12 | Pending / no |
| `database-design` | 3 | 12 | 76 | 90 / draft | 12 | Pending / no |
| `api-security-auth` | 3 | 12 | 76 | 90 / draft | 12 | Pending / no |
| `backend-testing-reliability` | 3 | 0 | 0 | 0 / planned | 0 | Not authored / no |
| `git-collaboration` | 3 | 0 | 0 | 90 / published | 0 | Not authored / no |

Thus **7/9 authored**, zero new human-approved or published lesson releases and zero complete role pathways. Totals: 25 authored modules, 81 lessons, 508 formative questions, 720 comprehensive questions across eight banks (630 mapped to authored lessons), and 81 distinct worked examples. The 114 executable checks additionally include existing question snippets; they are not 114 unique worked lessons. Existing Database Design PostgreSQL/WASM evidence remains separately labeled, with no new native concurrency claim.

Across the full 132-subtrack catalogue, 125 still need full written lesson sets and 615 of 680 objectives lack written coverage in this pipeline. The next mandatory authoring batch is **`backend-testing-reliability`**, followed by `git-collaboration`. The precise remaining lesson count is not yet specified by canonical competencies. Testing also needs a comprehensive bank; Git has an existing 90-item bank to inspect and reuse. All seven current drafts still need human review, and HTTP/Database/Security banks require review/publication.

See the [complete inventory](content-inventory.json), [machine-readable matrix](completion-matrix.json) and [CSV matrix](completion-matrix.csv). These are isolated repository snapshots, not claims about production overrides.

## Review and delivery

Implementation commit: `9a7d7e0` on `codex/career-integrity-ux`. The companion evidence commit records this report and matrix. New API Security commits have not been pushed, merged or deployed; prior completed work is confirmed pushed through `4918bc0` on `v8-test`.

Private reviewer HTML, keyed questions, validation logs, screenshots and the implementation patch are packaged under `/workspace/echolens-audit/phase3-security-review-bundle.zip`, outside publicly served assets. Review must check authentication/authorization accuracy, lifecycle assumptions, browser/TLS guidance, sensitive data handling, configuration/dependency advice, references, question keys, ambiguity, scenario duplication and provisional difficulty. Record actual item review and exact-version lesson approval in the authenticated admin workflow before publication. The bundle itself never approves content.
