# Client demo accounts — September 2026

Implemented `/demo` on the existing website, as requested. Public credentials are in [DEMO_ACCOUNTS.md](../DEMO_ACCOUNTS.md). The feature must be deployed before clients can use that URL.

## Behavior and boundaries

- All 12 accounts use password `admin`: admin, teacher, student, free, coord, hr, finance, admit, staff, amb, recruit, head. The head account uses the existing staff role plus a named department-head assignment.
- The actual server and portal UI run in a separate process with fresh fictional users, enrolled courses, assessments, feedback, certificates, support threads, departments, tasks, contracts, admissions records, finance records, jobs and Talent Marketplace activity. The curriculum comes from the repository's catalogue. Sample reports and certificates are explicitly marked as demonstrations.
- The proxy and worker both reject every mutation except demo login/logout. This includes direct API requests, uploads, resets, certificate overrides, finance updates, messages, AI calls and code execution. Side-effecting GET routes (OAuth, dataset fetching, full backups, meeting joins/tokens) are blocked too.
- The worker clears its environment before loading any app code, suppresses dotenv, generates a new signing secret, and uses only new temporary storage. Normal cookies and authorization headers are never forwarded. `el_demo_token` is scoped to `/demo`; normal `el_token` sessions remain separate.
- Responses and client-generated URLs stay under `/demo`. Demo drafts and browser preferences have a separate storage prefix. The banner links back to the account chooser and explicitly exits to the main website. Responses are not cached or indexed.
- The JSON object is recursively frozen and persistence throws after seeding. Talent queries run in a separate PGlite database with `default_transaction_read_only=on`. Activity updates, grading workers, certificate repair, notifications, backup jobs and Talent write-on-search logging are disabled.
- The checked-in database archive contains schema, migration checksums and skill vocabulary only. It avoids running initdb in the deployed web process. PGlite uses temporary disk storage, 8 MB shared buffers and a worker JS heap limit of 96 MB. Local Windows worker RSS after seeding measured approximately **159 MB**, down from **668 MB** with default in-memory initialization; production memory remains environment-dependent.
- A single lazily started worker is shared by clients and stopped after 20 minutes idle. A restart recreates the sample accounts and invalidates old demo sessions. No production schema/account setup is required. Rebuild the empty schema archive with `npm run demo:schema` when upgrading the pinned database engine or Talent migrations.

## Verification

- **98 local automated tests passed**, including 15 demo checks and the normal certificate, enrollment, grading, migration and privacy regressions. The legacy `test/talent.test.js` needs a separate disposable external Postgres database and was not run; Talent demo reads and schema tests used PGlite.
- All 12 credentials sign in with the expected role. Role-specific API reads cover courses, grades, certificates, free-course progress, departments, admissions, finance, HR, staff, ambassadors, search, portfolios, shortlists and recruiting conversations.
- Every role was tested against blocked writes and dangerous GETs. Store-file content and a digest of both LMS and Talent records remained identical after browsing, logins and write attempts.
- The existing-website proxy test verifies both directions of session isolation, canonical URL casing, rewriting, blocked multipart uploads, and preservation of the normal user's session after demo logout. The parent's certificate and mail records remain unchanged.
- Browser QA checks all 12 accounts on desktop and admin/student on mobile, visits every visible navigation item, and verifies that no same-origin request escapes `/demo`. There are no browser exceptions or unexpected API failures. Admin certificate forms open on desktop/mobile, but even the incomplete-track override is rejected with the read-only explanation.
- Browser evidence: [results](evidence/demo-browser-results.json), [mobile entry](evidence/demo-landing-mobile.png), [admin form](evidence/demo-admin-desktop.png), [mobile admin form](evidence/demo-admin-mobile.png), [finance](evidence/demo-finance-desktop.png), [department head](evidence/demo-head-desktop.png), [recruiter](evidence/demo-recruit-desktop.png).

Run API checks with `node --test test/demo.test.js`. Run browser checks with `node qa-implementation/demo-browser.cjs` (local Chrome/Playwright required). Both create synthetic test servers; neither loads `.env` or uses production services.

## Limits of the demo

Clients can inspect workflows and sample outcomes, but cannot perform writes or invoke external integrations. The demo does not establish whether production AI, email, storage, video or payment configuration is active. Production deployment and the public URL must be verified separately before sharing credentials as live.
