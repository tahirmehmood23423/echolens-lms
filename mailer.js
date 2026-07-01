'use strict';

/**
 * EchoLens LMS - email
 * Sends mail through SMTP when configured (see .env). When SMTP is not set up,
 * it logs what it would have sent so the app keeps working in development.
 */

const nodemailer = require('nodemailer');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM = process.env.MAIL_FROM || process.env.SMTP_USER || 'EchoLens <no-reply@echolens.digital>';

let transport = null;
const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

if (configured) {
  transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true', // true for port 465
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * Send one email. `bcc` may be an array of addresses (used so recipients
 * do not see each other). Resolves quietly; never throws into a request.
 */
async function sendMail({ to, bcc, subject, text, html }) {
  if (!configured) {
    const who = bcc ? `${(bcc || []).length} recipient(s) [bcc]` : to;
    console.log(`[mail] (not configured) would send "${subject}" to ${who}`);
    return { skipped: true };
  }
  try {
    const info = await transport.sendMail({ from: FROM, to: to || FROM, bcc, subject, text, html });
    console.log(`[mail] sent "${subject}" (${info.messageId})`);
    return { sent: true };
  } catch (err) {
    console.error('[mail] send failed:', err.message);
    return { error: err.message };
  }
}

/* ----------------------------- templates ----------------------------- */
const wrap = (title, bodyHtml) => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1A2336">
    <div style="background:#0D1B3E;padding:20px 24px;border-radius:12px 12px 0 0">
      <span style="color:#fff;font-weight:700;letter-spacing:.14em">ECHO<span style="color:#00C9B1">LENS</span></span>
    </div>
    <div style="border:1px solid #E4E8EE;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <h2 style="margin:0 0 12px;color:#0D1B3E">${title}</h2>
      ${bodyHtml}
      <p style="margin-top:24px"><a href="${APP_URL}" style="background:#069c89;color:#04231f;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:8px;display:inline-block">Open EchoLens</a></p>
    </div>
    <p style="color:#828b99;font-size:12px;text-align:center;margin-top:14px">EchoLens &middot; ${APP_URL}</p>
  </div>`;

function welcomeEmail(user, plainPassword, roleLabel) {
  const subject = 'Your EchoLens account is ready';
  const text = `Hello ${user.name},

An EchoLens ${roleLabel} account has been created for you.

Sign in at: ${APP_URL}
Email: ${user.email}
Temporary password: ${plainPassword}

Please sign in and change your password from your Profile.

EchoLens`;
  const html = wrap('Your account is ready', `
    <p>Hello ${user.name},</p>
    <p>An EchoLens <strong>${roleLabel}</strong> account has been created for you.</p>
    <table style="font-size:14px;margin:14px 0">
      <tr><td style="color:#5B6472;padding:2px 12px 2px 0">Email</td><td><strong>${user.email}</strong></td></tr>
      <tr><td style="color:#5B6472;padding:2px 12px 2px 0">Temporary password</td><td><strong>${plainPassword}</strong></td></tr>
    </table>
    <p>Please sign in and change your password from your Profile.</p>`);
  return { subject, text, html };
}

function announcementEmail(title, body, authorName, scope) {
  const subject = `[EchoLens] ${title}`;
  const text = `${title}

${body}

Posted by ${authorName || 'EchoLens'}${scope ? ' - ' + scope : ''}
Open EchoLens: ${APP_URL}`;
  const html = wrap(title, `
    <p style="white-space:pre-wrap">${String(body).replace(/[&<>]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[c]))}</p>
    <p style="color:#5B6472;font-size:13px">Posted by ${authorName || 'EchoLens'}${scope ? ' &middot; ' + scope : ''}</p>`);
  return { subject, text, html };
}

module.exports = { sendMail, welcomeEmail, announcementEmail, configured, APP_URL };
