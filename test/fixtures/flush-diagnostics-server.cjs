'use strict';
const path = require('node:path');
require('dotenv').config = () => ({ parsed: {} });
for (const key of Object.keys(process.env)) {
  if (/^(DATABASE_URL|DIRECT_URL|TEST_DATABASE_URL|SMTP_|MAIL_|BULK_|BREVO_|ZEPTO|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|AWS_|RENDER|AI_|FLUSH_)/.test(key)) delete process.env[key];
}
const runtime = process.env.ECHOLENS_TEST_RUNTIME;
if (!runtime) throw Error('Isolated runtime required');
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '0',
  DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'),
  JWT_SECRET: 'synthetic-flush-diagnostics-secret', MAIL_DRY_RUN: 'true' });
const store = require('../../store');
const users = ['admin', 'student', 'instructor', 'finance', 'student_coordinator'].map((role, i) => ({ id: i + 1, name: role, role, profile: {}, onboarding_complete: true }));
store.allData().users = users; store.persist();
require('../../mailer').notify = async () => ({ skipped: true });
require('../../ai').enabled = () => false;
const express = require('express');
const listen = express.application.listen;
express.application.listen = function (...args) {
  const server = listen.apply(this, args);
  server.on('listening', () => {
    // Simulate a wedged flush without contacting any database.
    store.pendingPersist = () => Promise.reject(Error('Synthetic failed flush'));
    const jwt = require('jsonwebtoken');
    const { sessionVersion } = require('../../session-security');
    const cookies = Object.fromEntries(users.map(user => [user.role, 'el_token=' + jwt.sign({ id: user.id,
      sv: sessionVersion(user, process.env.JWT_SECRET) }, process.env.JWT_SECRET)]));
    process.send({ port: server.address().port, cookies });
  });
  return server;
};
require('../../server');
