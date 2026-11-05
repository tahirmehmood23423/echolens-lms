# Student onboarding and unified dashboard implementation

## Starting point and gap analysis

The latest fetched `v8-test` revision was `947baa4` (verified Supabase TLS trust). Work builds on that revision on `codex/career-integrity-ux`. The selected original `main` revision predates the assessment-integrity and Career UX changes, so it was not used as the implementation baseline. The deployed revision could not be independently verified: access to the public site and hosting control plane was unavailable. No production requests or database mutations were used for testing.

Existing working systems reused:

- Twelve published career tracks, 36 roles, 132 subtracks, transparent recommendations, and public career exploration.
- Five optional Discovery questions, the signed 12-question formative quiz, server grading, and guest-result claiming.
- Existing profile JSON, career enrollment state, one primary and up to two secondary active roadmaps, skill evidence, and append-only assessment history.
- Existing free-course enrollments, course pacing and completion requirements, cohort quests, certificates, gems, stages, and badges.
- Existing `/career` router, course workspaces, account/profile editor, error/skeleton components, accessible dialogs, and white/teal styles.

Incomplete or missing before this change:

- Signup and login primarily led to separate course portals; Discovery did not lead naturally through role selection into one learning dashboard.
- The fifth question asked about enjoyment rather than study commitment; AI/ML tools and Other were missing from technology preferences.
- Browser drafts were shared across accounts, and hash navigation could retain a previous signed-in identity.
- A single target role could remain attached to the wrong primary career; selecting a role in an already-followed career needed integration with enrollment controls.
- Course activity recorded a course opening, but not its current lesson/task. Career workspace lacked a combined course/resume/reward/history projection.

## Implemented experience

New learners reach the existing Discovery welcome with the requested headline, supporting copy, benefits, and primary/secondary actions. Skipping opens a useful dashboard. Returning learners with course enrollments, submissions, career activity, or a dismissed welcome go directly to their dashboard. Public visitors can explore without signing in. Explicit course/portal return destinations remain supported.

The existing five screens now ask experience, technology exposure, interests, goals, and weekly commitment. Each choice saves immediately, with account-scoped local recovery, sequential server saves, visible pending-sync status, and reload recovery. Empty selections can clear prior answers. Historical enjoyment and programming-problem preferences remain readable and usable; stored assessment evidence is not rewritten. Preferences remain editable from the dashboard. Where a bounded weekly budget and subtrack outline hours exist, the UI offers a clearly labeled planning estimate, never a proficiency score or access restriction.

The formative quiz still uses its existing server engine and signed choices/results. It remains optional, with no negative marking and clear explanation that its score covers answered questions. All twelve careers remain selectable. Choosing a recommendation or another career opens its roles/subtracks; saving a role connects that career to the primary roadmap and provides a dashboard link.

`/career#me` is the unified learner dashboard. Default learner login and unqualified student portal entry reach this existing screen. Explicit course, task, profile, staff, and other portal views retain their routes. It shows:

1. First-name greeting, primary career, target role, and a rule-based next action with its reason.
2. Continue Learning using a real unfinished free-course task, an unfinished cohort quest, or an active saved assessment.
3. Primary roadmap, target requirements, next subtrack, existing coursework detail, and enrollment controls.
4. Separate free-course task completion, per-competency knowledge evidence, and role knowledge requirements. Unassessed skills have no fabricated zero scores.
5. Strong/weak knowledge, latest assessment, critical gaps, detailed analysis link, free-course progress/certificates, and existing cohort courses.
6. Required subtrack checklist with explicit published/preparation labels, secondary/paused/archived roadmaps, and the existing active limit.
7. Existing gems/stages/badges and combined learning activity. The combined feed displays the latest 100 activities; complete assessment history remains below it and full course attempts remain in course/profile views. Expired enrollment history remains visible without restoring access.
8. Direct links to account settings, learning preferences, learning history, and the existing course portal.

Next-action rules use career selection, role selection, active assessment, assessment evidence, required skill gaps with real resources, foundational prerequisites, unfinished lessons, and the next subtrack. Unpublished assessments link to their honest preparation/outline screen. No lesson content or quiz banks were invented. Modules with tasks but no video link to the existing practice view instead of a nonfunctional video route.

## Backend, ownership and persistence

A read-only `GET /api/career/me/workspace` projection was added inside the existing Career service/routes. It composes existing store methods rather than creating a model, service, course dashboard, reward system, or alternate scoring engine. It returns summarized learner data, not raw submissions, answer keys, active choice mappings, or complete private profiles. Authenticated identity determines ownership; supplied user IDs cannot select another learner.

Hash navigation refreshes authenticated identity before reading drafts. Discovery browser storage is scoped to the account, with migration of unclaimed anonymous drafts. Queued preference saves and guest claims include the expected account ID; a changed account receives a conflict response rather than another learner's draft.

Optional additions to existing JSON fields:

- `profile.career.target_roles`: remembered target role per career, while retaining `target_role` compatibility.
- `profile.career.role_history`: role changes; primary career history is no longer truncated to twenty changes.
- `profile.career.discovery.answers.commitment` plus the new technology options.
- `profile.free_course_enrollments[].last_lesson`: validated level/task pointer, recorded through the existing activity endpoint with its existing persistence barrier.

