# EchoLens complete product QA, UI/UX and workflow audit

**Audit date:** 9 September 2026 · **Target:** current local working tree · **Decision:** further fixes and staged regression required

EchoLens has working local segments for course discovery, sign-in, nonempty profile saves, browser web-code execution, submission persistence, manual teacher grading/feedback, quizzes, event registration/submission/deadlines, feedback moderation, staff communication, and public verification/document rendering. It is not ready for a blanket workflow or release sign-off: unrelated signed-in users can retrieve private course files; the advertised bundle is priced at zero and cannot enroll; tasks lose drafts; certificate/quiz/award permissions and completion rules are inconsistent; legacy challenge and team rewards can duplicate; and failed email/grading/data requests can produce false success or a dead end.

The audit records **20 confirmed defects**, **9 usability concerns**, **6 proposed enhancements**, and **96 workflow assessments**. A confirmed defect means it was reproduced locally or demonstrated by an isolated business-rule/source comparison; it does not assert a production incident.

Open the [searchable report](audit-report.html) to filter issues and workflows. Download the [workflow matrix](workflow-matrix.csv), [broken-workflow register](broken-workflows.csv), [UI/UX findings](ui-ux-findings.csv), and [prioritized backlog](redesign-backlog.csv).

## Fix order

| Order | Issue IDs | Outcome required |
| --- | --- | --- |
| 1 | D-01 | Close private-file access before exposing further uploads. |
| 2 | D-17 | Fix or withdraw actionable bundle enrollment until price and component placement work. |
| 3 | D-02,D-06,D-11,D-12 | Revoke sessions after recovery and enforce recipient/batch permissions on certificates, awards and quizzes. |
| 4 | D-05,D-04 | Protect drafts and preserve destinations through refresh and sign-in. |
| 5 | D-18,D-16 | Unify completion policy and make grading failures durable/retryable without erasing prior results. |
| 6 | D-08,D-07 | Make email/data error states truthful, recoverable and visible. |
| 7 | D-09,D-10,D-13,D-14,D-15,D-19,D-20,U-01 | Fix registration validation/deduplication, catalogue modes, role navigation, campaign copy, reward duplication and modal keyboard focus. |

## Scope and evidence limits

- Tested on **9 September 2026**, using **Node 24.15.0**, cached Playwright and **Chrome 152.0.7977.84** on Windows. Viewports: **1440×1000 desktop** and **390×844 with touch/mobile emulation**, locale en-GB, time zone Asia/Karachi.
- Used the current working tree, including the user's existing uncommitted edits. No product-source fixes were applied. [Source fingerprints](source-fingerprints.json) identify the reviewed versions.
- Dedicated local server: **http://127.0.0.1:4318**, with synthetic accounts for all 11 stored roles and an additional empty student. Data/uploads/backups stayed in ignored **qa-audit/runtime/**. The harness disables .env loading and removes database, email, AI, OAuth, video and R2 credentials. Only reserved/synthetic identities were used.
- **No production record, payment, invitation, email, certificate or student publication was created or altered.** Payment clearance and certificates in evidence are explicitly local synthetic records. PDF contracts were rendered offline; their legal content/signing workflow was not assessed.
- Browser network rules allowed the local server plus read-only font/runtime CDN requests. Other external requests were blocked. Email and AI were disabled, not mocked as successful. Request abort, a 1800ms submission delay, cookie removal and assignments HTTP 503 were deliberate local simulations. Paid events/hackathons used visibly synthetic proof/reference data and local manual approval; no payment was processed.
- Inventory: **376 route/middleware declarations**, including 11 routes nested under /api/showcase and one optional load-test diagnostic. These are declarations, not 376 proven workflows. **47 dashboard views** were found: 43 distinct navigation views were surveyed, with course/task and populated Job detail visited separately (46 of 47 views); AI Copilot was not exercised.
- **39 catalogue-detail links returned HTTP 200**. Catalogue snapshot: 39 offers, 10 free. Track API: 42 definitions; definitions outside the current catalogue are not proof of discoverability. Every advertised course's full content and certification was not completed.
- PostgreSQL was unavailable locally, and Docker's engine was not running. No designated sandbox credentials were available for external services. Talent persistence/search/contact tests, real email verification/delivery, AI grading, R2 publishing, live calls, and real payment handling remain blocked or partial.
- **Five existing unit tests passed**: certificate-field serialization and gem totals. [Unit results](evidence/unit-results.txt). The PostgreSQL integration suite was not run.
- Accessibility review covered basic labels, focus, modal behavior, touch-box observations and layouts. No screen-reader, full contrast, physical mobile, alternate-browser or formal compliance audit was performed. No formal performance/load result is claimed. Full-page screenshots may place a fixed header at the current capture scroll position; that alone was not treated as a layout defect.
- Raw-run corrections: initial staff/ambassador survey lacked linked synthetic role records; those fixture issues were corrected and are **not product defects**. Initial same-document hash navigation was rerun as fresh documents in browser-survey-public.json. Initial quiz question key, recruiter request-info key, student grading API and web-output selector were harness mistakes; corrected operations-checks.json, final-api-checks.json and browser-workflows.json supersede those attempts. The initial mobile Jobs attempt omitted opening the drawer; coverage-browser-final.json supersedes it and the subsequent setup/wait-selector corrections. Do not count every raw FAIL as a product defect.

## Coverage summary

| Outcome | Workflow count | Meaning |
| --- | --- | --- |
| PASS | 20 | Named outcome verified within its explicitly limited local scope. |
| FAIL | 24 | Observed failing transition or state. |
| PARTIAL | 35 | Some segments/variants tested; complete outcome not established. |
| BLOCKED | 16 | Specific environment/integration prerequisite unavailable. |
| NOT TESTED | 1 | Identified work that was not executed. |

Counts describe the defined workflow rows and must not be treated as a product success rate. Local API-only checks and simulated payment/delivery states do not certify complete production journeys. The [full matrix](workflow-matrix.md) includes role, preconditions, entry, steps, expected/actual, status, evidence and linked issues for every row.

## Product sitemap

```text
Public discovery
  /                     Landing, FAQ, newsletter, featured offers
  /courses              Server-rendered catalogue
  /courses/:slug        Course detail → open learning / registration
  /open                 Live/free catalogue and language families
    #free               Free course → curriculum → video/task workspace
    #events             Events/webinars/competitions/quests → registration → submission
    #announcements      Public announcements
    #feedback           Public feedback → moderation
    #register[-CODE]    Admissions registration; PATH bundle is a separate broken case
    #signup / #profile  Free account gate / signed-in profile and password
  /compiler             Standalone multi-language project editor
Account / records
  /login → /dashboard or /open; /reset-password; /auth/google[/callback]
  /privacy; /u/:reg (legacy public profile)
  /cert?s= /verify?s=   Public certificate validation and share image
  /challan?s=          Public fee-challan validation
Role portal — /dashboard (mostly in-page views)
  Student: overview, courses/tasks, assignments, quizzes, progress, certificates,
           talent profile/hiring interest, calendar, messages, resources, jobs
  Teacher: assigned courses/students, grades, attendance, analytics, /grade?sid=
  Admin/coordinator: users, courses/batches, teachers, students, enrollments,
                     reports, finance, announcements, feedback, logs, email leads
  HR: staff/instructors/ambassadors, onboarding/contracts, departments, reports
  Admissions: registrations → challan → Finance → batch enrollment; discounts/bank
  Finance: manual clearance, expenses, balance sheet
  Staff/department members: instructions, follow-ups, assigned tasks
  Ambassador: code/QR, duties, referrals/rewards, leaderboard, reports/contracts
  Recruiter: review status; /admin/recruiters for administrative review
Community and hiring
  /showcase → /showcase/p/:id; /api/showcase/* for images/posts/social/moderation
  /talent/projects; /talent/:handle; /talent/:handle/projects/:projectId
  /talent/search; /talent/interest → requests/shortlists/messages/consent
Operational/static
  /sitemap.xml, /robots.txt, static HTML mirrors/assets and protected /uploads/*
  Optional /__loadtest/rss only when LOADTEST_DIAG=1 (not a public product feature)
```

