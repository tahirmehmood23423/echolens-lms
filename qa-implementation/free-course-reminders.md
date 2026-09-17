# Free certified course reminders and enrollment lifecycle

Free/student learner accounts retain up to two active free courses. Each new enrollment expires exactly three calendar months after its course enrollment timestamp, clamping month-end dates (31 January to 30 April) and parsing stored bare timestamps as UTC. Completed courses remain available. Existing incomplete enrollments use their original enrollment date, so old records may already be expired at deployment. Undated legacy enrollments receive a three-month window from their first lifecycle check, with the original missing/invalid timestamp retained and initialization audited. Account creation dates and paid-cohort enrollments are unchanged.

## Email schedule
- At least seven days without opening an active course: inactivity reminder, repeated weekly while inactive.
- Every fourteen days from course enrollment: completion reminder with deadline in Pakistan time and current days remaining.
- Expired incomplete enrollment: one window-ended notice. Work, grades and certificates are preserved.
- Completion, admin removal and suppression stop normal reminders. Demo sessions do not send mail or record opens.
- When reminders coincide, completion takes priority and the course has a 24-hour mail-attempt cooldown. An outage skips earlier intervals rather than sending every missed reminder. Latest failed messages may retry up to three attempts; accepted, claimed or uncertain messages are never blindly resent.

The service starts after persistence initialization, checks hourly and attempts at most 20 messages per run. It persists each delivery claim before contacting the existing transactional mail provider, obeys suppressions and stops a run after three failures or a provider block. Expiry runs even when mail is unavailable. Access and submission gates also enforce expiry between scheduled checks. No schema migration or new provider/environment setting is required; enrollment metadata persists in the existing JSON profile in both PostgreSQL and JSON modes.

## Portal controls
Admin > Free-course students > Manage enrollment by email. Choose a free course and enter the existing learner's email. Enroll creates/restores access and a new three-month window, while an already-active enrollment keeps its original deadline. Remove asks for confirmation and preserves work. Existing Add students remains available to create accounts or enroll several learners. Staff and duplicate learner-email matches are rejected. Admin operations and automatic expiry are audited. Rosters show deadline and last opened date. Learners see days remaining and a support action after removal/expiry.

Opening an enrolled course, restoring a course/lesson route or opening its practice/video view records the course-specific activity (browser requests are throttled to 30 minutes). Successful submissions also update it. Reading the public catalogue or opening a different course does not reset inactivity. Server activity endpoints can change only the authenticated learner's active free course.

## Implementation
New: free-course-policy.js, free-course-reminders.js, scripts/send-free-course-reminder-samples.cjs, test/free-course-reminders.test.js, test/free-course-reminders-api.test.js, test/fixtures/free-course-reminders-server.cjs, qa-implementation/free-course-reminders-browser.cjs, this report and QA evidence.
Changed: store.js, server.js, public/js/open.js, public/js/dashboard.js, public/open.html, public/dashboard.html, PRODUCT_FEATURES.md, test/free-enrollment.test.js.

## Verification
45 focused enrollment, pacing, admin, reminder API/service and twelve-role demo tests passed. Additional tombstone/restoration and undated-legacy regressions passed, confirming that historical submissions cannot silently reactivate a removed seat or reset grades. API checks cover role restrictions, email normalization, bad/unknown/staff email, idempotency, exact expiry boundary, lesson gating, suppressed mail, activity scope, restoration and audit records. Pure/service tests cover calendar month-end, inactivity, repeat protection, fortnight periods, remaining-time copy, completed users, unavailable mail, persistence failure, uncertain delivery, caps and concurrent runs. Real browser checks at 1440 and 390 cover admin enroll/remove/restore by email, roster deadlines, learner deadline notes, support navigation after removal, actual course-open recording, no JavaScript errors or horizontal page overflow. All use temporary fictional stores with dotenv disabled and providers stubbed. No live learner or database records were changed during testing.

## CEO samples
Three fictional samples (inactivity, completion and expiry) are prepared in evidence/free-course-reminder-samples.json. User supplied ceo@echolens.digtial; confirmation of the intended recipient is pending, so no samples have been sent. The explicit sample sender loads only transactional-mail settings, never imports store/server/database, and records provider acceptance separately from inbox delivery.

Prepare: node scripts/send-free-course-reminder-samples.cjs
Send after recipient confirmation: node scripts/send-free-course-reminder-samples.cjs --to <confirmed-email> --send

## Deployment
Deploy the pushed v8-test commit to activate the service. Confirm transactional mail configuration and consider the immediate impact on already-old incomplete enrollments. Production execution was not triggered locally. Unknown delivery outcomes remain recorded rather than risking duplicate mail; provider acceptance is not proof of inbox delivery.
