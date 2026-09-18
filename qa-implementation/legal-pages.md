# Legal and informational pages — implementation and owner review

Branch: `feat/legal-pages`. Local changes; not deployed. Audit performed before writing page content, and findings reported in the conversation. Revision date: 18 September 2026.

## Created and changed files

- `legal-pages.js`: server-rendered `/privacy-policy`, `/terms`, `/about`, `/contact`, `/cookie-policy`; `/privacy` remains a 200 alias. Each page has a unique title, description, canonical URL and visible last-updated date. Content distinguishes supported optional integrations from confirmed live services and marks missing facts.
- `public-footer.js`, `public/css/public-footer.css`, `scripts/sync-public-footer.cjs`: shared Home-style navy footer with existing public destinations and Company & Legal links. Static public HTML footers and `coursepages.js` use it. Regenerate with `node scripts/sync-public-footer.cjs` after editing footer or legal content; this also updates the legacy `public/privacy.html` copy.
- `public/css/legal-pages.css`, `public/js/contact.js`: responsive card layout and real support-ticket submission with native validation, duplicate-submit prevention, success/private reply link, error handling, and retention of entered text after a failed request.
- `server.js`: only replaces the old privacy route with registration of public information routes. No persistence middleware changes.
- `public/js/public-navigation.js`: existing Login return handling also applies to the shared footer's Login link.
- `public/sitemap.xml`, `PRODUCT_FEATURES.md`: new routes and public capability documentation.
- `scripts/check-links.mjs`: dependency-free read-only crawler for public internal links.
- `test/check-links.test.js`, `test/legal-pages.test.js`, `test/fixtures/legal-pages-server.cjs`: meaningful HTTP/crawler tests using an isolated temporary JSON runtime and disabled external mail/AI/database configuration.
- `qa-implementation/legal-pages-browser.cjs`: browser verification using the already-installed audit Playwright/Chrome helper; adds no dependency.
- `qa-implementation/evidence/legal-pages/`: desktop/mobile screenshots and browser results.

The generated footer files are `public/landing.html`, `open.html`, `compiler.html`, `login.html`, `reset-password.html`, `registration-status.html`, `privacy.html`, `recruiter-signup.html`, `showcase.html`, `showcase-post.html`, `talent-search.html`, `talent-profile.html`, `talent-project.html`, `talent-projects.html`, `talent-interest.html`, and `profile.html`.

No store/flush modules, Prisma schema, migrations, dependencies, real `.env`, or production data were changed. No new environment variables are required.

## Facts found before drafting

| Fact | Evidence | Limits |
| --- | --- | --- |
| Legal name: EchoLens (SMC-Private) Limited | `contract-pdf.js:22`, original `public/open.html` footer | Repo fact; registration was not checked externally. Template permits a legal-name environment override; real `.env` was not inspected. |
| Country: Pakistan | `contract-pdf.js:41`, Home Organization structured data | Country of incorporation stated in template; not a full address or an approved learner jurisdiction. |
| Registration/tax references exist | `contract-pdf.js:32` | Not added to public pages as verified registration claims. |
| Public email: info@echolens.digital | Home structured data/footer, `coursepages.js` | Email delivery/mailbox ownership not independently verified. |
| Public WhatsApp: 0314 1479109 | Home/footer `https://wa.me/923141479109` | Separate from the admissions extension number. |
| Finance/admissions emails | `mailer.js`, `server.js`, `.env.example` | Production provider configuration not inspected. |
| Aim to resolve tickets within 24–48 hours | `server.js` POST `/api/public/support-tickets`, existing Open support copy | An aim, not a response-time guarantee. |
| Full address and founding date | No substantiating fact found | Explicit placeholders. Copyright year is not a founding date. |
| Refunds and learner governing law | No learner policy found; `contract-pdf.js` contains employment/ambassador provisions | Employment provisions not copied into learner terms. |

### Personal data inventory

The normalized models in root `schema.prisma`, auth and API code in `server.js`, profile/onboarding UI in `public/js/dashboard.js`, and Talent/Showcase modules were read without changes.

