# EchoLens Digital LMS — Product Feature Catalogue

**Purpose:** This is the maintained feature reference for marketing, demos, onboarding, and release planning. Update this file whenever a product capability, integration, role, or access rule changes.

## Product at a glance

EchoLens is a gamified learning-management and operations platform. It combines a public course and events website, learner accounts, a full student portal, an administrator console, department workspaces, an in-browser coding environment, AI-assisted assessment, certificates, admissions, support tickets, and operational reporting.

## Client demonstration (`/demo`)

- Public demo entry with short, shareable logins for administrator, instructor, student, free learner, academic coordinator, HR, finance, admissions, staff, ambassador, recruiter, and department head portals. Credentials are listed in `DEMO_ACCOUNTS.md`.
- The existing portal screens use isolated, fictional records and the product course catalogue; live users, payments, private files and provider credentials are not loaded.
- Clients can browse, search, open forms and view sample documents. The server blocks mutations, uploads, certificate issuance, password changes and external actions for every demo role, including admin.
- Demo sessions and browser drafts are separate from normal portal sessions. Sample certificates are marked DEMO; AI reports are prewritten examples, and live AI, compiler execution, mail and meetings are disabled.
- Available after deployment, with no new provider credentials or production database accounts required. The demo worker starts on demand and stops after 20 minutes of inactivity.

## Public open web (`/open`)

Visitors can use the open website without an account to:

- Read the Privacy Policy (`/privacy-policy`), Terms (`/terms`), About (`/about`), Contact (`/contact`) and Cookie Policy (`/cookie-policy`) from the shared public footer. Pages use the public navigation and responsive styling, with descriptions and visible revision dates. Contact submits to the existing support-ticket system and offers email/WhatsApp alternatives. `/privacy` remains available with the complete policy. Legal drafts visibly mark owner-confirmation gaps, including the business address, minimum learner age/parental consent, retention, refunds and learner governing law; they are not claims of AdSense approval or regulatory compliance. No new integration or environment variable is required. `node scripts/check-links.mjs <site-url>` checks public internal destinations before review.
- Open the main website Home page (`/`) for the academy introduction, free-versus-paid comparison with a selector, feature icons, inclusion indicators, highlighted paid card and course links, a student portal showcase with six accessible feature tabs, real isolated-demo screenshots, expanded previews, a seven-step learning journey, certificate explanations, course highlights, events and FAQ. Marketing demo links open a student-only entry at `/demo/?portal=student`; the existing client demo retains its role selection. Every public Home button and logo returns to `/`; portal sidebars also provide a Home link. `/open` serves the course, events and learner workflows; older `/open#home` and `/open#compare` links redirect to the main Home page. Catalogue filters and registration drafts survive Back/Forward, and public login links preserve the return destination.
- Browse the public course catalogue, free certified courses, paid courses, specialist tracks, course outlines, modules, lectures, prerequisites, environments, outcomes, capstones, pricing, duration, and availability.
- See total open-web enrollment counts and enrollment counts on free-course cards.
- Read public announcements, events, webinars, hackathons, resources, and feedback highlights.
- Watch course videos inline when a course provides an embeddable video; optional resources and documentation are clearly labelled.
- Preview free-course curriculum and assignment titles before signing in.
- View course and event detail pages, registration information, and public certificate verification pages.
- Register interest in paid courses and receive an admissions receipt or fee-challan follow-up.
- Submit public feedback or an authenticated support ticket, follow the ticket conversation, answer an admin request for information, and receive resolution email notifications.
- Sign up for a free learner account with name, email, WhatsApp/contact, city, university or institute, degree/program, study year, career goal, and marketing-consent preference.

Authenticated learners can use the open site to:

- Enroll in free certified courses (free-account learners and portal students; staff accounts cannot enroll).
- Hold up to two active free courses at once. Each enrollment has a three-calendar-month completion window from the course enrollment date (including existing enrollments). Incomplete enrollments expire automatically; submissions, grades and certificates are preserved. Admin restoration starts a new window.
- Receive transactional free-course reminders after seven days without opening the enrolled course, then weekly while inactive, plus completion reminders every two weeks showing the deadline and days remaining. Completed, manually removed and suppressed recipients do not receive reminders; expired enrollments receive one window-ended notice.
- See a seat confirmation window, course activation status, course progress, module gates, assignment results, capstone status, and certificate eligibility.
- Submit assignments and capstones without leaving the portal.
- View their profile, enrollment history, progress, certificates, and support tickets.

## Learner portal (`/dashboard`)

