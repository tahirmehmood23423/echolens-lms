'use strict';

// Isolated actual server for certificate API and browser checks. No .env,
// external database, AI calls, or outbound mail.
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config = () => ({ parsed: {} });
for (const key of Object.keys(process.env)) {
  if (/^(DATABASE_URL|DIRECT_URL|SMTP_|MAIL_|BULK_|BREVO_|ZEPTO|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|AWS_|RENDER|AI_)/.test(key)) delete process.env[key];
}
const runtime = process.env.ECHOLENS_TEST_RUNTIME;
if (!runtime) throw new Error('An isolated test runtime directory is required.');
Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '0',
  DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'),
  JWT_SECRET: 'synthetic-certificate-test-secret', MAIL_DRY_RUN: 'true',
});
const store = require('../../store');
const users = [
  { id: 1, role: 'admin', name: 'Synthetic Admin' },
  { id: 2, role: 'student', name: 'Synthetic No Submissions' },
  { id: 3, role: 'instructor', name: 'Synthetic Assigned Teacher' },
  { id: 4, role: 'student', name: 'Synthetic Unenrolled' },
  { id: 5, role: 'student', name: 'Synthetic Completed' },
  { id: 6, role: 'instructor', name: 'Synthetic Unassigned Teacher' },
  { id: 7, role: 'student', name: 'Synthetic Incomplete' },
].map(u => ({ ...u, username: `synthetic.${u.id}`, email: `synthetic.${u.id}@qa.invalid`, reg_no: `TEST-${u.id}`, profile: {}, onboarding_complete: true }));
const data = store.allData();
data.users = users;
data.seq.users = 7;
const courseId = store.Courses.create({ title: 'Synthetic Certificate Course', code: 'TEST-CERT' });
const batch = store.Batches.create({ course_id: courseId, name: 'Synthetic Cohort', instructor_ids: [3] });
const noTrackBatch = store.Batches.create({ course_id: courseId, name: 'Synthetic No Track', instructor_ids: [3] });
for (const id of [2, 5, 7]) store.Enrollments.create(id, batch.id);
store.Enrollments.create(2, noTrackBatch.id);
data.quests.push({ id: 1, batch_id: batch.id, track_key: 'fc01-c-basics', no: 1, title: 'Synthetic Assessment', problems: [{ pid: 1, title: 'Synthetic Task', points: 100 }] });
data.seq.quests = 1;
data.quest_submissions.push({ id: 1, quest_id: 1, pid: 1, user_id: 5, grade: 90, gems: 90, submitted_at: '2026-09-15 12:00:00' });
data.seq.quest_submissions = 1;
store.persist();
const mail = [];
fs.writeFileSync(path.join(runtime, 'mail.json'), '[]');
require('../../mailer').notify = async (to, subject) => {
  mail.push({ to, subject });
  fs.writeFileSync(path.join(runtime, 'mail.json'), JSON.stringify(mail));
  return { sent: false, skipped: true };
};
require('../../ai').enabled = () => false;
const express = require('express');
const listen = express.application.listen;
express.application.listen = function (...args) {
  const server = listen.apply(this, args);
  server.on('listening', () => {
    const jwt = require('jsonwebtoken');
    const { sessionVersion } = require('../../session-security');
    const cookies = Object.fromEntries(users.map(user => [user.id, 'el_token=' + jwt.sign({ id: user.id, sv: sessionVersion(user, process.env.JWT_SECRET) }, process.env.JWT_SECRET)]));
    process.send({ port: server.address().port, cookies, batchId: batch.id, noTrackBatchId: noTrackBatch.id });
  });
  return server;
};
require('../../server');
