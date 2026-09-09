'use strict';

/**
 * EchoLens LMS - mailer (v13)
 *
 * Thin orchestration layer over mail-provider.js. Two clearly separated paths:
 *
 *   notify() / send() / sendAnnouncement()  -> TRANSACTIONAL provider (SMTP
 *     mailbox). System mail the recipient is expecting: credentials, a reset
 *     code, a certificate, a grade, a class-starting ping. A hard per-run cap
 *     (TRANSACTIONAL_MAX_PER_RUN, default 20) means a buggy fan-out can never
 *     turn this into a bulk sender through the personal mailbox again.
 *
 *   sendBulk()  -> BULK provider (ESP HTTP API, Brevo by default). The admin
 *     email-blast and any all-users announcement. NEVER the mailbox. Runs
 *     DRY by default (MAIL_DRY_RUN unset/true): it logs the intended
 *     recipients and counts and sends nothing until MAIL_DRY_RUN=false.
 *
 * CIRCUIT BREAKER (both paths): the send loop aborts the ENTIRE run the
 * instant it sees an abuse / rate-limit / sender-blocked signal, or after
 * MAIL_MAX_CONSECUTIVE_FAILURES (default 3) failures in a row. It logs why
 * and returns { aborted:true, abortReason }. A failing run must stop, not
 * grind through the rest of the list and deepen the block.
 *
 * Env:
 *   MAIL_DRY_RUN                    default true  (bulk path only)
 *   BULK_MAIL_PROVIDER             default brevo
 *   BREVO_API_KEY, BULK_MAIL_FROM, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME
 *   MAIL_MAX_CONSECUTIVE_FAILURES   default 3
 *   TRANSACTIONAL_MAX_PER_RUN       default 20
 *   MAIL_BATCH_SIZE                 default 25    (bulk path)
 *   MAIL_BATCH_PAUSE_MS             default 60000 (bulk path)
 *   SMTP_* / MAIL_FROM             transactional transport (see mail-provider.js)
 *   SMTP_RATE_LIMIT (3), SMTP_RATE_DELTA_MS (1000)  inter-message pacing
 */

const { getTransactionalProvider, getBulkProvider } = require('./mail-provider');

const tx = getTransactionalProvider();
const configured = tx.configured;

const SEND_DELAY_MS = Number(process.env.SMTP_RATE_DELTA_MS || 1000) / Math.max(1, Number(process.env.SMTP_RATE_LIMIT || 3));
const BATCH_SIZE = Math.max(1, Number(process.env.MAIL_BATCH_SIZE || 25));
const BATCH_PAUSE_MS = Math.max(0, Number(process.env.MAIL_BATCH_PAUSE_MS || 60000));
const MAX_CONSECUTIVE_FAILURES = Math.max(1, Number(process.env.MAIL_MAX_CONSECUTIVE_FAILURES || 3));
const TRANSACTIONAL_MAX_PER_RUN = Math.max(1, Number(process.env.TRANSACTIONAL_MAX_PER_RUN || 20));
// DRY by default: only an explicit MAIL_DRY_RUN=false lets a blast leave the
// building. Any other value (unset, "true", "1", "yes", garbage) stays dry.
const BULK_DRY_RUN = String(process.env.MAIL_DRY_RUN ?? 'true').toLowerCase() !== 'false';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uniqLower = (arr) => [...new Set(arr.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean))];

/** Single transactional send. Used directly for one-off system mail. */
async function send({ to, subject, text, html, attachments }) {
  return tx.send({ to, subject, text, html, attachments });
}

/**
 * Fire-and-forget transactional notify. Never throws, never blocks the
 * request. `to` is one address or an array. Sends sequentially.
 *
 * Hard cap: at most TRANSACTIONAL_MAX_PER_RUN addresses per call - anything
 * beyond that is left in `result.skipped` and logged. A wide recipient list
 * is a sign the caller should be using sendBulk(), not the mailbox.
 *
 * Circuit breaker: aborts on an abuse/rate signal or after
 * MAX_CONSECUTIVE_FAILURES consecutive failures.
 *
 * Resolves to { sent, permanentFail, tempFail, skipped, aborted, abortReason }.
 */