- Secure sign-in, sessions, password recovery, account reset, role-aware navigation, and profile management.
- Learner dashboard with enrolled courses, progress, grades, module unlocks, deadlines, gems, certificates, announcements, events, and personal activity.
- Free/open-web courses and paid/cohort courses in one learner identity.
- Course modules, lectures, embedded videos, lesson resources, assignments, rubrics, acceptance criteria, submission requirements, and capstones.
- Assignment submission using code, language selection, output/result, notes, HTTPS evidence links, multiple evidence files, and submission history.
- Evidence validation for link format, file type, file count, file size, required notes, duplicate requests, and resubmissions.
- In-browser compiler and workspace with syntax highlighting, language selection, run/execute workflow, test/output panel, formatting/error feedback, and assignment-aware context.
- Copy/paste restrictions in the protected assignment compiler where enabled.
- Keyboard and editor telemetry such as time spent, run count, attempts, help usage, and interaction events; telemetry is sanitized and used for activity reporting rather than trusted as a grade.
- AI help and activity reports for learner work where enabled.
- Manual-review workflow for evidence-based assignments and capstones.
- Assignment grades shown as percentages and course marks shown using the configured marks/weighting.
- Course completion rules, per-assessment thresholds, 60% assignment plus 40% capstone weighting for specialist tracks, and verified certificate gating.
- Downloadable/verified certificates with public serial verification.
- Support ticket submission, status, admin replies, learner replies, resolution history, and email notifications.
- Personal profile and education/lead information used for support and future opportunities.

## Admin and staff portal

### Admin overview and reporting

- Operational dashboard with users, courses, cohorts, registrations, revenue, events, feedback, tickets, jobs, mail, and system health.
- Free-course progress report for every open course: enrollment count, lectures covered, total course coverage, completed learners, completion percentage, and certificates generated.
- Student roster and enrollment search with progress and account details.
- Admin activity/system logs, backup/flush health, and service capability status.
- Public catalogue and course management, course pricing, availability, staged-course release controls, and catalogue validation.

### Course, assessment, and certification administration

- Create and manage courses, batches, modules, lessons, quests, assignments, rubrics, expected outputs, resources, prerequisites, and environments.
- Manage free open-web tracks and manually enroll eligible learners. Enroll or remove an existing learner by email from Admin > Free-course students; restore removed enrollments with a fresh three-month window, inspect deadlines and last-opened timestamps, and preserve existing work. Duplicate learner emails require resolution before changes. Admin enrollment/removal and automatic expiry are audited.
- Review assignment and capstone evidence in an admin queue, provide feedback, award grades, and preserve submission history.
- Review AI grading context and reports; automated grading does not issue certificates when evidence requires manual verification.
- Manage certificate issuance, public verification, partner/co-brand data, and certificate records.
- Admin-only manual certificate override in the portal: issue to an enrolled learner without track submissions or completion, or include all enrolled learners in bulk issuance. Completion remains the default requirement; overrides are audited and do not change submissions, grades, or course progress.

### Admissions, finance, and registrations

- Paid-course registration intake with contact, city, WhatsApp, course, referral, and notes.
- Registration receipts, private status links, challans, payment-stage tracking, payment confirmation, and enrollment activation.
- Admissions-only automatic challan reminder controls: new challans default to follow-up emails 7, 4, 3 and 1 day before the deadline, on the deadline, and the next day. Checks begin at 9:00 AM Pakistan time; reminders start after the original challan email is accepted and stop after payment verification or enrollment.
- Admissions can preview the extension email, inspect scheduled dates and delivery history, and pause or enable reminders per challan. Existing challans require individual enablement; earlier dates are skipped and an outage sends only the latest due reminder. The overdue email invites an extension request by text to `0314148929` or email to `finance@echolens.digital`, without changing the deadline automatically.
- Admissions notifications for new registrations and payment-confirmed enrollments.
- Finance views for fees, estimated revenue, invoices/challans, expenses, and payment records.

### Support and communications

- Admin support-ticket queue with private ticket threads, request-more-information replies, learner responses, resolution, and automatic email updates.
- Feedback moderation, replies, deletion, public announcements, event announcements, and targeted learner notifications.
- Transactional email delivery for OTP, welcome messages, password reset, enrollment confirmation, grades, certificates, support, registrations, and operational alerts.
- Admissions challan follow-ups use the transactional email provider and persistent delivery records. Optional `ADMISSIONS_EXTENSION_PHONE` changes the extension contact number; the existing `FINANCE_EMAIL` supplies the contact email. Reminder controls are restricted to Admissions and authorized admins; demo accounts cannot send or change reminders.
- Free-course reminder checks run hourly with persistent delivery claims, a 20-attempt run cap, suppression checks, a per-course 24-hour cooldown and failure protection. Uncertain delivery outcomes are not blindly retried. Expiry is enforced even without a mail provider; demo sessions never send reminders or record course opens.
- Daily free open-web enrollment digest instead of one email per free enrollment.
- Immediate paid-course/admissions enrollment and payment notifications.

## Department workspaces

Departments are isolated by role and permissions. HR/admin can manage departments; a named department head can manage their own department.