The authoritative machine-readable list, with methods, middleware and source lines, is [route-inventory.csv](route-inventory.csv). [Dashboard views](dashboard-views.json) and [role/access inventory](role-access-inventory.csv) preserve the full discovered inventory.

## Role and access inventory

| Role | Prerequisite | Surface | Coverage |
| --- | --- | --- | --- |
| Visitor | No session | Landing, catalogues/course details, open sections, login/signup/recovery, privacy, public verification, selected public talent/teaser routes | Public page survey and 39 detail links; database-dependent talent blocked. |
| free | Free learner account | Open courses/compiler/events/profile; limited dashboard; cannot access enrolled batches | Free discovery, web preview, submit/retry/expiry and drafts tested. |
| student | Paid/enrolled learner account | Dashboard, enrolled course/task, quizzes/progress/resources/chat/certificates, talent and hiring interest | Existing and empty accounts tested; PostgreSQL talent blocked. |
| instructor | Assigned teacher | Assigned courses/students/resources/grades/quizzes/attendance, onboarding/contracts | Manual submission-grade-feedback flow works; scope defects in quiz/gems/certificates. |
| coordinator | Read-oriented oversight | Cross-course users/students/enrollments/reports; chat participation currently accepted | Visible-role 403 dead ends and read-only documentation mismatch. |
| admin | Administrator | Catalogue/batches/users/enrollments, events/reports/email, recruiters, moderation, finance and department management | 20 nav views surveyed; selected safe local mutations; destructive bulk operations not tested. |
| student_coordinator | Admissions Office | Registrations/challans, discounts/bank details, student queries/instructors/ambassador reports, enrollment after Finance | Normal local record pipeline partially verified; bundle and email-state failures. |
| finance | Finance officer | Registration payment clearance, expenses, balance sheet, Settings | Local simulated payment clearance verified; reconciliation/real payments not tested. |
| hr | HR officer | Staff/instructors/ambassadors, departments, onboarding/contracts, reports | Synthetic staff communication, department membership/task completion and offline contract rendering checked. |
| staff | Staff/intern account with StaffRecord | Own staff instructions/follow-ups, department assignments, Settings | Instruction/reply and targeted department task completion persisted and readable by HR. |
| ambassador | Active ambassador record | Referral code/QR, duties/referrals/leaderboards/reports and contract onboarding | Portal surveyed; local referral discount/enrollment/gem reward checked; cash payout/report-email not completed. |
| recruiter | pending/needs_info/rejected/approved account; company and PostgreSQL for marketplace | Status and resubmission; after approval search/contact/shortlists | Local request-info/resubmit/approve pass; marketplace blocked without PostgreSQL. |

## Confirmed defects and broken transitions

| ID | Priority | Area | Failing step | Observed result |
| --- | --- | --- | --- | --- |
| D-01 | P0 | Uploads / course resources / private documents | Download authorization | The free learner receives HTTP 200 and the exact private file bytes. The course API correctly returns 403 to the same learner. |
| D-02 | P1 | Authentication / account recovery | Invalidate old sessions after recovery | Reset succeeds, but the previously issued session still receives HTTP 200. Tokens last seven days and contain no password/session version. |
| D-03 | P2 | Profile / Settings | Save an empty optional field | The UI says Profile saved, but QA Browser City remains. The API filters out blank values before updating the profile. |
| D-04 | P2 | Shared navigation / sign-in / dashboard | Return to the requested view | Sign-in goes to /dashboard instead of Showcase. Refreshing Settings goes to Overview. Course/task selections share unchanged URLs, preventing reliable links. |
| D-05 | P1 | Free course and paid task workspaces | Recover the draft | Free task switching recreates an empty editor. Refresh returns free users to the catalogue and paid users to Overview. No draft warning was shown. Submitted paid code does reload when the task is reopened. |
| D-06 | P1 | Certificates / teacher permissions | Validate recipient eligibility | HTTP 200 creates a certificate. The public verification page describes the nonmember as having completed the course and lists its concepts. |
| D-07 | P1 | Assignments / Talent Profile / Hiring Interest / teacher list | Replace loading with error/retry | Assignments remains Loading. Talent Profile and Hiring Interest also remain Loading after real local 503 responses. The role survey captured unhandled errors. |
| D-08 | P1 | Admissions / Finance handoff | Confirm email delivery handoff | HTTP 200 advances the registration to challan_sent although the mail provider skips delivery. The route calls markSent without awaiting a delivery outcome. |
| D-09 | P2 | Public registration / Admissions | Retry/deduplicate registration | Both requests return 200 and two distinct registrations appear for the same learner/course. Newsletter and event duplication checks behave more safely. |
| D-10 | P2 | Registration validation | Validate the selected offering | The API reports success and stores a truncated code, DOES-NOT-EXI, which is not an offering. No valid enrollment route can be derived from it. |
| D-11 | P1 | Gems / teacher permissions | Check award recipient membership | HTTP 200 persists the award for the nonmember and changes their gem total. Validation checks student role but not enrollment. |
| D-12 | P1 | Quiz creation / teacher permissions | Bind creation to authorized resource | The server authorizes batch 1 but creates the quiz in batch 2 and returns HTTP 200. req.body overwrites batch_id during object spread. |
| D-13 | P2 | Course discovery / filters | Change catalogue mode | The active navigation changes to Live, but cFree remains free and only free language families appear. |
| D-14 | P2 | Coordinator / teacher list / reports | Render authorized actions and recover denied sections | The survey recorded 403 for /api/instructors-lite and /api/admin/leads; Teachers retains a Loading section and Reports exposes an Admin access only result. Coordinator can also write chat despite read-only documentation. |
| D-15 | P2 | Landing / catalogue / progress | Set accurate expectations | Marketing still promotes a July 31 registration deadline and August cohort; labels say 31 courses and 3 free courses while the catalogue has 39 offerings including 10 free. Landing Glow starts at 100 gems; the actual stage threshold is 250 (Nova 2000 vs 4000). |
| D-16 | P1 | Free submissions / grades / certificates | Recover after grading is unavailable | The task is stored ungraded and friendly courses promise grading shortly. No retry worker or manual open-task grading route was found. Resubmission clears score/gems before a replacement grade succeeds. |
| D-17 | P1 | Web Developer Path / paid enrollment | Price and fulfill the bundle | A PKR 43,500 advertised bundle generates gross/net PKR 0. Its available_batches is empty and enrollment returns Choose a valid batch for this course. PATH is not resolved as a course or bundle. |
| D-18 | P1 | Free progress / certificate eligibility | Apply one completion policy | Backend passed is true with average 93 despite a failed task. The frontend requires each task to meet the pass mark and cannot show all tasks complete. Different places also mention an average, all tasks, and a final exam. |
| D-19 | P2 | Legacy challenges / gem ledger | Reconcile rewards when a review changes | First approval awards 40; rejection leaves those 40; reapproval raises the total to 80. Repeating approval without changing status correctly awards once. The normal UI exposes review buttons only for pending work, so the failing correction sequence is API-level. |
| D-20 | P2 | Legacy hackathon team registration / rewards | Resolve unique teammates and award each person once | The stored team is [4,12,12]. Finalization awards student 12 twice, totalling 60 instead of 30. Repeat finalization is rejected correctly, but duplicated members are not removed. |

