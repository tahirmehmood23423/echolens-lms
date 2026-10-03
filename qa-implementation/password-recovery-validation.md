# Signup and password recovery validation

Validated on 3 October 2026 before deployment.

## Email transport

- The local configuration selects `zeptomail-api` because `ZEPTO_SEND_MAIL_TOKEN` is set.
- A real transactional test message to the configured sender mailbox, `info@echolens.digital`, was accepted by ZeptoMail (`EM_104`, "Email request received"). This confirms provider acceptance, not delivery to the inbox.
- The separately configured SMTP transport failed authentication (`535 Authentication Failed`). It is not the selected transport. SMTP credentials need correction before using SMTP instead of the API.
- `SIGNUP_MAIL_DOWN=false` locally. Signup mail now defaults to enabled when the override is absent.
- These checks used local configuration; deployment environment variables were not inspected or changed.

## Pipeline checks

`node qa-implementation/password-recovery-smoke.cjs`

Passed at 1440px and 390px using an isolated store and captured emails:

- Signup email verification and welcome email with username/password.
- Recovery request, emailed PIN, and email verification before the password form opens.
- Password confirmation mismatch, successful reset, and login with the new password.
- Old password and pre-reset session rejected.
- No browser JavaScript errors.

`node --test test/password-recovery.test.js test/signup-durability.test.js test/mail-provider.test.js test/upload-access.test.js`

All 11 tests passed, covering expiry, attempt limits, resend cooldown, one-time grants, persistence failures during signup, provider formatting, and session invalidation.

## Full suite

`npm test`: 161 passed, 3 failed, 1 skipped. The same three failures were reproduced in a detached worktree at baseline commit `e0c36cf`:

- `test/legal-pages.test.js`: `/privacy.html` returns 404.
- `test/legal-pages.test.js`: expected legal-policy placeholders are absent.
- `test/talent.test.js`: requires an explicitly configured PostgreSQL integration-test server; `DATABASE_URL` was not set in the test process.

Recovery remains scoped to free accounts. PINs and reset grants live in process memory and expire after ten minutes; a restart requires requesting a new PIN. Multi-instance deployments need shared recovery storage or session affinity.