- **Identity/contact/education:** name, role, username, email, registration number, Google subject identifier; flexible profile fields for phone/WhatsApp, address/city, date of birth, gender, CNIC/B-form, guardian/father and emergency contacts, school/institute/university, education/degree/program/study year, career goal and optional marketing consent. Staff profiles can include expertise, experience, joining dates and office hours.
- **Authentication/security:** bcrypt password hashes, session/version data, account status/reasons/approvals, temporary verification/reset credentials. Reset tokens are in memory with a 30-minute expiration; email verification codes have a 10-minute expiration. IP-based rate limiting is in memory; analytics/provider technical data is distinct from Prisma fields.
- **Admissions/financial:** registration identity/contact, course/referral/notes/admin notes, status/payment-stage and verification records; challans, fees/discounts/deadlines, organizational bank snapshots, payment proofs/references and financial operational records. Staff onboarding supports bank/payout evidence. No integrated card gateway identified.
- **Uploads:** avatars, signatures, resumes, Talent/Showcase project images, course evidence/source/output/documents, task/department attachments, contract submission archives and identity/qualification/bank supporting documents where requested.
- **Learning/activity:** enrollments and deadlines, last-opened/activity timestamps, course/module progress, submissions/code/language/output/evidence/notes/history, quiz responses/scores, grades/instructor feedback/AI reports, integrity and sanitized compiler/keyboard/editor activity, attendance/session joins/minutes/last seen, gems/badges/streaks/certificates.
- **Communications:** support names/emails/messages/context/private token links/replies/resolutions, course/event/job chats/comments/mentions/read state, public feedback and moderation, announcements and task completion evidence.
- **Employment/operations:** staff position/group/employment status/joining dates/follow-ups/contracts/offers/onboarding records; department membership/tasks; ambassador identity/university/referral codes, duties, gems/commission reports and attributed registrations.
- **Recruitment:** student descriptions/handles, skills/education/experience, social/repository links, city/remote/work/availability/salary visibility preferences, resume files and projects; recruiter company/work email/domain/website/size/designation/city/notes/status; shortlists, contact requests/acceptances/reveals, messages, blocks/reports, search filters/result counts and audits.
- **Technical/provider data:** request/IP rate limiting, browser/device/referrer/page-usage/interaction analytics, plus connection/request data received by external hosting/media/font/CDN services. No general persistent Prisma IP-address field was inferred.

Public learner URLs expose selected name/course/gamification data when the URL is known. Certificates expose public authenticity and learner/course details. Talent publishing is opt-in; private email/phone/resume disclosure requires accepting the individual recruiter's contact request. Talent reveal audits survive unpublishing. Showcase publication exposes chosen project content. The original `/privacy` learner-profile wording was corrected accordingly.

### Exact external-service inventory

This is an inventory of integrations and external recipients, not a legal assertion that every vendor is a processor in every context or that every optional provider is active.

| Vendor/service | Role | Code/config evidence | Live status |
| --- | --- | --- | --- |
| Render | App hosting and persistent disk/private upload directory | `server.js` production detection, `.env.example`, README deployment | Render hosting in task context; region unverified. |
| PostgreSQL provider: Render Postgres / Supabase unresolved | Database hosting | `.env.example` references Render Postgres; `db-guard.js` and root schema describe Supabase | **GAP:** confirm actual provider/region without connecting to production. |
| Google OAuth | Optional external sign-in; identifier/name/email | `server.js` Google OAuth routes, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Configurable. |
| Zoho ZeptoMail | Transactional mail API / example SMTP | `mailer.js`, `ZEPTO_SEND_MAIL_TOKEN`, `SMTP_HOST=smtp.zeptomail.com` in example | Configurable. |
| Configured SMTP vendor | Transactional fallback | `SMTP_HOST` and Nodemailer | **GAP:** name any non-ZeptoMail fallback. Historical Gmail comments are not proof of use. |
| Brevo | Bulk/outreach REST email | `mail-provider.js`, `BREVO_API_KEY`, `MAIL_DRY_RUN` | Configurable; dry-run default. |
| Groq | AI prompts/assessment/work context | `ai.js`, `GROQ_API_KEY` | Configurable. |
| Google Gemini | AI prompts/assessment/work context | `ai.js`, `GEMINI_API_KEY` | Configurable/fallback. |
| 8x8 JaaS | Live-class service | `jaas.js`, `JAAS_*` | Configurable. |
| Jitsi Meet (`meet.jit.si`) | Live-class fallback | `jaas.js`, server live-class configuration | Used if JaaS is unavailable and a class is opened. |
| Google YouTube | Embedded video delivery | `public/js/open.js` privacy-enhanced player | Course/content dependent. |
| Google Analytics 4 | Usage analytics | Google tag `G-JPPLHMV7TD` in existing static pages | Embedded in markup; settings/collection not verified in production. |
| Google Fonts | Browser font delivery | Public HTML/Course page font requests | Embedded. |
| Cloudflare R2 | Public Showcase image storage | `r2-upload.js`, `R2_*` | Configurable. AWS SDK is an S3-compatible client, not proof of AWS hosting. |
| Cloudflare cdnjs | Browser/compiler library delivery | Public scripts, `public/js/coderunner.js` | Loaded when the relevant libraries are used. |
| jsDelivr | Pyodide/TypeScript and other browser libraries | `public/js/coderunner.js` | Loaded when the relevant libraries are used. |
| Compiler Explorer (`godbolt.org`) | Remote compilation/execution of code, related files and stdin | `public/js/coderunner.js` native-language path | Active implementation; keyless public API. Deprecated Piston comments were not counted as active use. |
| WhatsApp / Meta | External contact messaging initiated by the visitor | Footer `wa.me` links | Click-out; no embedded WhatsApp tracker found. |