### D-01 · P0 · Private files can be downloaded by unrelated signed-in users

**Reproduce:** Assigned teacher uploads a synthetic private course PDF; a free learner not enrolled in that course requests the returned /uploads URL.

**Observed:** The free learner receives HTTP 200 and the exact private file bytes. The course API correctly returns 403 to the same learner.

**Change:** Replace the shared authenticated static-file mount with attachment ownership and purpose checks. Separate deliberately public assets from private submissions, contracts, resumes and onboarding documents.

**Acceptance:** An owner/assigned staff member can retrieve the attachment; unrelated free/student/recruiter accounts get 403/404 even with its exact URL; unauthenticated access stays denied.

**Owner:** Backend/security. **Evidence:** evidence/api-checks.json — SEC-01-private-file; server.js:4219,4254.

### D-02 · P1 · Password reset leaves existing sessions valid

**Reproduce:** Sign in as qa.free, retain that session, reset its password using the local reset token, and call /api/auth/me with the old cookie.

**Observed:** Reset succeeds, but the previously issued session still receives HTTP 200. Tokens last seven days and contain no password/session version.

**Change:** Version user sessions or maintain revocable server sessions. Rotate/invalidate old sessions on recovery and administrative password reset; give users a revoke-other-sessions action.

**Acceptance:** After recovery, cookies created before the reset return 401; the new session and password work; reused reset tokens fail.

**Owner:** Backend/security. **Evidence:** evidence/api-checks.json — SEC-05-reset-session; server.js:249-253,468-479.

### D-03 · P2 · Saving cleared profile fields retains the old data

**Reproduce:** Edit City to QA Browser City, save, edit again, erase City, and save. Reopen profile and inspect the persisted local user record.

**Observed:** The UI says Profile saved, but QA Browser City remains. The API filters out blank values before updating the profile.

**Change:** Distinguish omitted fields from explicit clears; allow empty/null values for optional fields and return the canonical saved profile.

**Acceptance:** Clearing City, Goal and Links removes each stored value and keeps it empty after refresh and a new session; mandatory fields receive specific validation.

**Owner:** Backend + profile UI. **Evidence:** evidence/browser-workflows.json — PROFILE-UI-CLEAR; evidence/annotated-profile-clear.png; server.js:494-500.

### D-04 · P2 · Authentication and refresh lose the intended destination

**Reproduce:** Open /showcase while signed out, complete the login form, then separately open Settings and refresh the dashboard.

**Observed:** Sign-in goes to /dashboard instead of Showcase. Refreshing Settings goes to Overview. Course/task selections share unchanged URLs, preventing reliable links.

**Change:** Give significant views stable URLs and preserve a validated same-origin returnTo through login, expiry and logout recovery. Restore the active route on load.

**Acceptance:** A bookmarked course/task/settings route survives refresh; authentication returns there; Back/Forward retraces navigation; external return URLs are rejected.

**Owner:** Frontend + authentication. **Evidence:** evidence/browser-workflows.json — AUTH-RETURN, DASHBOARD-REFRESH; public/js/login.js:18-25; public/js/dashboard.js:118-150.

### D-05 · P1 · Unsubmitted code is lost on task switches and refresh

**Reproduce:** Type code without submitting. Switch from task 1 to task 2 and back on the free course, or refresh a free/paid task.

**Observed:** Free task switching recreates an empty editor. Refresh returns free users to the catalogue and paid users to Overview. No draft warning was shown. Submitted paid code does reload when the task is reopened.

**Change:** Autosave drafts per user/course/task/language, show save state, restore before rendering the editor, and warn when leaving work that has not been saved. Preserve the latest successful submission separately.

**Acceptance:** Desktop and 390px mobile drafts survive task switching, Back/Forward, refresh, session expiry and sign-in; another account never inherits them. An interrupted save has a visible recovery path.

**Owner:** Learning frontend. **Evidence:** evidence/browser-workflows.json — DRAFT-SWITCH/REFRESH; evidence/final-browser-checks.json — PAID-DRAFT-REFRESH; evidence/annotated-draft-loss-desktop.png; public/js/open.js:1361; public/js/dashboard.js:4853.

### D-06 · P1 · A teacher can certify a student outside their course

**Reproduce:** An assigned teacher issues a course certificate using the ID of QA Empty Student, who has no enrollment in that batch.

**Observed:** HTTP 200 creates a certificate. The public verification page describes the nonmember as having completed the course and lists its concepts.

**Change:** Validate enrollment and the configured completion rule before course certification. Keep any exceptional administrative issuance as a separate permission with a recorded reason.

**Acceptance:** An instructor cannot issue a course certificate to a nonmember or ineligible learner. Valid graduates can be certified once, and verification reflects the recorded completion basis.

**Owner:** Backend + learning policy. **Evidence:** evidence/operations-initial.json — CERT-NONMEMBER; evidence/final-browser-checks.json — CERT-VERIFY-UI; evidence/certificate-verification.png; server.js:2778-2806.

### D-07 · P1 · Several failed data requests leave permanent loading screens

**Reproduce:** Return a deliberate HTTP 503 for /api/my/quests and open Assignments. Also open student Talent Profile/Hiring Interest with PostgreSQL unavailable.

**Observed:** Assignments remains Loading. Talent Profile and Hiring Interest also remain Loading after real local 503 responses. The role survey captured unhandled errors.

**Change:** Use a shared loading/error/empty/success state component. Catch render errors, retain existing content when possible, provide retry, and explain temporary feature unavailability in learner language.

**Acceptance:** A failed, aborted or timed-out request removes the loader, announces a useful error and exposes Retry; a successful retry restores the screen without a full reload.

**Owner:** Frontend. **Evidence:** evidence/browser-workflows.json — ERROR-ASSIGNMENTS; evidence/browser-survey.json — view-student-talent-profile, view-student-hiring-interest; evidence/annotated-loading-error.png; public/js/dashboard.js:1327,2816,3133.

### D-08 · P1 · Challan is marked sent even when no email was sent

**Reproduce:** Generate a synthetic challan with SMTP disabled, then use the challan send endpoint. Inspect its registration stage.

**Observed:** HTTP 200 advances the registration to challan_sent although the mail provider skips delivery. The route calls markSent without awaiting a delivery outcome.

**Change:** Track queued, provider-accepted and failed mail states. Advance the workflow only at the documented successful handoff; retain retry and a downloadable PDF. Repeated send attempts need deduplication.

**Acceptance:** Disabled SMTP, provider rejection and network failure cannot produce a Sent status. A test-provider acknowledgement advances the correct record exactly once.

