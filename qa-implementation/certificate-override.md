# Admin manual certificate override

Implemented for the temporary manual-issuance request on 16 September 2026. This is an explicit option on each issuance, with no automatic expiry.

## Portal usage

An admin opens a course and selects **Manage → Issue certificate**, chooses an enrolled learner, and checks **Issue even if the student has not submitted or completed the track**. Leaving it unchecked retains the completion requirement.

For bulk issuance, select **Manage → Issue certificates (whole course)** and untick **Only students who completed the full quest track** to include every enrolled learner. The checkbox starts checked every time the form opens. Existing certificates are reported separately and do not produce duplicate records or notification calls.

## Access and persistence

The single-learner API accepts the boolean `allow_incomplete: true`; bulk issuance uses the existing boolean `only_completed: false`. Both exceptions are restricted to admins on the server, as well as in the portal UI. Instructors retain normal issuance for learners who completed their track. String values such as `"true"` or `"false"` do not enable an override. Enrollment is still required.

For each newly issued certificate whose track is incomplete, the existing audit log records `certificate_completion_override`, the issuing admin, certificate ID/serial, learner, cohort, time, and whether it was a bulk action. The certificate and audit record are saved before a successful response or email notification. Submissions, grades, and track progress are unchanged. Automatic free-course certificate requirements are unchanged.

No new environment variables, schema migration, or integration is needed. The portal script URL was updated to `dashboard.js?v1270` so browsers load the new controls.

## Verification

The local suite passed **83 tests**, excluding the older `talent.test.js` that requires an external disposable PostgreSQL server. Focused API coverage includes absent/unsubmitted tracks, opt-in behavior, strict boolean flags, instructor/student access restrictions, unenrolled learners, normal issuance for completed learners, public verification, durable audit records, unchanged submissions, bulk defaults, and repeated requests without duplicate certificates or notification calls.

```sh
node --test test/certificate-override.test.js test/certificate-final-project.test.js test/talent-resilience.test.js
node qa-implementation/certificate-override-browser.cjs
```

The browser check uses the actual portal against a synthetic isolated server, with all mail stubbed and external network requests blocked. It checks individual and bulk admin issuance at 1440px and 390px, plus instructor restrictions. Evidence:

- [Browser results](evidence/certificate-override-browser.json)
- [Individual form, desktop](evidence/certificate-override-single-1440.png)
- [Individual form, mobile](evidence/certificate-override-single-390.png)
- [Bulk form, desktop](evidence/certificate-override-bulk-1440.png)
- [Bulk form, mobile](evidence/certificate-override-bulk-390.png)

Production deployment and actual inbox delivery are not verified by these local checks. Deploy the updated code to make the option available in the live portal.