Local JWT/bcrypt sign-in is handled by this app, not an external hosted-auth provider. No Stripe/PayPal-style payment processor or Sentry-style error tracker was identified. GitHub source hosting and arbitrary learner evidence links were not mislabeled as built-in personal-data processors.

### Cookies/storage and routing

- `el_token`: normal session; HttpOnly, SameSite=Lax, production Secure; seven-day maximum. `server.js:271`.
- `el_demo_token`: isolated demo session, same maximum; proxy path `/demo`, separate cookie forwarding and Secure handling. `demo/proxy.js`.
- `el_oauth_state`: Google sign-in state; HttpOnly/Lax, production Secure; ten minutes. `server.js:1766`.
- `el_back`: legacy cookie cleared; no current setter found.
- Google Analytics cookies such as `_ga`/`_ga_*`: vendor/settings-dependent; no app-wide consent interface found. Do not confuse their lifetime with authentication cookies.
- Embedded Google/YouTube/live-meeting services may use provider storage when used. AdSense was not found; advertising disclosures are conditional.
- Local/session storage: filters, registration/sign-up/assessment drafts, editor state and submission-deduplication identifiers, with demo separation.

Express serves `public/` and explicit routes. `/open` is a hash-navigation workflow; `/courses` and its course slugs are server-rendered by `coursepages.js`. Headers share `public-navigation.js`, generated static markup and `public/js/public-navigation.js`. Existing Inter/Fraunces fonts, purple actions, navy footer and white card styling were reused. The footer is now consistent across the public shells listed above.

## Header/footer audit

All original destinations were retained; no dead destination was deleted or replaced by a stub.

| Header item | Target |
| --- | --- |
| Logo / Home | `/` |
| Live Tech Courses | `/open#paid` |
| Free Certified Courses | `/open#free` |
| Events | `/open#events` |
| Announcements | `/open#announcements` |
| Feedback | `/open#feedback` |
| Compiler | `/compiler` |
| FAQ | `/#faq` |
| Login | `/login`, with current page in `returnTo` |
| Get Started | `/open#signup` |

Open's account controls additionally open its sign-in/registration modal or navigate to `/dashboard` / `/dashboard#view=courses`; signed-in profile/sign-out controls are actions, not independent public destination pages.

| Original footer item | Target |
| --- | --- |
| Brand / Main site | `/` |
| Live Tech Courses & Bootcamps / All Courses | `/courses` |
| Free Certified Courses / Free Online Courses | `/open#free` |
| Browser Compiler / Free compiler | `/compiler` |
| Hackathons & Webinars | `/open#events` |
| Verify a Certificate | `/cert` |
| Announcements | `/open#announcements` |
| Feedback | `/open#feedback` |
| Open Portal / Free quests | `/open` |
| Student Login / LMS Portal | `/login` |
| Enroll in a Course | `/open#register` |
| Student Projects | `/talent/projects` |
| For Recruiters | `/recruiter-signup` |
| Privacy | `/privacy` |
| Email icon / address | `mailto:info@echolens.digital` |
| WhatsApp icon / number | `https://wa.me/923141479109` |

The new footer's Company & Legal targets are `/about`, `/contact`, `/privacy-policy`, `/terms`, `/cookie-policy`. Existing Open/course footer URLs are all represented in the shared footer. Mailto and external WhatsApp delivery/account ownership cannot be established by an internal HTTP crawl.

### Findings to review

- **No header/footer HTTP 404s, placeholder destinations or “Coming Soon” links found** in the isolated local audit. All header/footer internal targets returned 200; the public crawl checked **55 URLs with zero HTTP failures**.
- Existing Login content has `<a href="javascript:void(0)" onclick="toggleForgot()">`: the crawler reports a placeholder warning. Browser verification confirms it opens the real forgot-password form. It was retained and not silently changed.
- `/cert` returns 200 but, without `?s=...`, displays “No certificate serial in the link.” It has no standalone serial-entry form. The footer verification link therefore has a workflow gap, even though it is not a 404. It was retained for owner review.
- `/talent/projects` returns its HTML shell with 200. Its API requires PostgreSQL and returns 503 in JSON-only local mode. Production Talent availability still needs verification by the owner; no production database was contacted.
- Course-level staged availability (“Coming soon”) is a product state, not a header/footer placeholder. Those courses were not silently published or removed.
- New vendor-policy HTTP checks returned 200 for Render, Zoho, Google, Brevo, Groq, Cloudflare, jsDelivr and WhatsApp. Compiler Explorer's privacy policy is its real `https://godbolt.org/#privacy` interface, identified from its own homepage, rather than a guessed `/privacy` URL. 8x8's current policy is discoverable on its official site, but automated direct requests returned 429; check that external link manually in a browser. It is not an internal navigation failure.