**Owner:** Backend + admissions. **Evidence:** evidence/operations-initial.json — ADMIT-SEND-FAILURE; server.js:3780-3797; mail-provider.js:77-80.

### D-09 · P2 · Repeated course registration creates duplicate records

**Reproduce:** Submit the same name, email and course twice using the normal registration payload.

**Observed:** Both requests return 200 and two distinct registrations appear for the same learner/course. Newsletter and event duplication checks behave more safely.

**Change:** Define duplicate behavior per learner and offering, use idempotency keys, and show an existing registration receipt when the same request is retried.

**Acceptance:** Double-click, timeout/retry and resubmission create one active registration per learner/offering, while registration for another course remains allowed.

**Owner:** Admissions backend. **Evidence:** evidence/api-checks.json — ADMIT-01-duplicate; store.js:4023; server.js:3660.

### D-10 · P2 · Unknown course codes are accepted and stored

**Reproduce:** Submit a registration with course_code DOES-NOT-EXIST. Inspect the resulting record and its available batches.

**Observed:** The API reports success and stores a truncated code, DOES-NOT-EXI, which is not an offering. No valid enrollment route can be derived from it.

**Change:** Resolve the offering server-side, reject missing/unknown codes, and store the authoritative title and price identifier rather than trusting client text.

**Acceptance:** Unknown/missing/deactivated offerings return a field-level 400 and create no record; valid courses and modeled bundles use authoritative identifiers.

**Owner:** Admissions backend. **Evidence:** evidence/api-checks.json — ADMIT-02-invalid-course; evidence/persisted-record-summary.json; server.js:3660-3684; store.js:4023.

### D-11 · P1 · Teachers can award course gems to nonmembers

**Reproduce:** Assigned teacher awards 25 gems to QA Empty Student, who is not enrolled in the teacher’s batch.

**Observed:** HTTP 200 persists the award for the nonmember and changes their gem total. Validation checks student role but not enrollment.

**Change:** Require recipient enrollment in the authorized batch and record a reason and actor. Keep a separately authorized institute-wide award action if needed.

**Acceptance:** A teacher’s course award to a nonmember fails and changes no totals; valid awards are persisted and auditable.

**Owner:** Backend/permissions. **Evidence:** evidence/api-checks.json — SEC-03-gems-nonmember; server.js:1590-1598.

### D-12 · P1 · Quiz request body can override the authorized batch

**Reproduce:** As a teacher of batch 1, POST to /api/batches/1/quizzes with body batch_id:2, where batch 2 has no assigned teacher.

**Observed:** The server authorizes batch 1 but creates the quiz in batch 2 and returns HTTP 200. req.body overwrites batch_id during object spread.

**Change:** Whitelist quiz fields and set batch_id exclusively from req.batch after parsing the body. Review analogous route/body ID merges.

**Acceptance:** A conflicting body ID is rejected or ignored; every created quiz belongs to the URL batch that passed authorization; unauthorized batches are unchanged.

**Owner:** Backend/security. **Evidence:** evidence/supplemental-checks.json — SEC-QUIZ-SCOPE; server.js:2554-2557.

### D-13 · P2 · Live course navigation retains the Free-only filter

**Reproduce:** Open /open#free, then select Live Tech Courses in the main navigation.

**Observed:** The active navigation changes to Live, but cFree remains free and only free language families appear.

**Change:** Make navigation mode and filter state one source of truth. Set or reset applicable filters on both mode changes and show active filters clearly.

**Acceptance:** Switching between Free and Live consistently shows the advertised offerings; search and tier filters combine predictably and clearing filters restores results.

**Owner:** Catalogue frontend. **Evidence:** evidence/final-browser-checks.json — FILTER-LIVE-AFTER-FREE; evidence/live-nav-free-filter.png; public/js/open.js:119-125.

### D-14 · P2 · Coordinator UI exposes actions whose APIs reject that role

**Reproduce:** Sign in as coordinator and navigate to Teachers and Reports. Use the visible lead-related affordances.

**Observed:** The survey recorded 403 for /api/instructors-lite and /api/admin/leads; Teachers retains a Loading section and Reports exposes an Admin access only result. Coordinator can also write chat despite read-only documentation.

**Change:** Define coordinator capabilities explicitly, then share them between API gates and visible navigation. Resolve whether course-chat participation is an intentional exception to read-only access.

**Acceptance:** Every visible coordinator action has an allowed, scoped endpoint; unavailable actions are omitted/explained; any read-only exception is documented and tested.

**Owner:** Product + role UI/backend. **Evidence:** evidence/browser-survey.json — role-errors-coordinator, view-coordinator-admin-teachers, view-coordinator-admin-analytics; evidence/api-checks.json — SEC-04-coordinator-write.

### D-15 · P2 · Marketing contradicts current dates, catalogue and gem rules

**Reproduce:** Compare the September 9 landing page and course catalogue with actual catalogue and stage data.

**Observed:** Marketing still promotes a July 31 registration deadline and August cohort; labels say 31 courses and 3 free courses while the catalogue has 39 offerings including 10 free. Landing Glow starts at 100 gems; the actual stage threshold is 250 (Nova 2000 vs 4000).

**Change:** Drive counts, stage ranges and active cohort dates from the same data as enrollment and progress. Expire campaign urgency copy automatically.

**Acceptance:** Dates match the active offering; historical campaigns cannot claim seats are filling; counts match catalogue definitions; every stage threshold matches the dashboard.

**Owner:** Content + product/frontend. **Evidence:** evidence/browser-survey-public.json — landing-desktop, open-desktop; evidence/catalogue-snapshot.json; public/landing.html:426,503-520,624; store.js:31-38.

### D-16 · P1 · Automatic grading failure has no durable recovery workflow

**Reproduce:** Submit a valid free task with AI disabled (local fault configuration); inspect response, persistence and processing code. Inspect resubmission of a previously scored task.

**Observed:** The task is stored ungraded and friendly courses promise grading shortly. No retry worker or manual open-task grading route was found. Resubmission clears score/gems before a replacement grade succeeds.

**Change:** Persist a grading job with pending/failed/retrying status and a staff retry path. Keep the previous completed attempt/grade until the replacement is successfully graded.

**Acceptance:** Provider timeout/rejection can be retried without another upload; learners see a truthful status; successful recovery updates progress once; a failed retry does not erase an earned grade.

**Owner:** Backend/AI + learning UI. **Evidence:** evidence/api-checks.json — LEARN-05-submit-persist; evidence/browser-workflows.json — SUBMIT-RETRY; server.js:4090-4132; store.js:3955-3964.

### D-17 · P1 · Advertised course bundle creates a zero-fee challan and cannot enroll

**Reproduce:** Use the advertised PATH registration payload, generate its challan, simulate local Finance clearance, and try Admissions enrollment.

**Observed:** A PKR 43,500 advertised bundle generates gross/net PKR 0. Its available_batches is empty and enrollment returns Choose a valid batch for this course. PATH is not resolved as a course or bundle.

**Change:** Model bundles as real offerings with component enrollments, authoritative prices and a batch choice for each required course. Until supported, remove the actionable bundle registration offer.

**Acceptance:** The published PKR 43,500 price reaches the challan; payment clearance lets Admissions place the learner in every component; completion is atomic or explicitly recoverable.