Resume checks the course engine's authoritative `requirements[].passed` results and module locks. Pending seats offer enrollment status rather than an inaccessible lesson. It does not alter scores, enrollment policy, certificates, or rewards. No database tables, migrations, production data edits, or destructive operations were required. Existing JSON/JSONB profile mapping carries these additive fields.

Assessment choice randomization, server-only validation, timer expiry behavior, immutable grading rules, sandboxed verification, shared-skill reuse, and verified Postgres TLS configuration were preserved.

## UI and files

The dashboard reuses Career tokens and components, with responsive course lists, compact checklist rows, clear measure descriptions, reduced-motion support, and keyboard-operable native controls. Loading/error/retry states use the existing router components. Asset query versions were updated to avoid stale clients.

| Area | Files |
| --- | --- |
| Discovery definitions, profile/role integration and workspace | `career/discovery.js`, `career/service.js`, `career/curriculum/service.js`, `career/routes.js` |
| Welcome, dashboard, role/course routing and styles | `public/js/career-discovery.js`, `public/js/career-ui.js`, `public/js/career.js`, `public/css/career.css`, `career/page.js` |
| Auth and existing course/portal integration | `server.js`, `store.js`, `public/js/open.js`, `public/js/login.js`, `public/js/dashboard.js`, `public/open.html`, `public/login.html`, `public/dashboard.html` |
| Regression coverage | `test/student-workspace.test.js`, `test/career-discovery.test.js`, `test/career-ui.browser.cjs`, `test/fixtures/certificate-server.cjs` |

## Validation

All tests run locally with disposable JSON stores, synthetic accounts and uploads, no external database, outbound mail or AI requests. The browser fixture simulates DNS only for its synthetic signup address and exercises the actual registration/login handlers and UI. Chromium blocks external page resources.

Reproducible commands:

```sh
DATABASE_URL= DB_PATH=/tmp/echolens-workspace-tests.json MAIL_DRY_RUN=true node --test --test-concurrency=2 test/career*.test.js test/student-workspace.test.js test/free-enrollment.test.js test/free-course-reminders-api.test.js test/postgres-tls.test.js
npm run test:career:browser
npm run validate:catalogue
DATABASE_URL= DB_PATH=/tmp/echolens-full-tests.json MAIL_DRY_RUN=true node --test --test-concurrency=2 test/*.test.js
```

Final measured results:

| Check | Result |
| --- | --- |
| Targeted Career, workspace, free-course and TLS tests | 130 passed, 0 failed |
| Full existing Node suite | 286 tests: 274 passed, 11 failed, 1 skipped |
| Chromium functional/accessibility/responsive assertions | 118 passed, 0 failed; no browser JavaScript errors |
| Responsive widths | 320, 390, 768, 1024, 1440; no unintended horizontal overflow |
| Catalogue structure | Passed: 6 courses, 24 modules, 72 quizzes, 31 coding tasks, 41 optional projects, 6 capstones |
| Patch whitespace | `git diff --check` passed |

The browser run also verifies moving from one task to another and back updates the resume pointer; throttling only suppresses repeated opens of the same current activity. Nineteen new workspace regression tests cover the backend integrations and preservation rules. The full-suite failures remain the previously documented baseline issues below. Evidence is in `/workspace/echolens-audit/evidence/unified-dashboard/`, including dashboard screenshots at 320, 390, 768, 1024 and 1440 pixels, welcome/quiz/results/admin screenshots, `results.json`, and local server logs. Final test logs are copied there as `targeted-tests.log`, `full-suite.log`, `browser-run.log`, and `catalogue.log`. These are synthetic QA records.

Coverage includes beginner registration, optional quiz take/skip, persisted welcome dismissal, preference edit/reload/offline recovery, manual career override, role selection, three roadmaps and primary switching, active-limit atomic rejection, actual lesson/task resume, pending and expired seats, real weak-skill resources, absent evidence, preparation notices, account switching and queued-save isolation, no answer-key exposure, keyboard assessment interaction, failed reads/writes and retry, reduced motion, and five responsive widths.

## Remaining issues and deployment

- Five canonical subtrack banks are published; most of the 132 subtracks still require reviewed lesson content and/or question banks. No complete role final is available under the shipped default content inventory. Preparation notices remain intentional.
- The combined feed is limited to the latest 100 activities; detailed assessment and course histories retain their existing complete records.
- Cohort courses without installed quest progress show a portal link rather than an invented completion percentage. Existing grades/certificates remain in that portal.
- Live Google OAuth, SMTP delivery, public video availability, production Postgres connectivity, and the deployed SHA were not exercised. Local auth/signup and verified TLS regression tests cover their isolated application paths.
- The full-suite baseline includes missing generated Prisma-client failures (generation's binary host is blocked in this environment), a Postgres-only Talent test without a scratch Postgres URL, existing demo admin/coordinator overview 503s, and an outdated legal-placeholder assertion. These are reported, not hidden by changing unrelated tests or owner-provided legal facts.
- No ShipLens/competition, pricing, marketing, or subscription behavior was changed.

Changes are committed locally for review. Nothing from this task has been pushed or deployed. On the approved testing branch, deploy with the existing install/build/start process; no schema migration is needed. After deployment, verify fresh signup, returning login, course deep links, account settings, primary switching, certificate access, and a published checkpoint. Keep certificate verification enabled; do not set `NODE_TLS_REJECT_UNAUTHORIZED=0` or weaken the existing Postgres TLS fix.
