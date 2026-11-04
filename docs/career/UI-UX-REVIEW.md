# Career experience review and validation

## Scope and implementation

The starting point is remote `v8-test` at `b779ab4`. Work is on the local
`codex/career-integrity-ux` branch. Security, grading, persistence and dependency
corrections are in the first commit; presentation and browser tooling are in a
separate commit. No push, merge, deployment or production-data mutation occurred.

## UI/UX findings and delivered changes

| Screen | Finding | Implemented improvement |
|---|---|---|
| Welcome | Broad introduction did not explain the whole journey | Clear career/skills/future message; existing beginner reassurance, one-question steps, skip and saved progress retained |
| Career catalogue | Limited context, generic cards, no side-by-side comparison | Compact white/teal cards with career-specific SVGs, core tools, role counts, starting point, suggested markers, working search/filters and comparison of up to three careers |
| Role | Long checklists and no persistent target selection | Saved target role, explicit required prerequisites, collapsible optional requirements and a direct route into the career workspace |
| Subtrack | Learning outline and assessment entry competed in one long page | Separate “I already know this” and beginner-learning choices; accurate content-preparation notice; collapsible module outlines; qualified evidence shown separately from latest retake results |
| Assessment | Distracting site navigation, no review flag or visible save failure | Focused exam layout, readable highlighted snippets, four answer cards, keyboard operation, flagging, question overview, live save state, failure/retry, local draft recovery and confirmation before submission |
| Results | Too many undifferentiated scores and weak next action | Clear outcome, coverage, demonstrated strengths, critical gaps, encouraging review guidance and a prominent real next step |
| Career workspace | Separate assessment systems were confusing | Canonical knowledge checkpoints now appear in the workspace, shared skill report, learning plan and combined attempt history |
| Student dashboard | A generic progress number conflated different measures | Separate assessed proficiency, learning completion and target-role knowledge checkpoints; primary roadmap remains more prominent |
| Admin Career tools | Failed requests could leave loading content | Error feedback with working retry; scoped styling, touch targets and contained table scrolling |

No new points system, fabricated achievement, fake lesson, placeholder assessment
link or invented completion percentage was introduced. Unavailable material is
still unavailable. Canonical quiz evidence never automatically establishes a
broader practical skill or completes coursework.

## Shared components

`public/js/career-ui.js` provides escaped snippet highlighting, a native accessible
confirmation/comparison dialog, skeleton states, the next-step summary and a
canonical evidence view. It uses no new production dependency. Scoped CSS tokens
cover teal/white surfaces, typography, spacing, focus, contrast, cards and mobile
layouts. Existing EchoLens fonts, components and gamification data are reused.

Playwright 1.62.1 is a pinned **development-only** dependency for reproducible
browser checks. Browser tooling requires Node 20 or newer. Chromium is detected
at `/usr/bin/chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; otherwise
install Playwright's Chromium using its normal supported installation workflow.

## Verification performed

- The full isolated Node suite reports **259 tests: 247 pass, 11 fail, 1 skip**.
  The remaining failure set is the pre-existing baseline set minus the corrected
  `/privacy.html` route regression. No new application regression was observed.
- All **94 Career tests** pass in the full suite: the previous 82 plus 12 new
  integrity, migration/recovery, serialization, persistence and sandbox checks.
- **98 browser assertions pass**, using the actual server, synthetic users and
  disposable storage. Viewports: **320, 390, 768, 1024 and 1440px**.
- Welcome, career cards, role, subtrack, career workspace, quiz and admin layout
  were checked for page overflow. No unintended horizontal page scrolling was
  found; code and wide comparison/table content scroll in their own containers.
- Browser interactions cover search/empty/clear, comparison, Escape dismissal,
  target selection, learning-outline focus, keyboard answer selection, Next,
  flags, server autosave, simulated save failure/retry, reload recovery, submit
  confirmation/cancellation, perfect-score results, combined history, skill
  evidence, learning-plan integration and failed-read retry.
- A full five-question Discovery onboarding and 12-question quiz were completed
  in the browser; a non-recommended career was then selected and verified as the
  learner's primary roadmap.
- No JavaScript page errors occurred in those successful browser runs.
- Measured primary-action text contrast: **5.09:1**. Reduced-motion transitions
  are disabled. Native radios, dialogs, headings, fieldsets, live save messages,
  focus indicators and keyboard actions were exercised. This is **not a claim
  of a complete WCAG conformance audit** or assistive-device certification.
- All **145 built-in executable question snippets** passed verification in the
  resource-limited OS sandbox. No host application files or network are exposed
  to that verifier.
- The current catalogue validator passes against the real quiz/coding structure.
  Remote video embeddability remains a separate explicit release check.
- Dependency audit: **0 critical, 0 high, 7 moderate** advisories remain. The
  remediation includes Nodemailer 10.3.1, aligned Prisma 7.10.1 packages,
  Sharp 0.35.5, Multer 2.5.0 and proxy-addr 2.0.8. It used verified npm packages;
  no force-upgrade of the remaining archive dependency graph was performed.

## Remaining limitations and release prerequisites

1. Prisma client generation is blocked by the environment's access restriction
   on `binaries.prisma.sh`. Six mapping/flush test files or cases require that
   generated client. Do not bypass checksum validation. Generate and rerun these
   checks in the approved build environment before release.
2. The Postgres-only Talent integration file requires an isolated scratch
   Postgres instance and exits as a failure without it. Live normalized Postgres
   persistence and cross-replica mutation races remain unverified.
3. Demo admin/coordinator overview failures and an outdated legal-policy
   placeholder expectation remain in the existing suite. Legal facts were not
   invented or overwritten to make the test pass.
4. Seven moderate dependency advisories remain in the archive/glob and related
   dependency graph. Some remediation requires an additional major upgrade;
   review and test archive/backup compatibility separately.
5. Nodemailer is a deliberate security **major-version update**. Local mail
   provider and application regressions ran, but real SMTP delivery must be
   verified in staging with approved settings before deployment.
6. Code-question import/verification needs Linux bubblewrap, Python 3 and user
   namespaces. It fails closed when those prerequisites are unavailable.
   Database connections now validate TLS certificates; configure the provider
   CA through `PGSSLROOTCERT` where needed.
7. Only five comprehensive subtrack banks are published. The remaining 127
   banks, complete role-final coverage, independent human subject review and
   lesson authoring are outside this correction. Their preparation states remain
   explicit. Historical pre-fix scores are preserved, not retroactively certified.
8. Assessment review flags and unsent drafts are scoped to the account/attempt
   in this browser. Server-accepted answers survive reload; cross-device draft
   synchronization and assistive-technology testing are not claimed.
9. Production deployed commit, remote CI status, hosting logs, real student
   records, provider delivery and rollback drills remain unverified. No intrusive
   checks were made against public systems.

## Reproduce safely

From the repository, with no production environment files or credentials:

```sh
npm ci
DATABASE_URL= DB_PATH=/tmp/echolens-check.json node --test --test-concurrency=2 test/*.test.js
npm run validate:catalogue
CAREER_UI_EVIDENCE=/tmp/echolens-career-screens npm run test:career:browser
```

The browser fixture scrubs service credentials, disables real mail and AI, and
uses a disposable synthetic store. Screenshots and results are written to
`CAREER_UI_EVIDENCE`. It produces career catalogue views at all five widths,
mobile/desktop quiz and results, the career workspace, Discovery screens and
desktop/mobile admin screenshots.

Pushing, merging and deploying remain subject to the owner's explicit approval.