**Owner:** Product + admissions/backend. **Evidence:** evidence/bundle-and-rules.json — BUNDLE-PRICE, BUNDLE-ENROLL; public/js/open.js:506-515,625-650; store.js:2355-2371; server.js:3930-3950.

### D-18 · P1 · Course progress and certification use different pass rules

**Reproduce:** In an isolated business-rule fixture, grade all 15 JavaScript tasks: first 0, remaining 100. Compare backend passed with the UI’s per-task rule.

**Observed:** Backend passed is true with average 93 despite a failed task. The frontend requires each task to meet the pass mark and cannot show all tasks complete. Different places also mention an average, all tasks, and a final exam.

**Change:** Choose and document one pass rule, then calculate progress and certificate eligibility on the server from that shared rule. Align all course copy.

**Acceptance:** Boundary fixtures (one failed task/high average, exactly pass mark, missing grade, regrade) produce identical progress, completion and certificate eligibility across UI/API.

**Owner:** Learning policy + backend/frontend. **Evidence:** evidence/bundle-and-rules.json — PASS-RULE-CONFLICT; store.js:3980-4003; public/js/open.js:1109-1120,1063.

### D-19 · P2 · Challenge review corrections can award the same win twice

**Reproduce:** Create a 40-gem challenge and approve its submission. Using the authorized admin review API, reject that approved submission and approve it again.

**Observed:** First approval awards 40; rejection leaves those 40; reapproval raises the total to 80. Repeating approval without changing status correctly awards once. The normal UI exposes review buttons only for pending work, so the failing correction sequence is API-level.

**Change:** Use a unique reward identity per challenge and learner. Reject unsupported review transitions or explicitly reconcile the previous award when an authorized correction changes the result.

**Acceptance:** Approve/repeat/reject/reapprove cannot create two rewards for one win. Any reversal is visible and auditable; the displayed status agrees with earned gems.

**Owner:** Backend + rewards. **Evidence:** evidence/coverage-expansion.json — CHALLENGE-REAWARD; store.js:1644-1657; server.js:1881-1886.

### D-20 · P2 · Duplicate hackathon teammates receive duplicate prizes

**Reproduce:** Register a synthetic paid team with qa.empty entered twice in member_regs. Approve its simulated payment, submit, score and finalize a 30-gem first prize.

**Observed:** The stored team is [4,12,12]. Finalization awards student 12 twice, totalling 60 instead of 30. Repeat finalization is rejected correctly, but duplicated members are not removed.

**Change:** Resolve teammate identifiers to a unique set of user IDs before validating team size. Enforce one prize per event/place/person and guard legacy duplicate records at finalization.

**Acceptance:** Repeated username/reg-number aliases create one membership or a clear validation error. Every eligible teammate receives exactly one advertised prize after repeated finalize requests.

**Owner:** Backend + event UI. **Evidence:** evidence/coverage-expansion.json — HACKATHON-UNIQUE-MEMBERS; store.js:1710-1718,1773-1777; public/js/dashboard.js:4511-4520.

## Usability concerns (separate from functional defects)

| ID | Priority | Screen | Observation | Change | Acceptance | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| U-01 | P2 | Shared sign-in/profile dialogs | The sign-in modal has role=dialog and aria-modal=true, but focus remains on BODY; the first Tab reaches a background link. Escape support and global focus styling already exist. | Move focus into the dialog, keep Tab/Shift+Tab inside, make the background inert and restore focus to its trigger. | Opening, using and closing each dialog is possible with keyboard only; no focus reaches obscured controls. | evidence/browser-workflows.json — A11Y-MODAL; evidence/annotated-signin-focus.png |
| U-02 | P2 | Landing / all-course catalogue | The 390px all-course page screenshot is 12,156px tall; headers, promotion and course cards create a long route to later offerings. The layout fits horizontally. | Prioritize search and relevant categories, use concise cards, preserve filters and add progressive pagination/load more with a result count. | A learner can find a specific free or paid course without traversing the full catalogue; filter state survives return from course detail. | evidence/open-mobile.png; evidence/browser-survey-public.json |
| U-03 | P3 | Student overview / recommendation cards | Several descriptions visibly end with fragments such as production-se or developer ca; the truncation does not explain that more text is available. | Use line clamping with an ellipsis, concise editorial summaries and a clear course detail affordance. | No summary ends with an unexplained cut word at desktop or mobile widths; full detail is reachable. | evidence/dashboard-student.png; evidence/dashboard-student-mobile.png |
| U-04 | P2 | Free curriculum / paid Assignments / progress | The same journey alternates among modules, levels, lessons, lectures, tasks, quests, assignments and final exam. The free course lists a final exam without a distinct tested exam step. | Use a stable hierarchy: Course → Module → Lesson → Task. State the actual completion policy next to progress and identify any final assessment explicitly. | A learner can identify the next required action and all requirements for completion from the curriculum without reconciling contradictory labels. | evidence/free-curriculum-desktop.png; evidence/paid-task-desktop.png; D-18 |
| U-05 | P2 | AI help / talent pages | Local unavailable states tell learners to set API keys or configure PostgreSQL. The Talent gallery at least replaces its loader with an error, while dashboard counterparts do not. | Show a user-facing unavailable message and recovery action; put configuration diagnostics in authorized system health/logs. | Student-facing errors contain no environment-variable or infrastructure setup instructions and provide a next step. | evidence/api-checks.json — AI-01-unconfigured,TALENT-01-db-unavailable; evidence/talent-projects-desktop.png |
| U-06 | P2 | Registration / Admissions handoff | The success dialog says an email is on its way and asks applicants to wait. The public response has only ok, and no applicant tracking or resume link was observed. | Return a reference and a status page with next steps, contact route, resend status and the selected offering. Keep sensitive payment data protected. | After refresh or a missed email, the applicant can recover their registration status without creating another record. | public/js/open.js:644-651; evidence/api-checks.json — ADMIT-01-duplicate; D-08 |
| U-07 | P2 | Free/student first contact and staff onboarding | Learners without a phone are blocked by a non-dismissable WhatsApp form, including when browsing the open site. The copy combines certificates with promotional communication. This is an observed product choice, not asserted to be a technical failure. | Explain the immediate purpose; permit sign-out and returning later, and separate required account contact from optional promotional preferences. | A new user can understand the requirement, correct an error, sign out or resume later without being trapped behind an overlay. | public/js/open.js:273-293; public/js/dashboard.js:266-340 |
| U-08 | P3 | Mobile login / signup / shared navigation | Login recovery/signup links measure about 16px high; catalogue footer links about 15px. Primary buttons and responsive single-column forms are usable in the tested viewport. | Increase the padded hit area of secondary actions, group mobile navigation and keep labels readable. | Primary actions have a 44px design target; small secondary links have adequate spacing/padding and can be selected without adjacent activation in touch tests. | evidence/browser-survey-public.json — login-mobile, recruiter-signup-mobile, free-courses-mobile |
| U-09 | P3 | Admin overview / system health | The overview includes escaped &middot; text and a clipped Operational label in a narrow health card. A dry-run bulk provider is shown as operational even when it is not configured; the detail does disclose dry run. | Use clear Healthy / Disabled / Test mode / Failed labels, wrap diagnostic text and format separators once. | Statuses and details stay readable at 1440px and 390px; a disabled/test integration is visually distinct from an available delivery service. | evidence/dashboard-admin.png; evidence/dashboard-admin-mobile.png |

