'use strict';

/**
 * EchoLens LMS - mailer (v11)
 * Sends email through SMTP when SMTP_HOST is configured; otherwise logs to
 * the console so nothing breaks before email is set up.
 * Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 *      SMTP_RATE_LIMIT (default 3), SMTP_RATE_DELTA_MS (default 1000) -
 *      max messages per rolling window, enforced both by nodemailer's pool
 *      and by notify()'s own sequential send loop below (belt and braces -
 *      see the comment on notify() for why both layers matter).
 */

const nodemailer = require('nodemailer');

const configured = !!process.env.SMTP_HOST;
// Pooled + rate-limited: sending a large batch (a lead blast, a class
// announcement) used to open one fresh SMTP connection PER recipient, all at
// once - most mail hosts (including small/shared ones like a typical
// info@ mailbox) reject or defer a burst like that outright, which is why a
// blast could previously fail for every single recipient with the exact
// same "452 Temporarily Deferred" error regardless of whether the address
// was valid. Pooling reuses one connection and nodemailer's own rateLimit
// paces messages on top of it.
const transport = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      pool: true,
      maxConnections: 1,
      rateDelta: Number(process.env.SMTP_RATE_DELTA_MS || 1000),
      rateLimit: Number(process.env.SMTP_RATE_LIMIT || 3),
    })
  : null;

const FROM = process.env.MAIL_FROM || 'EchoLens <info@echolens.digital>';
const SEND_DELAY_MS = Number(process.env.SMTP_RATE_DELTA_MS || 1000) / Number(process.env.SMTP_RATE_LIMIT || 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function send({ to, subject, text, attachments }) {
  if (!configured) { console.log(`[mail skipped - SMTP not configured] to=${to} subject=${subject}${attachments && attachments.length ? ` attachments=${attachments.map((a) => a.filename).join(',')}` : ''}`); return; }
  await transport.sendMail({ from: FROM, to, subject, text, attachments });
}

// A 5xx SMTP response means the recipient address itself was rejected
// (unknown user, bad domain, etc.) - permanent, safe to treat as a dead
// address. A 4xx response (e.g. 452 "temporarily deferred") or a
// connection-level error means the SERVER backed off, which says nothing
// about whether the address is valid - never treat those as proof of a bad
// address.
function isPermanentFailure(err) {
  const code = err.responseCode || (typeof err.response === 'string' ? parseInt(err.response, 10) : null);
  return Number.isFinite(code) && code >= 500 && code < 600;
}

// Fire-and-forget notify: never throws, never blocks the request. Sends
// SEQUENTIALLY (not all at once) so a large recipient list can't flood the
// SMTP connection the way a `for` loop of unawaited sends used to. Returns a
// promise (most callers ignore it, same as before) resolving to
// { sent, permanentFail, tempFail } - permanentFail addresses are
// confirmed-dead (5xx) and safe for a caller to remove from the leads
// database; tempFail addresses just need a retry later, never a deletion.
// `to` is one address or an array; empty/missing addresses are skipped.
// `attachments` (optional) is a nodemailer attachments array, e.g.
// [{ filename: 'challan.pdf', content: <Buffer> }].
async function notify(to, subject, text, attachments) {
  const list = (Array.isArray(to) ? to : [to]).filter(Boolean);
  const result = { sent: [], permanentFail: [], tempFail: [] };
  for (let i = 0; i < list.length; i++) {
    const addr = list[i];
    try {
      await send({ to: addr, subject, text: text + '\n\n- EchoLens', attachments });
      result.sent.push(addr);
    } catch (e) {
      console.error('Mail failed for', addr, e.message);
      (isPermanentFailure(e) ? result.permanentFail : result.tempFail).push(addr);
    }
    if (i < list.length - 1) await sleep(SEND_DELAY_MS).catch(() => {});
  }
  return result;
}

async function sendAnnouncement(recipients, title, body) {
  const list = recipients || [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    const first = String(r.name || '').trim().split(/\s+/)[0] || 'there';
    try { await send({ to: r.email, subject: `EchoLens: ${title}`, text: `Hi ${first},\n\n${body}\n\n- EchoLens` }); }
    catch (e) { console.error('Mail failed for', r.email, e.message); }
    if (i < list.length - 1) await sleep(SEND_DELAY_MS).catch(() => {});
  }
}

module.exports = { send, notify, sendAnnouncement, configured };