## Owner GAP checklist

- [ ] Verify the repo's company name/country against actual registration and any configured legal-name override.
- [ ] `COMPANY_ADDRESS`: complete registered business address.
- [ ] `FOUNDING_OR_LAUNCH_DATE`: substantiated start date.
- [ ] `MINIMUM_ACCOUNT_AGE`: actual eligibility rule; clarify whether under-18 learners hold accounts.
- [ ] `PARENTAL_CONSENT_AND_CHILDRENS_DATA_PRACTICE`: actual consent/guardian process and handling of children's data. No age gate/parental workflow was found. School-age learners need explicit review; no COPPA/GDPR compliance claim was added.
- [ ] `DATA_RETENTION_AND_DELETION_POLICY`: periods by record type, backups, disclosure/audit retention, verification and deletion handling. Enrollment expiry is not data deletion.
- [ ] `LEARNER_PAYMENT_CANCELLATION_AND_REFUND_POLICY`: withdrawal/cancellation/refund terms, fees and applicable timelines.
- [ ] `LEARNER_GOVERNING_LAW_AND_DISPUTE_PROCESS`: approved learner jurisdiction/process; employment contracts do not determine it.
- [ ] `APPROVED_LIABILITY_TERMS`: reviewed allocation/limits, without an invented cap.
- [ ] `TERMINATION_AND_APPEAL_TERMS`: approved notice/review process.
- [ ] `DATABASE_HOST_AND_REGION`, `SMTP_PROVIDER`, `ACTIVE_PROCESSORS_AND_LOCATIONS`: verify the exact deployed vendor list, region and any additional providers.
- [ ] `COOKIE_SETTINGS_AND_CONSENT_PRACTICE`: actual analytics settings and planned consent behavior; no consent manager is installed.
- [ ] Before enabling Google ads, decide and implement the applicable consent arrangement. Google requires a certified CMP integrated with TCF for personalized ads to EEA/UK/Switzerland visitors: [Google consent requirements](https://support.google.com/adsense/answer/13554116?hl=en).
- [ ] Review the `/cert` standalone-verification gap and the existing Login JavaScript-action warning.
- [ ] Check real deployment navigation and Talent availability before AdSense submission. Draft placeholders need replacement first; these pages do not guarantee approval.

Advertising disclosures follow [Google's required privacy content](https://support.google.com/adsense/answer/1348695?hl=en), including prior-visit ad cookies and both requested opt-out routes. No ad code or new consent claim was introduced.

## Repeatable verification

```powershell
node scripts/sync-public-footer.cjs
node --test test/legal-pages.test.js test/check-links.test.js
node qa-implementation/legal-pages-browser.cjs
node scripts/check-links.mjs http://127.0.0.1:3000/
# After deployment, run only the read-only crawler against your confirmed public URL:
node scripts/check-links.mjs https://www.echolens.digital/
```

The crawler does not submit forms, execute JavaScript, send cookies or follow API/auth/private-upload paths. It follows public same-origin anchors, reports non-200 final responses/timeouts and placeholder/invalid/missing-fragment warnings, and exits nonzero for failures or warnings. `--max-pages=2000` is the default limit. SPA hash destinations are listed for separate browser verification, not falsely validated as distinct server routes. The default request timeout allows the isolated demo's cold startup. The existing Login action intentionally produces one warning until the owner chooses to change its markup.

Browser checks cover five new pages plus Home, catalogue, free catalogue, compiler and Login at 1440, 390 and 320 pixels: **30 layouts, no horizontal overflow, no JavaScript errors**. Contact creates a ticket and opens the private reply, preserves inputs on a simulated 429, and preserves the Login return destination. The existing password-recovery action was verified functional. External browser requests were blocked during these checks; no real messages or production services were used.

The isolated existing/new test suite passed **130 tests** in **58.6 seconds**, using disabled dotenv loading and cleared provider/database credentials. `test/talent.test.js` was deliberately excluded because it requires a real PostgreSQL server; no real database was used. Existing schema/resilience tests use local PGlite. Syntax checks and `git diff --check` passed. No lint/typecheck tooling was added.

## Release note

Public Privacy, Terms, About, Contact and Cookie pages are available through a consistent footer. Contact uses the existing support system. Confirm all highlighted owner fields and review actual deployed processors before publishing the policies as final or submitting the site for advertising review.