## Screen-by-screen review

Each row records what was actually observed to work, the task consequence, a concrete change, and acceptance criteria. Unavailable features are not credited with successful workflows merely because their forms render.

| Screen / component | What works well (observed scope) | Problem / uncertainty | Affected task and consequence | Recommended change | Testable acceptance criteria | Evidence / issue IDs |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | Clear hero actions; visible course prices; FAQ and free entry; desktop/mobile layout fits. | Past cohort urgency, conflicting counts and stage thresholds. | Applicants may believe registration is closed or expect rewards at the wrong thresholds. | Read campaign, catalogue and gem metadata from shared services. | Displayed dates/counts/stage boundaries equal current product data and expired campaigns disappear. | landing-desktop/mobile.png; D-15 |
| SEO catalogue and course pages | 39 emitted course-detail links resolve; cards communicate category, duration and price. | Page resolution does not establish lesson completeness; long list and stale 31-course link. | Discovery takes excess effort and content freshness is unclear. | Keep common offer metadata and add clear search/filter navigation back to results. | Every listed offer has matching detail/registration data; returning preserves search. | catalogue-desktop/mobile.png; course-link-checks.json; U-02,D-15 |
| Live catalogue / filtering | No-match message and clearing search work; course cards include actual buttons. | Free filter persists when Live is selected; mobile list is very long. | Learner cannot find the paid offering after browsing free courses. | Unify mode/filter state; prioritize search and result count. | Free → Live → search → clear produces correct results and retains state on return. | live-nav-free-filter.png; D-13,U-02 |
| Free language catalogue | Language-family buttons expose two-course ladders with clear free labels. | Shared header still describes old live cohort and shows paid bundle promotions. | Free learners must separate irrelevant enrollment information from their next action. | Give free catalogue its own concise introduction and learning-focused actions. | Free page clearly says self-paced/free and offers a next course without paid-enrollment ambiguity. | free-courses-desktop/mobile.png; U-04,D-15 |
| Free curriculum | Price, access, duration and modules are visible; real module/continue buttons. | Dense outcome text; average/every-task/final-exam wording conflict. | Learners cannot reliably identify when they have completed the course. | Show concise outcomes and one canonical completion checklist. | Progress, certificate eligibility and copy agree for pass/fail boundary fixtures. | free-curriculum-desktop.png; D-18,U-04 |
| Lesson video | Embedding and watched-marker code exist; lesson/title hierarchy is present. | Playback untested; watch status is browser/track local and not account synced. | Device/shared-browser changes may make watched state surprising. | Explain local-only markers or sync them per account; provide captions/transcript and fallback links. | Playback/captions and recovery are verified in a browser; watch status behaves as described across accounts/devices. | open.js:726-772,1091-1105; WF-38 |
| Free task workspace | Brief, expected output, hint, Run, submit status and retry affordances present; web code runs at both widths. | Task switch/refresh loses draft; grading outage has no durable retry. | A learner can lose work and become stuck waiting for grade/certificate. | Autosave per task/account and introduce a persistent grading-status timeline. | Draft and prior result survive navigation, reload, login and provider failure; retry resolves the same task. | free-workspace-desktop/mobile.png; annotated-draft-loss-desktop.png; D-05,D-16 |
| Standalone compiler | Signed-out gate and signed-in multi-file editor render; local project storage implementation exists. | Standalone Python/SQL/multi-file persistence not completed; external C/C++/Java execution blocked. | Full advertised language support remains unverified. | Provide visible runtime setup/loading/error/cancel states and account-scoped drafts. | Each supported language passes valid/invalid/stdin/timeout/retry cases; project files survive reload and do not leak across accounts. | standalone-compiler.png; compiler-signed-out-desktop.png; WF-89,WF-90 |
| Login | Labels, password masking and invalid-credential feedback work; role-based landing exists. | Requested destination is discarded; secondary mobile links have small hit areas. | Users repeat navigation after sign-in. | Preserve a safe return URL and enlarge recovery/signup hit areas. | Sign-in from every protected entry returns there; touch and keyboard reach recovery easily. | login-desktop/mobile.png; D-04,U-08 |
| Free email signup dialog | Explains account/course-registration choices; duplicate API signup is rejected. | Keyboard focus is outside the dialog; verification delivery unavailable in test environment. | Keyboard users can activate obscured page controls; onboarding completion cannot be certified. | Trap and restore focus; present verification status and recovery without losing form input. | Tab remains in dialog; code resend/expiry/wrong-code paths retain all valid fields. | annotated-signin-focus.png; U-01; WF-13,WF-14 |
| Password recovery | Local reset validates length and consumes token once; invalid link screen is clear. | Old authenticated sessions remain valid; portal users require academy assistance. | Recovery cannot terminate an unwanted active session. | Revoke old sessions and explain the recovery route by account type. | Reset invalidates all pre-reset tokens; each supported account type has a usable next step. | invalid-reset-desktop/mobile.png; D-02; WF-16,WF-18 |
| Student overview / empty account | Resume learning works; empty account has explicit no-course messages; real grade/quiz achievements appear. | Large recommendation area pushes support/rewards lower on mobile; summaries cut mid-word. | Returning learner spends effort locating the next task and new learners lack a direct enrollment checklist. | Prioritize next task, upcoming deadlines and a concise onboarding card; clamp summaries cleanly. | An enrolled and an empty learner each see a clear primary next action above secondary recommendations. | dashboard-student.png; dashboard-student-mobile.png; dashboard-empty.png; U-02,U-03 |
| Profile / Settings / free profile | Nonempty profile save persists; free profile exposes password change; account menu groups settings. | Clearing optional fields silently fails; Settings route is lost on refresh. | Users cannot remove outdated information and may believe it was removed. | Support explicit clears and stable Settings route; return saved canonical values. | Blank optional values remain cleared after reload; Settings opens directly and survives refresh. | annotated-profile-clear.png; free-profile.png; D-03,D-04 |
| Paid course / Resources | Enrolled course opens; paid submitted code and attached lesson persist. | Private file download skips enrollment check; task URL/draft not durable. | Unrelated users can retrieve a private attachment and students lose edits. | Authorize attachment access and persist task routes/drafts. | Nonmembers denied by both course and attachment APIs; task state restores after reload. | paid-course-mobile.png; paid-task-desktop.png; D-01,D-05 |
| Assignments / task list | Quest-based assignment list and teacher remarks render when requests succeed. | Simulated 503 leaves Loading forever. | Student cannot see work or decide how to recover. | Use explicit error with Retry and preserve previously loaded data. | Timeout/503/offline cases replace loader and can recover with one retry. | annotated-loading-error.png; D-07 |
| Teacher grading | Brief, student work, prior grade, lateness and remarks are together; learner receives stored grade/feedback. | AI review was unavailable; small header logo appears compressed in screenshot. | Teacher review is otherwise clear but brand treatment and integration feedback need refinement. | Preserve logo aspect ratio and show AI capability/status while keeping manual grade usable. | Manual grade remains usable when AI fails; logo retains natural proportions in both layouts. | grade-instructor.png; operations-checks.json; U-05 |
| Quizzes | API lifecycle scores correct answer, persists gems, and prevents duplicate/nonmember attempts. | Teacher can override batch in create payload; full browser timed-attempt flow not tested. | Teacher can affect an unrelated course; timed recovery remains uncertain. | Bind quiz to authorized batch and add visible time/attempt-submit recovery. | Cross-batch creation is blocked; a learner can submit/recover a timed attempt without double scoring. | operations-checks.json; supplemental-checks.json; D-12 |
| Progress / achievements / leaderboard | Real task and quiz gem events display; progression target is visible; gem aggregation unit check passes. | Landing thresholds differ; free completion/certification policies disagree. | Learner cannot predict milestones or understand a partially complete certified course. | Use one server-owned progression/completion model for all surfaces. | Same fixture yields identical totals, stage and completion in every view. | dashboard-student-mobile.png; D-15,D-18 |
| Certificates / public verification | Synthetic serial verifies publicly; invalid serial fails clearly; share PNG renders. | Teacher can issue course certificate to a nonmember; share/QR scanning not completed. | Verification can authenticate a record with an invalid completion basis. | Validate eligibility before issuance, then show clear verification and revocation states. | Only eligible/authorized records are issued; public state matches persisted serial and revocation status. | certificate-verification.png; synthetic-certificate.png; D-06 |
| Events / webinars / hackathons | Event registration/submission/cutoff and simulated payment gates pass locally; legacy team scoring/finalization works for stored entries. | Repeated teammates receive duplicate prizes; rejected event proof cannot be replaced through registration. Live meetings and large-result pagination remain untested. | Rewards can be incorrect, and payment-proof recovery needs academy contact. | Deduplicate team members; show payment review status, a replacement-proof action and the next step. | Each person receives one prize; a rejected proof can be corrected with history preserved; expired/paid/unregistered variants receive clear outcomes. | populated-events.png; supplemental-checks.json; coverage-expansion.json; D-20; WF-52-56 |
| Legacy challenges | Link validation and reject→revise→approve persist; repeated identical approval awards gems once. | An administrative API correction after approval can double the reward. UI review actions only appear for pending work. | Learner gem totals can disagree with the final challenge result. | Define supported review transitions and an auditable reward correction process. | One win produces one reward; authorized corrections update the status and reward consistently and explain the change to the learner. | coverage-expansion.json — CHALLENGE-REVIEW,CHALLENGE-REAWARD; D-19; WF-92 |
| Announcements / feedback | Announcement page has a clear empty state; feedback is hidden until approval and excludes email publicly. | Delivery fan-out and full submit/reply UI not completed. | Audience receipt and moderation completion remain uncertain. | Separate publication status from message delivery and expose moderation confirmation. | Correct audiences see published content; no email is exposed; failed delivery has recovery. | announcements screenshots; operations-initial.json; WF-57,WF-58 |
| Messages / course chat | Course-member data and conversation UI exist; stored message is retrievable. | Read-only coordinator documentation conflicts with writable chat; anonymous/mention lifecycle not completed. | Participants may misunderstand authority or anonymity. | State who can read/post/moderate and explain anonymous mode precisely. | Role and privacy tests cover post/reply/delete/mentions without leaking hidden identity. | messages survey; D-14; WF-45 |
| Jobs / job detail | Actual job card→detail navigation works at 1440px and 390px; saved learner comment and external application explanation are visible. | Job details use an in-page view without a stable URL; employer submission and combined filters remain unverified. | A learner cannot reliably bookmark or resume the job through refresh, and the external outcome is outside this audit. | Give each job a stable route and preserve search context; retain the explicit external-application explanation. | Job detail survives refresh/Back; comments persist; open/closed postings expose the correct action; application links resolve in designated staging. | populated-job-1440.png; populated-job-390.png; coverage-browser-final.json; D-04; WF-59 |
| Public talent profiles / projects | Project gallery replaces loader with a clear unavailable response in local mode. | PostgreSQL unavailable; successful publication/search not verified. | Visitors cannot reach meaningful talent content in this configuration. | Render a usable feature-unavailable state and keep database setup details private. | Configured staging passes publish→public-view with contact/resume privacy checks; unavailable state has recovery. | talent-projects-desktop/mobile.png; U-05; WF-60,WF-61 |
| Student Talent Profile / Hiring Interest | Navigation separates profile and hiring requests. | Both views remain Loading on real local 503. | Students have no route forward or explanation. | Shared error/retry handling plus capability-aware entry. | 503 replaces spinner and retry works; consent workflow passes with a scratch database. | view-student-talent-profile.png; D-07; WF-60,WF-65 |
| Recruiter signup / review status | Structured company fields; pending and approved screens; API review/resubmit/approve transitions pass. | Signup/company matching and inbox delivery not fully tested; approved actions lead to unavailable database-dependent features locally. | New recruiter can be verified while useful hiring actions are unavailable. | Separate account approval from service availability; keep request-info context visible while editing. | Needs-info data survives correction; approved users reach functioning search or a recoverable unavailable state. | recruiter-signup screenshots; populated-recruiter.png; WF-62-64 |
| Recruiter search / contact / shortlists | Routes and form structures were inventoried, including consent and per-recruiter gates. | No PostgreSQL test data; functionality and privacy outcomes not executed. | Hiring and contact safety remain unverified. | Prioritize scratch-database tests for filtering, pagination, consent and resume access. | Correctly scoped recruiter requests, consent, messaging and list persistence pass; unrelated recruiters denied. | talent.js; talent-hiring.js; WF-64-66 |
| Showcase feed / composer / moderation | Signed-in empty feed renders; no-image validation works; signed-out user is gated. | Every post requires R2 image storage, unavailable locally; destination lost after login. | Student cannot publish or return directly to intended feed. | Preserve destination and expose image capability/retry before accepting work. | Sandbox post→like/comment/report→moderate completes with correct cohort visibility and retryable image upload. | showcase-empty.png; D-04; WF-67,WF-68 |
| Admin overview / health | Actual counts, upcoming admin actions and explicit SMTP-unconfigured detail are present. | Health card wraps poorly, escaped separator text appears, test/disabled delivery can look operational. | Operators may misread service readiness. | Use clear state labels and responsive diagnostic rows. | No clipped status at target widths; unavailable/dry-run is visually distinct from operational. | dashboard-admin.png; U-09 |
| Admin user / course / enrollment management | Role-specific lists render; designated accounts and batch creation work locally. | Bulk destructive changes and cascade recovery not tested. | Administrative mistakes may have unverified consequences. | Add affected-record preview, meaningful confirmation and recovery for destructive operations. | Synthetic create→assign→remove cases preserve intended history and reject unauthorized roles. | browser-survey.json; WF-69 |
| Coordinator reports / teacher list | Read access to core users/enrollments is available. | Visible subsections call endpoints that return 403 and leave partial loaders. | Coordinator meets dead ends in duties exposed by navigation. | Define one capability map and remove unsupported actions. | All visible coordinator tabs complete or explain their state without 403 dead ends. | browser-survey.json — coordinator; D-14 |
| Admissions registrations / challans | Stage folders, counts, explicit handoff instructions and per-record actions are clear. | Duplicate/invalid registrations, false mailed stage and broken bundle fulfillment. | Applicant may be stuck or charged the wrong amount while staff see a misleading status. | Model offerings/bundles, deduplicate requests and make delivery a first-class state. | Normal, duplicate, invalid, bundled and failed-email cases complete correctly or provide a recoverable stage. | populated-student_coordinator.png; D-08,D-09,D-10,D-17 |
| Finance / public challan | Payment-cleared stage and public paid document match local persisted state; PDF generates. | Real payment proof, reconciliation and expense workflows untested; default bank data is placeholder. | Payment collection and reconciliation cannot be certified from local tests. | Validate bank configuration before issuing payable documents and distinguish manual verification from automatic settlement. | Sandbox proof→verification→admissions handoff works; invalid/default bank setup prevents a misleading payable invoice. | populated-finance.png; synthetic-challan.pdf; WF-74,WF-76 |
| HR onboarding / contracts | Role-specific portal; synthetic instructor/ambassador PDFs parse as 12/13 pages with party details. | Signed-return, deadline/email and document access completion untested; shared upload authorization weak. | Private identity/contract data can be exposed and onboarding recovery remains uncertain. | Secure per-person documents and expose resumable stages and delivery/signature status. | Only authorized people can access documents; every required upload/signature/deadline case has recovery. | populated-hr.png; synthetic contracts; D-01; WF-77 |
| Staff / department work | HR instructions/reply and targeted department-task completion persist; duplicate department and nonmember-head checks work. | Task proof-file, return-for-correction and complete browser form sequence remain unverified. | Normal local completion works, but evidence correction and reopening need dedicated validation. | Make status, owner, due date and evidence submission explicit. | A task can be assigned, completed, returned for correction and reopened without losing evidence. | populated-staff.png; final-api-checks.json; coverage-expansion.json; WF-78,WF-79 |
| Ambassador portal / reports | Portal renders referral identity; synthetic referral plus stacked discount reaches enrollment and one correct gem award. | Cash commission payout, report email and signing were not completed. | Earned gems have local evidence; downstream cash payout remains unverified. | Show how referral registration differs from paid enrollment and when gems/commission accrue. | A referral keeps its discount snapshot, generates one correct reward/report entry, and exposes the commission payment status. | populated-ambassador.png; coverage-expansion.json; WF-75,WF-80 |
| Privacy / public profiles | Plain-language privacy content renders; talent contact-gating design is documented in code. | Formal privacy/legal review, public profile photo access and request fulfillment not tested. | Published promises may exceed tested safeguards. | Align wording with actual role access and feature availability; make contact/help routes clear. | Functional privacy promises are backed by access tests; no compliance claim is made solely from this audit. | privacy-desktop/mobile.png; WF-88; D-01 |
| Shared dialogs / keyboard / touch | Form labels, dialog semantics, Escape handling and global visible-focus/reduced-motion styles exist. | Modal focus not captured/trapped; several secondary mobile links have 15–16px boxes. | Keyboard users reach obscured controls and touch targets are hard to select. | Use a reusable accessible dialog and consistent padded secondary actions. | Keyboard completes open/use/close with focus restored; touch interactions avoid adjacent activation. | annotated-signin-focus.png; U-01,U-08 |

