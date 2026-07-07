'use strict';

/**
 * EchoLens LMS - mailer
 * Sends email through SMTP when SMTP_HOST is configured; otherwise logs to
 * the console so nothing breaks before email is set up.
 * Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 */

const nodemailer = require('nodemailer');

const configured = !!process.env.SMTP_HOST;
const transport = configured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : null;

const FROM = process.env.MAIL_FROM || 'EchoLens <no-reply@echolens.digital>';

async function send({ to, subject, text }) {
  if (!configured) { console.log(`[mail skipped - SMTP not configured] to=${to} subject=${subject}`); return; }
  await transport.sendMail({ from: FROM, to, subject, text });
}

async function sendAnnouncement(recipients, title, body) {
  for (const r of recipients || []) {
    try { await send({ to: r.email, subject: `EchoLens: ${title}`, text: `Hi ${r.name},\n\n${body}\n\n- EchoLens` }); }
    catch (e) { console.error('Mail failed for', r.email, e.message); }
  }
}

module.exports = { send, sendAnnouncement, configured };
