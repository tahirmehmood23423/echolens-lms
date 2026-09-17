'use strict';
// Actual HTTP server, synthetic records, simulated clock and captured mail.
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config = () => ({ parsed: {} });
for (const key of Object.keys(process.env)) if (/^(DATABASE_URL|DIRECT_URL|SMTP_|MAIL_|BULK_|BREVO_|ZEPTO|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|AWS_|RENDER|AI_|ADMISSIONS_|FINANCE_)/.test(key)) delete process.env[key];
const runtime = process.env.ECHOLENS_TEST_RUNTIME;
if (!runtime) throw Error('Isolated test runtime required');
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '0', DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'), JWT_SECRET: 'synthetic-admissions-test-secret', MAIL_DRY_RUN: 'true' });
const store = require('../../store');
const roles = ['admin', 'student_coordinator', 'finance', 'instructor', 'student', 'hr', 'coordinator'];
const users = roles.map((role, i) => ({ id: i + 1, name: 'Synthetic ' + role, username: role, role, email: role + '@qa.invalid', profile: {}, onboarding_complete: true }));
store.allData().users = users; store.allData().seq.users = users.length;
store.loadOfficialCatalogue();
for (let i = 1; i <= 3; i++) store.Registrations.create({ name: 'Synthetic Applicant ' + i, email: `applicant${i}@qa.invalid`, whatsapp: 'DEMO-0000', course_code: 'SC-01' });
store.persist();
const messages = [];
const mailer = require('../../mailer');
mailer.configured = true;
mailer.send = async message => { messages.push({ to: message.to, subject: message.subject, text: message.text }); fs.writeFileSync(path.join(runtime, 'mail.json'), JSON.stringify(messages)); return { sent: true, id: 'sample-message-' + messages.length }; };
mailer.notify = async () => ({ sent: false });
require('../../ai').enabled = () => false;
fs.writeFileSync(path.join(runtime, 'mail.json'), '[]');
let reminderService, now = new Date('2026-10-17T04:00:00Z');
const reminderModule = require('../../admissions-reminders');
const create = reminderModule.createAdmissionsReminders;
reminderModule.createAdmissionsReminders = (s, m, options) => reminderService = create(s, m, { ...options, clock: () => now, pause: async () => {} });
process.on('message', async message => {
  if (message?.type !== 'sweep') return;
  try { now = new Date(message.now); process.send({ type: 'swept', result: await reminderService.run() }); }
  catch (error) { process.send({ type: 'failed', error: error.message }); }
});
const express = require('express'); const listen = express.application.listen;
express.application.listen = function (...args) {
  const server = listen.apply(this, args);
  server.on('listening', () => {
    const jwt = require('jsonwebtoken'); const { sessionVersion } = require('../../session-security');
    const cookies = Object.fromEntries(users.map(u => [u.role, 'el_token=' + jwt.sign({ id: u.id, sv: sessionVersion(u, process.env.JWT_SECRET) }, process.env.JWT_SECRET)]));
    process.send({ port: server.address().port, cookies });
  });
  return server;
};
require('../../server');