## Proposed enhancements

These improve the experience and testability; they are distinct from fixing the demonstrated failures.

| ID | Priority | Proposal | Change | Acceptance | Evidence |
| --- | --- | --- | --- | --- | --- |
| E-01 | P2 | Unify public and portal learning destinations | Keep one recognizable account entry, role-aware navigation, and a clear switch between enrolled and free learning. | A learner can explain their current location and reach both learning areas without signing in again. | U-04; D-04; public/portal survey |
| E-02 | P2 | Provide resumable applicant and learner onboarding | Add an onboarding checklist with saved progress and contextual links to the next action. | A new/empty account has a relevant next action and returns to its unfinished step. | U-06,U-07; empty-account survey |
| E-03 | P2 | Make submission attempt history visible | Keep a versioned history of code/files, grading status and feedback, with explicit retry and restore actions. | A learner can compare attempts and recover the last successful submission after a failed regrade. | D-05,D-16 |
| E-04 | P2 | Expose service availability as product state | Hide or explain unsupported AI, talent, image sharing and live-class actions using server capability metadata. | A disabled integration never presents an action that leads only to an endless loader or raw setup instruction. | D-07,D-16,U-05 |
| E-05 | P3 | Add a focused role-based design system | Standardize headings, action placement, empty/error/loading states, dialogs, tables and mobile navigation across the portals. | Equivalent tasks use the same labels, layout and keyboard behavior across roles. | UI screen review; U-01,U-04,U-08,U-09 |
| E-06 | P2 | Establish repeatable staging workflow coverage | Provide seeded accounts and sandbox SMTP, AI, PostgreSQL, R2 and video services; promote this matrix into regression coverage for critical paths. | Every release runs access-control, enrollment, submission/recovery, grading and certificate tests in an isolated environment. | Coverage limitations and blocked workflows |

