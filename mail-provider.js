'use strict';

/**
 * EchoLens LMS - mail provider layer
 *
 * Splits "how a message physically leaves the building" from the callers in
 * mailer.js. Two kinds of provider, deliberately never interchangeable:
 *
 *   transactional - one-at-a-time system mail the recipient is expecting
 *     right now: password reset, certificate issued, enrolment confirmed,
 *     a grade posted. Goes through the SMTP mailbox (SMTP_USER). Low volume
 *     by nature; mailer.js enforces a hard per-run cap on top of this so a
 *     buggy fan-out can never turn this path into a bulk sender again.
 *
 *   bulk - outreach: the admin email-blast, an all-users announcement. Goes
 *     through an ESP's HTTP API (Brevo by default), NOT the mailbox. The
 *     mailbox is a personal inbox; Zoho flagged a 379-recipient blast
 *     through it as abuse and blocked sending. Outreach must never touch it.
 *
 * Every provider implements the same shape:
 *
 *     async send({ to, subject, text, html, attachments }) -> { sent, id? }
 *       throws on failure. A thrown error may carry:
 *         err.permanent  true  -> the ADDRESS is bad (suppress it, don't retry)
 *         err.abuse      true  -> the SENDER is rate-limited / blocked / out of
 *                                 credits (abort the whole run immediately)
 *         err.statusCode       -> numeric protocol/HTTP status when available
 *
 * Config (all env, no secrets in code):
 *   SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS MAIL_FROM   - transactional
 *   SMTP_RATE_LIMIT (3) SMTP_RATE_DELTA_MS (1000)       - transactional pacing
 *   BULK_MAIL_PROVIDER (brevo)                          - which bulk ESP
 *   BREVO_API_KEY                                       - bulk auth
 *   BULK_MAIL_FROM (falls back to MAIL_FROM)            - bulk From: header
 *   BREVO_SENDER_EMAIL BREVO_SENDER_NAME                - override parsed From
 */

const https = require('https');
const nodemailer = require('nodemailer');

const FROM = process.env.MAIL_FROM || 'EchoLens <info@echolens.digital>';

function parseAddress(raw, fallbackName) {
  const m = /^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/.exec(String(raw || ''));
  if (m) return { name: m[1] || fallbackName || '', email: m[2] };
  return { name: fallbackName || '', email: String(raw || '').trim() };
}

/* -------------------------- transactional: SMTP -------------------------- */

class SmtpProvider {
  constructor() {
    this.name = 'smtp';
    this.kind = 'transactional';
    this.configured = !!process.env.SMTP_HOST;
    // Pooled, single connection, rate-limited - a shared mailbox rejects a
    // burst of parallel connections outright. Unchanged from the original
    // mailer.js transport.
    this.transport = this.configured
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
          pool: true,
          maxConnections: 1,
          rateDelta: Number(process.env.SMTP_RATE_DELTA_MS || 1000),
          rateLimit: Number(process.env.SMTP_RATE_LIMIT || 3),
        })
      : null;
  }

  async send({ to, subject, text, html, attachments }) {
    if (!this.configured) {
      console.log(`[mail skipped - SMTP not configured] to=${to} subject=${subject}`);
      return { sent: false, skipped: true };
    }
    try {
      const info = await this.transport.sendMail({ from: FROM, to, subject, text, html, attachments });
      return { sent: true, id: info && info.messageId };
    } catch (err) {
      annotateSmtpError(err);
      throw err;
    }
  }

  close() {
    try { this.transport && this.transport.close(); } catch { /* reopens on next send */ }
  }
}

