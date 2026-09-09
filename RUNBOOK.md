# EchoLens — Email Runbook

How outreach email works after the September 2026 Zoho incident, how to set up
the ESP, the DNS records the sending domain needs, and how to warm up before
re-sending to the shortlist.

## Background: what happened

The in-app mailer blasted 379 recipients through the Zoho Mail mailbox
`ceo@echolens.digital` (sending as the `info@` alias). Zoho is a personal
mailbox, not a bulk sender. It rejected every message with
`550 5.4.6 Unusual sending activity detected` and then blocked sending from
the mailbox.

Two things were wrong and are now fixed in code:

1. **No circuit breaker.** The blast loop caught each rejection and kept
   going through all 379, deepening the block. It now aborts the entire run
   on the first abuse / rate-limit / sender-block signal, or after 3
   consecutive failures.
2. **Outreach went through the mailbox at all.** Blasts and site-wide
   announcements now go through an ESP HTTP API (Brevo by default) on a
   completely separate path. The mailbox path is transactional-only
   (credentials, password resets, certificates, single-batch notices) and is
   hard-capped at 20 messages per run.

**Also do this once, outside the code:** rotate the Zoho mailbox password for
`ceo@echolens.digital`. It was pasted into a working session and the mailbox
was involved in an abuse block.

## Architecture

| Path | Used for | Transport | Guardrails |
|---|---|---|---|
| **transactional** | password reset, credentials, certificate issued, enrolment/payment confirmation, grading & class pings, one batch's announcement | SMTP mailbox (`SMTP_*`) | hard cap `TRANSACTIONAL_MAX_PER_RUN` (20) per run; circuit breaker |
| **bulk** | admin email-blast, site-wide announcement, public-announcement → leads | ESP HTTP API (`BULK_MAIL_PROVIDER`, default `brevo`) | `MAIL_DRY_RUN` (default on); batching; circuit breaker; suppression list |

Code: [mail-provider.js](mail-provider.js) (the two providers), [mailer.js](mailer.js)
(orchestration, circuit breaker, dry-run), [store.js](store.js) `Suppressions`
(the suppression list).

### Environment variables

See [.env.example](.env.example) for the annotated list. The ones that matter
operationally:

```
MAIL_DRY_RUN=true            # blasts are logged, nothing sent. Set to exactly "false" to send.
BULK_MAIL_PROVIDER=brevo
BREVO_API_KEY=               # from the Brevo dashboard
BULK_MAIL_FROM=EchoLens <hello@echolens.digital>   # domain must be authenticated in Brevo
MAIL_BATCH_SIZE=25
MAIL_BATCH_PAUSE_MS=60000
MAIL_MAX_CONSECUTIVE_FAILURES=3
TRANSACTIONAL_MAX_PER_RUN=20
MAIL_ALERT_TO=               # where the Postgres-flush alert goes; defaults to SMTP_USER
```

`MAIL_DRY_RUN` is off (i.e. dry) unless the value is exactly the string
`false`. Anything else — unset, `true`, `1`, a typo — keeps it dry.

### Suppression list

Every address the ESP permanently rejects (or that hard-bounces) during a run
is written to the `email_suppressions` table (Postgres) or the
`email_suppressions` collection (JSON store) and skipped on every future
blast. The lead/user row is **not** deleted.

- Migration: [migrations/0008_email_suppressions.sql](migrations/0008_email_suppressions.sql) — run `npm run migrate` (Postgres only). If you forget, `store.js` re-issues the same `CREATE TABLE IF NOT EXISTS` at boot and on first write, so a blast degrades to "not skipping past bounces" rather than crashing.
- Review: `GET /api/admin/suppressions`
- Un-suppress (rare, only if you know the address is valid again): `DELETE /api/admin/suppressions/:email`

---

## 1. Create the ESP account (Brevo)

1. Sign up at <https://www.brevo.com> with a role address you control
   (e.g. `ops@echolens.digital`). The free plan allows ~300 emails/day —
   enough for a warmed, phased re-send to the shortlist.
2. **Senders & Domains → Domains → Add a domain**: add `echolens.digital`.
   Brevo shows you the DNS records to add (next section). Add them at the DNS
   host, then click **Authenticate** / **Verify** in Brevo until every row is
   green. Delivery from an unauthenticated domain will fail.
3. **Senders**: add `hello@echolens.digital` (or whatever `BULK_MAIL_FROM`
   uses) as a sender and confirm it.
4. **SMTP & API → API Keys → Generate a new API key**. Copy it into
   `BREVO_API_KEY` in the Render environment. It is a bearer credential —
   treat it like a password, never commit it.
5. Leave `MAIL_DRY_RUN=true` for now.