async function notify(to, subject, text, attachments) {
  const all = uniqLower(Array.isArray(to) ? to : [to]);
  const result = { sent: [], permanentFail: [], tempFail: [], skipped: [], aborted: false, abortReason: null };
  if (!all.length) return result;

  let list = all;
  if (all.length > TRANSACTIONAL_MAX_PER_RUN) {
    list = all.slice(0, TRANSACTIONAL_MAX_PER_RUN);
    result.skipped = all.slice(TRANSACTIONAL_MAX_PER_RUN);
    console.warn(`[mailer] transactional cap hit for "${subject}": ${all.length} recipients, sending ${list.length}, skipping ${result.skipped.length}. Wide sends belong on the bulk provider (mailer.sendBulk).`);
  }

  let consecutive = 0;
  for (let i = 0; i < list.length; i++) {
    const addr = list[i];
    try {
      await send({ to: addr, subject, text: `${text}\n\n- EchoLens`, attachments });
      result.sent.push(addr);
      consecutive = 0;
    } catch (e) {
      consecutive++;
      (e.permanent ? result.permanentFail : result.tempFail).push(addr);
      console.error('Mail failed for', addr, e.message);
      if (e.abuse) {
        result.aborted = true;
        result.abortReason = `mail server rejected the sender (abuse / rate limit): ${e.message}`;
        break;
      }
      if (consecutive >= MAX_CONSECUTIVE_FAILURES) {
        result.aborted = true;
        result.abortReason = `${consecutive} consecutive send failures; last: ${e.message}`;
        break;
      }
    }
    if (i < list.length - 1) await sleep(SEND_DELAY_MS).catch(() => {});
  }
  if (result.aborted) {
    console.error(`[mailer] RUN ABORTED "${subject}": ${result.abortReason} - stopped after ${result.sent.length} sent, ${list.length - result.sent.length - result.permanentFail.length - result.tempFail.length} untouched.`);
  }
  return result;
}

/**
 * Personalised transactional announcement to a small, known audience (one
 * batch's students). Same hard cap and circuit breaker as notify().
 * `recipients` is [{ name, email }].
 */
async function sendAnnouncement(recipients, title, body) {
  const seen = new Set();
  const list = (recipients || []).filter((r) => {
    const em = r && r.email && String(r.email).toLowerCase();
    if (!em || seen.has(em)) return false;
    seen.add(em);
    return true;
  });
  const capped = list.slice(0, TRANSACTIONAL_MAX_PER_RUN);
  if (capped.length < list.length) {
    console.warn(`[mailer] sendAnnouncement cap: "${title}" has ${list.length} recipients, sending ${capped.length}. Use mailer.sendBulk for a wider announcement.`);
  }
  let consecutive = 0;
  for (let i = 0; i < capped.length; i++) {
    const r = capped[i];
    const first = String(r.name || '').trim().split(/\s+/)[0] || 'there';
    try {
      await send({ to: r.email, subject: `EchoLens: ${title}`, text: `Hi ${first},\n\n${body}\n\n- EchoLens` });
      consecutive = 0;
    } catch (e) {
      consecutive++;
      console.error('Mail failed for', r.email, e.message);
      if (e.abuse || consecutive >= MAX_CONSECUTIVE_FAILURES) {
        console.error(`[mailer] sendAnnouncement ABORTED "${title}": ${e.abuse ? 'abuse / rate limit' : consecutive + ' consecutive failures'} - ${e.message}`);
        break;
      }
    }
    if (i < capped.length - 1) await sleep(SEND_DELAY_MS).catch(() => {});
  }
}

/**
 * Outreach blast through the BULK provider (ESP HTTP API), never the mailbox.
 *
 * opts:
 *   html         optional HTML body
 *   attachments  nodemailer-style [{ filename, content }]
 *   isSuppressed (email) => boolean   - filtered out before sending
 *   onReject     ({ email, code, reason }) => void  - called for every address
 *                the ESP permanently rejects, so the caller can suppress it
 *   label        short human label for the logs (defaults to the subject)
 *
 * Resolves to:
 *   { provider, dryRun, requested, suppressed[], sent[], permanentFail[],
 *     tempFail[], aborted, abortReason }
 *
 * Circuit breaker: aborts the entire run on an abuse / quota / sender-blocked
 * signal, or after MAX_CONSECUTIVE_FAILURES consecutive failures.
 */