## Screenshot evidence

| Topic | Screenshot | What it shows |
| --- | --- | --- |
| Data loss | [Open](evidence/annotated-draft-loss-desktop.png) | Free task draft erased after a task change. |
| False profile success | [Open](evidence/annotated-profile-clear.png) | Profile saved toast while cleared field remains. |
| Error recovery | [Open](evidence/annotated-loading-error.png) | Simulated 503 leaves Loading without retry. |
| Keyboard focus | [Open](evidence/annotated-signin-focus.png) | Dialog semantics present, but focus moves behind the modal. |
| Certificate integrity | [Open](evidence/certificate-verification.png) | Local nonmember certificate nevertheless shows verified completion. |
| Admissions | [Open](evidence/populated-student_coordinator.png) | Stage folders and invalid/duplicate synthetic registrations. |
| Teacher grading | [Open](evidence/grade-instructor.png) | Stored grade, lateness, code and remarks are presented together. |
| Mobile learner | [Open](evidence/dashboard-student-mobile.png) | Responsive dashboard with actual local task and quiz achievements. |

All screenshots and generated documents use synthetic local data. Annotations were added as temporary browser overlays before capture. Original and annotated images are in [evidence/](evidence/).

## What works end to end, where users get stuck, and what to fix first

Within the tested local scope, a learner can find a free JavaScript course, open its task, run valid web code, submit it, recover from an aborted submit request and find the code in the saved record. A paid learner can submit to an enrolled course, an assigned teacher can grade it, and the learner can see the saved code, grade, gems and remarks. Nonempty profile changes persist. Quiz scoring, event registration/submission/deadlines, feedback approval and staff follow-up replies also reached their verified local outcomes; some used API interactions rather than every browser button. Department assignment/completion and referral discount/enrollment/gem award also persisted locally; populated job card-to-detail navigation passed on desktop/mobile. Delayed double-click submission produced one request and preserved the newly opened task draft. Legacy challenge/hackathon processing works through review/scoring but fails reward correction/deduplication in D-19/D-20. Synthetic certificate and challan records render and verify publicly.

Users get stuck when unsent work disappears, sign-in/refresh drops their location, an unavailable service leaves a permanent loader or grading wait, and the advertised bundle has no valid price/enrollment model. Staff can receive a misleading mailed status, and several write/download permissions are too broad. Certificate eligibility and progress are not governed by one rule.

**Fix private-file authorization first**, then bundle fulfillment and session/resource permissions. Protect drafts, reconcile grading/completion, and make failed requests/email recoverable before polishing secondary layout details. Re-run these failures, then complete the blocked PostgreSQL, SMTP, AI, R2, video and external-service cases in designated staging. Current coverage supports the specific successes above; it does not support a claim that the entire product works correctly.