### Swapping providers later

`BULK_MAIL_PROVIDER` selects the implementation. Only `brevo` ships today.
To add another (Postmark broadcast, SES, Resend, MailerSend…), implement a
class in [mail-provider.js](mail-provider.js) with the same
`async send({ to, subject, text, html, attachments })` contract (throw on
failure; set `err.permanent` for a bad address, `err.abuse` for a
sender/quota problem) and add it to `getBulkProvider()`.

---

## 2. DNS records for `echolens.digital`

Add these at the DNS provider for the domain. Values in **SPF/DKIM** come
from the Brevo domain-setup screen — the ones below are the shape, not the
literal strings to paste.

### SPF (TXT, host `@`)

If there is no SPF record yet:

```
v=spf1 include:spf.brevo.com include:zoho.com ~all
```

If an SPF record already exists, **merge** — never add a second SPF TXT
record. Add `include:spf.brevo.com` before the final `~all` / `-all`.
Keep `include:zoho.com` (or `include:zohomail.com`, whichever is already
there) so transactional mail from the mailbox still passes.

### DKIM (CNAME or TXT, from Brevo)

Brevo gives two DKIM entries, typically:

```
brevo1._domainkey.echolens.digital   CNAME   b1.echolens-digital.dkim.brevo.com
brevo2._domainkey.echolens.digital   CNAME   b2.echolens-digital.dkim.brevo.com
```

Keep Zoho's existing DKIM record (`zmail._domainkey` or similar) as well —
both selectors coexist.

### DMARC (TXT, host `_dmarc`)

Start in monitor-only mode so nothing legitimate gets caught while SPF/DKIM
settle:

```
_dmarc.echolens.digital   TXT   v=DMARC1; p=none; rua=mailto:dmarc@echolens.digital; fo=1; adkim=r; aspf=r
```

After ~1–2 weeks of clean aggregate reports (all legitimate mail aligning on
SPF **or** DKIM), tighten:

```
v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc@echolens.digital; adkim=r; aspf=r
```

then over further weeks raise `pct` to 100 and move `p=quarantine` →
`p=reject`. Do not start at `p=reject`.

### Verify

```
dig +short TXT echolens.digital
dig +short TXT _dmarc.echolens.digital
dig +short CNAME brevo1._domainkey.echolens.digital
```

and send a test to a Gmail account — **Show original** should show
`SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.

---

## 3. Phased warm-up before re-sending to the shortlist

A domain that just triggered an abuse block has no positive sending
reputation on the ESP's IP pool. Ramp slowly. Do **not** send the full
shortlist on day one.

### Before you start

- All DNS green in Brevo; test mail passes SPF/DKIM/DMARC at Gmail.
- `BREVO_API_KEY` set in Render.
- Load the shortlist into the leads database (`POST /api/admin/leads`,
  comma/newline separated).
- Do one real send with `MAIL_DRY_RUN=true` and read the logs: confirm the
  recipient count and that suppressed addresses are excluded.
- Clean the list: drop role addresses (`info@`, `support@`, `admin@`),
  obvious typos, and anything already in the suppression list.

### Schedule

Keep `MAIL_BATCH_SIZE=25`, `MAIL_BATCH_PAUSE_MS=60000`. Send during business
hours in the recipients' timezone. One send per day.

| Day | Recipients | Segment |
|---|---|---|
| 1 | 20 | most engaged / people who have replied before |
| 2 | 20 | (skip a day if day 1 had any bounce/complaint) |
| 3 | 40 | next most engaged |
| 4 | 60 | |
| 5 | 100 | |
| 8 | 150 | after a weekend pause |
| 10 | 200 | |
| 12+ | rest of shortlist | in ≤250/day chunks |

### After every send

1. `GET /api/admin/health` → check the **Bulk Mail** row.
2. Read the audit log: `email_blast_done` (or `email_blast_aborted`) has the
   sent / deferred / rejected / suppressed counts.
3. Brevo dashboard → **Statistics**: bounce rate and spam-complaint rate.
   - Hard bounce rate **> 3%** → stop, clean the list, resume smaller.
   - Any spam complaints → stop for 48h, cut volume in half on resume,
     review the content and the opt-in basis for the list.
4. If a run shows `aborted`, do not just re-run it. Find out why
   (`abortReason` in the log / audit entry): ESP quota, a block, or a bad
   batch. Fix that first.

### If sending gets blocked again

- The circuit breaker has already stopped the run — it will not have ground
  through the whole list.
- Check Brevo for an account warning or suspension; respond to it.
- Every address that errored on that run is now suppressed and will be
  skipped automatically on the next attempt.
- Resume one tier smaller than where you were.