- Department creation, editing, head assignment, member roster, membership changes, and access controls.
- Department announcements delivered in the portal and by email.
- Department tasks assigned to all members, a scope, or an individual member.
- Task descriptions, attachments, completion status, member progress, and completion evidence.
- Department-level views for HR, Finance, Admissions/Student Coordinator, Teachers/Instructors, Ambassadors, and other configured teams.
- HR staff records, onboarding, leave/people operations, contracts, offers, and staff management.
- Finance-only fee, payment, expense, and revenue workflows.
- Admissions/student-coordinator workflows for registrations, batches, student rosters, and enrollment support.
- Ambassador/referral accounts, duties, commission/gem reporting, and referral attribution.

## Instructor and teaching tools

- Batch and cohort management, sessions, attendance, lessons, quizzes, assignments, resources, and student rosters.
- Teacher grading, feedback, deadlines, submission review, and course announcements.
- AI-assisted draft questions, rubric-aware review, expected-output parsing, and teacher-controlled publication of AI-generated content.
- Course chat and learner communication with permission-scoped access.

## Compiler, AI, and telemetry

- Standalone compiler page plus course-integrated compiler workspace.
- Multiple programming-language modes and typed/editor workflows where the course enables them.
- Code execution, output capture, test/result display, assignment context, expected output, and retry support.
- Protected assignment mode with configurable paste restrictions and visible formatting/syntax errors.
- AI copilot for learner questions and course work where configured.
- AI grading worker with rubric, problem brief, learner solution, expected output, sample input, and captured result context.
- Manual review fallback when AI/grading infrastructure is unavailable or evidence cannot be verified.
- Sanitized learner telemetry including work time, run count, help count, attempts, and interaction metrics.
- Activity reports summarize work patterns without treating browser telemetry as authoritative grading evidence.
- AI, compiler, and grading capabilities are reported in system health and can be disabled independently.

## Integrations and infrastructure

- PostgreSQL through Prisma/PG adapter for production persistence, migrations, JSON profile/evidence data, and durable records.
- Admin flush health and failure alerts retain the complete Prisma error message, code and metadata. Failed-flush record dumps recursively redact sensitive fields; replay validation rejects redacted placeholders until original values are restored from a trusted source.
- PostgreSQL flushes prepare their row diff and conversions from a frozen snapshot before opening the transaction. Admin-only flush diagnostics expose pending counts, preparation/database timings and masked failed-dump inspection; optional `FLUSH_DISABLED=true` pauses flushing without advancing the persisted baseline.
- Startup installs the supplemental Talent Marketplace schema before accepting requests. Talent route failures return request errors without terminating the LMS or interrupting certificate services for learners and authorized staff.
- Local JSON store/test mode for development and QA, with backup and persistence utilities.
- ZeptoMail HTTPS Send Mail API for transactional email; SMTP fallback is supported through Nodemailer.
- Brevo HTTP API path for bulk/outreach email, with dry-run defaults, suppression handling, batching, pacing, and circuit-breaker protection.
- YouTube/privacy-enhanced embedded players for inline course videos and optional deep dives.
- AWS S3-compatible object storage for private course files, submission evidence, department attachments, resumes, and other uploads.
- PDF generation and parsing for certificates, contracts, challans, reports, and uploaded documents.
- DOCX and spreadsheet text extraction for readable submission/evidence processing.
- QR-code and public serial verification for certificates.
- JWT/cookie sessions, bcrypt password hashing, role-based authorization, staff/department gates, upload validation, private-file access controls, and rate-limited mail paths.
- Render deployment with environment-driven configuration and GitHub source control.

## Access and privacy rules

- Anonymous visitors may browse public catalogue/content and submit permitted public forms.
- Free learners and portal students can enroll in free courses and submit course work.
- Staff accounts cannot self-enroll in free learner courses.
- Paid-course registration is separate from free-course enrollment and is handled by Admissions/Finance.
- Private submissions, evidence files, support tickets, identity data, payment files, and department content are visible only to the learner and authorized staff.
- Public certificate verification exposes certificate authenticity data, not private submission evidence.
- Marketing consent is optional and stored separately from required learner profile data.

## Marketing claims to verify before publishing

Before using a feature in advertising, confirm that the relevant environment variable, provider account, sender domain, AI provider, video URLs, and storage service are configured in production. Do not claim that a capability is active solely because its code exists.

## Feature maintenance checklist

When adding or changing a feature:

1. Update the appropriate section in this file.
2. Record affected roles: anonymous, learner, student, instructor, admin, HR, finance, admissions, or department head.
3. Record whether it is public, portal-only, admin-only, or department-scoped.
4. Document any new environment variables or third-party integration.
5. Add or update API/UI tests and the QA implementation reports.
6. Update screenshots, marketing copy, and release notes when the user-visible behavior changes.
7. Verify production configuration before publishing the claim.