// A 5xx SMTP reply is a permanent rejection of the address. A 4xx or a
// connection-level error is the server backing off and says nothing about
// the address. "Unusual sending activity" / 5.4.6 / "blocked" is the sender
// being throttled or blacklisted - that must abort the run, not just skip
// one address.
function annotateSmtpError(err) {
  const code = err.responseCode
    || (typeof err.response === 'string' ? parseInt(err.response, 10) : null);
  if (Number.isFinite(code)) err.statusCode = code;
  err.permanent = Number.isFinite(code) && code >= 500 && code < 600;
  const blob = `${err.responseCode || ''} ${err.response || ''} ${err.message || ''}`.toLowerCase();
  err.abuse = /5\.4\.6|unusual sending activity|suspicious|abuse|blacklist|blocklist|spam|too many|rate limit|sending limit exceeded|temporarily deferred/.test(blob);
  // An abuse/limit signal is never proof the address itself is bad.
  if (err.abuse) err.permanent = false;
}

/* ----------------------------- bulk: Brevo ------------------------------ */

class BrevoProvider {
  constructor() {
    this.name = 'brevo';
    this.kind = 'bulk';
    this.apiKey = process.env.BREVO_API_KEY || '';
    this.configured = !!this.apiKey;
    const parsed = parseAddress(process.env.BULK_MAIL_FROM || FROM, 'EchoLens');
    this.senderEmail = (process.env.BREVO_SENDER_EMAIL || parsed.email || '').trim();
    this.senderName = (process.env.BREVO_SENDER_NAME || parsed.name || 'EchoLens').trim();
  }

  async send({ to, subject, text, html, attachments }) {
    if (!this.configured) {
      const err = new Error('bulk provider "brevo" is not configured - set BREVO_API_KEY');
      err.abuse = true; // treat as "cannot send at all" -> abort the run
      throw err;
    }
    const payload = {
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: to }],
      subject,
      textContent: text,
    };
    if (html) payload.htmlContent = html;
    if (attachments && attachments.length) {
      payload.attachment = attachments.map((a) => ({
        name: a.filename,
        content: Buffer.isBuffer(a.content)
          ? a.content.toString('base64')
          : Buffer.from(a.content || '').toString('base64'),
      }));
    }
    const res = await postJson('api.brevo.com', '/v3/smtp/email', { 'api-key': this.apiKey }, payload);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return { sent: true, id: safeJson(res.body).messageId };
    }
    const err = new Error(`brevo ${res.statusCode}: ${String(res.body).slice(0, 300)}`);
    err.statusCode = res.statusCode;
    // 400 invalid_parameter / 422 = this recipient address is unusable ->
    // permanent, suppress it. 401/403 (bad key), 402 (out of credits), 429
    // (rate limited) = the sender is the problem -> abort the whole run.
    err.permanent = res.statusCode === 400 || res.statusCode === 422;
    err.abuse = [401, 402, 403, 429].includes(res.statusCode)
      || /quota|credit|blocked|banned|suspend|abuse|not authoriz/i.test(String(res.body));
    if (err.abuse) err.permanent = false;
    throw err;
  }
}

/* ------------------------------- helpers -------------------------------- */

function postJson(hostname, path, extraHeaders, obj) {
  return new Promise((resolve, reject) => {
    const body = Buffer.from(JSON.stringify(obj));
    const req = https.request(
      {
        method: 'POST',
        hostname,
        path,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'content-length': body.length,
          ...extraHeaders,
        },
        timeout: 20000,
      },
      (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('request timed out')));
    req.end(body);
  });
}

function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }

/* ------------------------------ selection ------------------------------- */

let _transactional = null;
function getTransactionalProvider() {
  if (!_transactional) _transactional = new SmtpProvider();
  return _transactional;
}

let _bulk = null;
function getBulkProvider() {
  if (_bulk) return _bulk;
  const name = String(process.env.BULK_MAIL_PROVIDER || 'brevo').toLowerCase();
  switch (name) {
    case 'brevo':
    case 'sendinblue':
      _bulk = new BrevoProvider();
      break;
    default:
      throw new Error(`unknown BULK_MAIL_PROVIDER "${name}" - supported: brevo`);
  }
  return _bulk;
}

module.exports = { getTransactionalProvider, getBulkProvider, SmtpProvider, BrevoProvider };
