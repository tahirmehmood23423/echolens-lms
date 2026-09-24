'use strict';
// Real HTTP server whose Postgres flush can be made to fail on demand, so the
// "credentials emailed for an account that never saved" path can be reproduced.
const path = require('node:path');
require('dotenv').config = () => ({ parsed: {} });
for (const key of Object.keys(process.env)) if (/^(DATABASE_URL|DIRECT_URL|SMTP_|MAIL_|BULK_|BREVO_|ZEPTO|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|AWS_|RENDER|AI_|ADMISSIONS_|FINANCE_)/.test(key)) delete process.env[key];
const runtime = process.env.ECHOLENS_TEST_RUNTIME;
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '0', DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'), JWT_SECRET: 'synthetic-durability-secret', MAIL_DRY_RUN: 'true', SIGNUP_MAIL_DOWN: 'false' });
const store = require('../../store');
store.allData().users = []; store.allData().seq.users = 0;
store.loadOfficialCatalogue();
store.persist();

// Capture mail instead of sending it.
const sent = [];
const mailer = require('../../mailer');
mailer.configured = true;
mailer.send = async () => ({ sent: true });
mailer.notify = async (to, subject, text) => { sent.push({ to: Array.isArray(to) ? to.join(',') : to, subject, text }); return { sent: [] }; };

// The failure switch: when armed, the durability gate reports the write never
// reached Postgres, exactly as a poisoned flush does in production.
// Modelled on the real thing: store.save() parks a REJECTED promise for the
// failed flush, the waiters on it see that rejection, and then the gate resets
// to resolved so a provider blip does not 500 every later read. So each armed
// failure rejects once and then clears, exactly as one failed flush does.
let flushBroken = false;
const realPendingPersist = store.pendingPersist;
store.pendingPersist = () => {
  if (!flushBroken) return realPendingPersist.call(store);
  flushBroken = false;
  return Promise.reject(new Error('synthetic flush failure'));
};

const express = require('express'); const listen = express.application.listen;
express.application.listen = function (...args) {
  const server = listen.apply(this, args);
  server.on('listening', () => process.send({ port: server.address().port }));
  return server;
};
process.on('message', (m) => {
  if (m?.type === 'break') { flushBroken = true; process.send({ type: 'broken' }); }
  if (m?.type === 'heal') { flushBroken = false; process.send({ type: 'healed' }); }
  if (m?.type === 'mail') process.send({ type: 'mail', sent });
});
require('../../server');