async function sendBulk(to, subject, text, opts = {}) {
  const label = opts.label || subject;
  let provider;
  try {
    provider = getBulkProvider();
  } catch (e) {
    console.error(`[mailer] bulk "${label}" refused: ${e.message}`);
    return { provider: null, dryRun: false, requested: 0, suppressed: [], sent: [], permanentFail: [], tempFail: [], aborted: true, abortReason: e.message };
  }

  const requested = uniqLower(Array.isArray(to) ? to : [to]);
  const suppressed = [];
  const list = requested.filter((em) => {
    if (opts.isSuppressed && opts.isSuppressed(em)) { suppressed.push(em); return false; }
    return true;
  });

  const result = {
    provider: provider.name, dryRun: false, requested: requested.length,
    suppressed, sent: [], permanentFail: [], tempFail: [], aborted: false, abortReason: null,
  };

  if (BULK_DRY_RUN) {
    result.dryRun = true;
    console.log(`[mailer] DRY RUN bulk "${label}" via ${provider.name}: would send to ${list.length} of ${requested.length} requested (${suppressed.length} suppressed). MAIL_DRY_RUN=false to actually send.`);
    if (list.length) console.log(`[mailer] DRY RUN "${label}" recipients: ${list.join(', ')}`);
    return result;
  }

  if (!provider.configured) {
    result.aborted = true;
    result.abortReason = `bulk provider "${provider.name}" is not configured (set BREVO_API_KEY)`;
    console.error(`[mailer] bulk "${label}" refused: ${result.abortReason}`);
    return result;
  }
  if (!list.length) return result;

  console.log(`[mailer] bulk START "${label}" via ${provider.name}: ${list.length} recipients, batches of ${BATCH_SIZE}, ${Math.round(BATCH_PAUSE_MS / 1000)}s between batches.`);
  let consecutive = 0;
  for (let i = 0; i < list.length; i++) {
    const addr = list[i];
    try {
      await provider.send({ to: addr, subject, text, html: opts.html, attachments: opts.attachments });
      result.sent.push(addr);
      consecutive = 0;
    } catch (e) {
      consecutive++;
      if (e.permanent) {
        result.permanentFail.push(addr);
        if (opts.onReject) { try { opts.onReject({ email: addr, code: String(e.statusCode || ''), reason: e.message }); } catch (_) { /* caller's problem, don't derail the run */ } }
      } else {
        result.tempFail.push(addr);
      }
      console.error(`[mailer] bulk send failed for ${addr}: ${e.message}`);
      if (e.abuse) {
        result.aborted = true;
        result.abortReason = `${provider.name} rejected the sender (abuse / quota / blocked): ${e.message}`;
        break;
      }
      if (consecutive >= MAX_CONSECUTIVE_FAILURES) {
        result.aborted = true;
        result.abortReason = `${consecutive} consecutive failures; last: ${e.message}`;
        break;
      }
    }
    if (i >= list.length - 1) break;
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`[mailer] bulk "${label}": ${i + 1}/${list.length} done (${result.sent.length} ok, ${result.tempFail.length} deferred, ${result.permanentFail.length} rejected) - pausing ${Math.round(BATCH_PAUSE_MS / 1000)}s.`);
      await sleep(BATCH_PAUSE_MS).catch(() => {});
    } else {
      await sleep(SEND_DELAY_MS).catch(() => {});
    }
  }

  const stopped = result.aborted ? ` - ABORTED: ${result.abortReason}` : '';
  console.log(`[mailer] bulk DONE "${label}": ${result.sent.length} sent, ${result.tempFail.length} deferred, ${result.permanentFail.length} rejected of ${list.length}${stopped}`);
  return result;
}

/** Status for the admin health check. */
function status() {
  let bulk;
  try {
    const p = getBulkProvider();
    bulk = { provider: p.name, configured: p.configured };
  } catch (e) {
    bulk = { provider: null, configured: false, error: e.message };
  }
  return {
    transactional: { provider: tx.name, configured: tx.configured, maxPerRun: TRANSACTIONAL_MAX_PER_RUN },
    bulk: { ...bulk, dryRun: BULK_DRY_RUN, batchSize: BATCH_SIZE, batchPauseMs: BATCH_PAUSE_MS },
    circuitBreaker: { maxConsecutiveFailures: MAX_CONSECUTIVE_FAILURES },
  };
}

module.exports = {
  send, notify, sendAnnouncement, sendBulk, status,
  configured,
  bulkDryRun: BULK_DRY_RUN,
};
