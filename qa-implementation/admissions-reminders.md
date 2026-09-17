# Admissions challan reminders — September 2026

## Implemented behavior

Admissions → Registrations & challans → Generate challan now includes **Send automatic payment reminder emails**, checked by default. Each existing challan has an **Email reminders** button showing the calendar, delivery history, an extension-email preview and pause/enable controls. Finance and other department portals do not get these controls. The API uses the existing Admissions/admin authorization gate; the client demo allows viewing but blocks changes and sends.

For a deadline of **25 October**, the schedule is **18, 21, 22, 24, 25 and 26 October**. The worker checks at startup after store hydration and every 15 minutes. Sends begin at **09:00 Asia/Karachi** on scheduled dates. Server operation and a configured transactional mail provider are required. If an outage spans dates, only the latest due step is eligible, with at most one accepted reminder per applicant per Pakistan calendar day. Earlier dates are not replayed when a challan is generated or individually enabled late.

Reminders wait for provider acceptance of the original challan email (or the saved legacy sent timestamp). They stop for paid/enrolled records and skip replaced challans, missing recipients, zero-fee challans and suppressed addresses. Existing challans are not enabled by deployment. The final email invites the applicant to text **0314148929** or email **finance@echolens.digital** to request more time; it does not extend the date automatically. It also tells applicants who already paid to send proof for verification rather than pay twice.

## Persistence and sending

Settings and delivery history live in `registration.status.challan_reminders`, using the existing Prisma JSON field; no schema migration is required. Each deadline/step has its own delivery record. Pausing, resuming, repeat generation and restarts preserve accepted records. A durable claim is saved before contacting the provider, and payment eligibility is checked again immediately before sending.

Explicit provider rejections are retried after an hour, up to three attempts for the current step. Transport timeouts and interrupted claims have an unknown delivery outcome and are not automatically replayed. An accepted message whose final persistence fails remains accepted in memory; its previously persisted claim protects a restart from repeating the send. Admissions can see delivery uncertainty and inspect the provider's logs. Provider acceptance is not proof of inbox delivery.

The scheduler uses the LMS's existing single store-writer process and shared in-process sweep guard. It is not a distributed queue for multiple independent LMS writers. Sends are sequential, paced, capped by `TRANSACTIONAL_MAX_PER_RUN` (default 20), and stop on sender blocking/rate limits or three consecutive failures. Later checks continue remaining applicants. Scheduled work is disabled in the demo and test environments.

Configuration: existing transactional ZeptoMail/SMTP settings and `FINANCE_EMAIL`; optional `ADMISSIONS_EXTENSION_PHONE` defaults to the exact number supplied in this request, `0314148929`. No live emails were sent during testing.

## Verification

Validation completed: the 107-test local regression run passed, followed by all 11 focused Admissions checks (including two additional persistence/cap checks). Three browser scenarios passed. The legacy external-Postgres `test/talent.test.js` was excluded from the local regression command, as it requires a separate disposable database; the local Talent/schema/demo tests passed.

- Calendar tests cover all six dates, Pakistan midnight/09:00 boundaries, month/year changes and invalid/leap dates.
- Delivery tests cover restarts, overlapping checks, pause/resume, later enablement, downtime, draft/paid/enrolled/replaced/suppressed records, payment during a persistence wait, failed storage, uncertain acknowledgement, bounded retries and per-run caps.
- Reminder settings and provider history round-trip through the production Prisma registration JSON mapping.
- HTTP tests use the actual server with a simulated clock and captured mail: Admissions creates a challan, sends its original email, receives one reminder, pauses/resumes, and Finance verifies payment and stops all subsequent steps. Unauthorized roles cannot view/change the reminder endpoint, and public challan verification does not expose reminder/provider metadata.
- Desktop and mobile browser checks verify the default checkbox, exact six dates, extension preview and pause action. A Finance browser confirms these controls are absent. Viewing/configuring the UI sends no messages.

Run `node --test test/admissions-reminders*.test.js` and `node qa-implementation/admissions-reminders-browser.cjs`. Browser evidence: [results](evidence/admissions-reminders-browser-results.json), [desktop generation](evidence/admissions-reminders-generate-1440.png), [mobile generation](evidence/admissions-reminders-generate-390.png), [desktop schedule](evidence/admissions-reminders-schedule-1440.png), [mobile schedule](evidence/admissions-reminders-schedule-390.png). Production deployment and actual provider delivery must be checked separately.
