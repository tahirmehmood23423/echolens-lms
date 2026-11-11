# EchoLens backend audit — 11 November 2026

Branch `v8-test` at commit `18f23c4`. This report says what works, what does not, and what to fix first.

## Verdict

The core pipelines work. A learner can register, pay, be enrolled, learn, be graded and receive a certificate without any step failing or duplicating. No request crashed the server.

Ten things need fixing. Two are worth doing before the next deploy: the outdated dependencies and the logout that does not end the session.

## How this was tested

Everything ran on an isolated local copy with synthetic accounts and a fresh JSON data store. The production database and the real mailbox were never touched: `.env` loading was disabled for every run.

| Check | Size | Result |
|---|---|---|
| Unit tests (`npm test`, run serially) | 171 tests | 167 pass, 3 fail, 1 skipped |
| Auth, role and security checks | 25 checks | 22 pass, 3 findings |
| End-to-end pipeline checks | about 60 checks | all pass except one finding (#7 below) |
| Crash scan: every GET route as 12 roles | 1,680 requests over 140 routes | no 5xx, no stack traces, nothing slower than 1.5 s |
| Stored-XSS probe | 45 dashboard views in 5 roles | nothing executed |
| Dependency audit (`npm audit --omit=dev`) | production packages | 21 vulnerabilities |

**Not tested, because the local copy has no credentials for them:** real email delivery, AI grading, PostgreSQL persistence, Google sign-in, R2 file storage and live classes. The talent test suite needs PostgreSQL and did not run. Treat those areas as unverified, not as passing.

## What works

### Paid admission pipeline

| Step | Result |
|---|---|
| Public registration | Saved; returns a private receipt link |
| Bad input | Unknown course, bad email, short phone number and the disabled bundle are all rejected with a clear message |
| Duplicate registration | Same email and course returns the existing record, including with different letter case |
| Admissions generates challan | Correct fee (PKR 12,500 for SC-01), PDF renders, public verification works, repeat call does not create a second challan |
| Sending the challan with mail off | Returns an error and does **not** mark the challan as sent |
| Finance clears payment | Works; Admissions cannot clear; repeat call is harmless; balance sheet shows the income |
| Enrolment | Blocked before payment; creates one student account and one enrolment; repeat call is harmless |
| New student signs in | Works |

### Learning, grading and certificates

- A student sees their levels and tasks. Solutions and rubrics are not sent to students.
- Locked levels refuse submissions. Students outside the course cannot submit. Empty submissions are rejected.
- The teacher sees the submission and can grade it. A student cannot grade their own work.
- Grades outside 0–100 are clamped. Regrading does not award gems twice.
- A certificate cannot be issued to a non-member or to a learner who has not finished. Admin override works. Public verification and the share image render. A made-up serial returns 404.

### Free courses

- 19 free courses are published. Enrolment needs sign-in, staff cannot enrol, and enrolling twice is harmless.
- Lesson content stays locked until the seat is confirmed (one hour, by design).
- Progress reports correctly and unknown courses return 404.

### Security fixes from the September audit that still hold

- Private uploads: only the course member and assigned teacher can download; others get 403, signed-out users 401.
- Gems cannot be awarded to a non-member.
- A quiz cannot be created in a batch other than the one in the URL.
- Changing a password ends the other sessions.
- Students cannot read other batches, other students' records, or call admin routes.
- Malformed JSON returns 400 and a body over 1 MB returns 413, both as JSON.

## What needs fixing

| # | Priority | Problem | Where | Fix |
|---|---|---|---|---|
| 1 | High | 21 known vulnerabilities in production packages: 1 critical, 13 high, 7 moderate. Affected packages include `multer`, `nodemailer`, `body-parser`, `sharp` and `qs`. | `package.json` | Run `npm audit fix`, then rerun the tests. Review anything that still needs `--force` by hand. |
| 2 | High | Logging out only clears the browser cookie. The token itself keeps working for up to 7 days, so a copied or stolen token survives logout. | `server.js:488` | Bump the user's session version on logout, the same mechanism password change already uses. |
| 3 | Medium | Password change accepts `12345678`. Only the length is checked. | `server.js:565` | Reject common passwords and all-digit passwords; apply the same rule to reset. |
| 4 | Medium | The dataset fetcher checks that the first address is public, then follows redirects without rechecking. A redirect can reach internal addresses. Signed-in users only. | `server.js:4009` | Use `redirect: 'manual'` and validate each hop, or refuse redirects. |
| 5 | Medium | `/api/hr/users-lite` returns every staff member's name, role and email to ambassadors and recruiters, who are outside the organisation. | `server.js:1269` | Limit it to admin, HR and department heads. |
| 6 | Medium | Two legal-page tests fail: `/privacy.html` returns 404, and the privacy policy no longer contains the placeholder text the test expects. | `test/legal-pages.test.js`, `legal-pages.js` | Decide which is right. Either restore the route and placeholders, or update the test if the policy text was filled in on purpose. |
| 7 | Low | Registration rejects an email with a trailing space ("Enter a valid email address") instead of trimming it. Phone keyboards often add that space. | `server.js:4173` | Trim the email before validating. |
| 8 | Low | Five tests that boot a server time out when `npm test` runs files in parallel. They pass when run serially. | `test/`, `package.json` | Set `--test-concurrency=1` in the `test` script, or raise the 20-second ready timeout. |
| 9 | Low | Unknown `/api/...` paths return Express's HTML error page, not JSON. | `server.js:5558` | Add a JSON 404 handler for `/api` before the error handler. |
| 10 | Low | Responses carry `X-Powered-By: Express`, there is no Content-Security-Policy, and static files are served with `max-age=0`. | `server.js:199` | Disable the header, add long caching for versioned assets, and plan a CSP. |

Fixed during this pass: a stray `?` in the admin health check text (`server.js:589`) and on the landing page banner.

## Limits to keep in mind

- **Rate limits and login throttling are held in memory.** They reset on every restart and would not be shared if the app ever ran as more than one instance.
- **The app must run as a single instance.** The data layer keeps state in the process and flushes it to PostgreSQL.
- **Uploads go to the local disk.** That is only durable if the host has a persistent disk mounted.
- **No password recovery without mail.** With no mail provider configured, forgot-password returns 503. This is correct behaviour, but it means a mail outage locks learners out.

## Recommended order

1. Update the dependencies (finding 1) and rerun the tests.
2. Make logout end the session (finding 2).
3. Close the three medium findings in code (3, 4, 5).
4. Settle the legal-page tests (6) so the suite is green.
5. Then, on a staging environment with real credentials, verify the areas this audit could not reach: email delivery, AI grading, PostgreSQL and Google sign-in.
