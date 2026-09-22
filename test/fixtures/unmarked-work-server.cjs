'use strict';
// Real HTTP server with synthetic free-course work wedged in every state that
// can leave a learner unmarked, so the admin report can be checked end to end.
const path = require('node:path');
require('dotenv').config = () => ({ parsed: {} });
for (const key of Object.keys(process.env)) if (/^(DATABASE_URL|DIRECT_URL|SMTP_|MAIL_|BULK_|BREVO_|ZEPTO|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|AWS_|RENDER|AI_|ADMISSIONS_|FINANCE_)/.test(key)) delete process.env[key];
const runtime = process.env.ECHOLENS_TEST_RUNTIME;
if (!runtime) throw Error('Isolated test runtime required');
Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '0', DB_PATH: path.join(runtime, 'store.json'), UPLOAD_DIR: path.join(runtime, 'uploads'), JWT_SECRET: 'synthetic-unmarked-test-secret', MAIL_DRY_RUN: 'true' });
const store = require('../../store');
const users = [
  { id: 1, name: 'Synthetic admin', username: 'admin', role: 'admin', email: 'admin@qa.invalid', onboarding_complete: true },
  { id: 2, name: 'Synthetic learner', username: 'student', role: 'student', email: 'student@qa.invalid', onboarding_complete: true },
  { id: 3, name: 'Synthetic instructor', username: 'instructor', role: 'instructor', email: 'instructor@qa.invalid', onboarding_complete: true },
];
store.allData().users = users; store.allData().seq.users = users.length;
store.loadOfficialCatalogue();
const TRACK = 'fc01-c-basics';
const old = new Date(Date.now() - 30 * 3600 * 1000).toISOString(); // well past the 8 h window
const data = store.allData();
let sid = 0, aid = 0;
const sub = (over) => { const s = { id: ++sid, user_id: 2, track_key: TRACK, assessment_kind: 'assignment', problem_title: 'Synthetic task', points: 100, score: null, gems: 0, feedback: null, graded_at: null, code: 'int main(){return 0;}', language: 'c', submitted_at: old, attempts: 1, ...over }; data.open_submissions.push(s); return s; };
const att = (s, over) => { const a = { id: ++aid, user_id: s.user_id, submission_id: s.id, request_key: 'synthetic-' + s.id, track_key: s.track_key, level: s.level, pid: s.pid, status: 'queued', payload: { assessment_kind: 'assignment', code: s.code, language: 'c', tries: 0 }, created_at: old, updated_at: old, ...over }; data.open_attempts.push(a); return a; };
// 1. Marked already - must never appear.
att(sub({ level: 1, pid: 1, score: 88, gems: 88, graded_at: old }), { status: 'completed' });
// 2. Automatic grading gave up.
att(sub({ level: 2, pid: 1 }), { status: 'failed', payload: { assessment_kind: 'assignment', code: 'x', tries: 20, error: 'Groq quota exhausted' } });
// 3. Still queued long after the grading window closed. Parked on a future
// retry so the live worker leaves it alone - the point is that nothing is
// going to mark it before the deadline it has already missed.
att(sub({ level: 3, pid: 1 }), { status: 'queued', payload: { assessment_kind: 'assignment', code: 'x', tries: 6, retry_at: new Date(Date.now() + 3600 * 1000).toISOString() } });
// 4. Submission that never got an attempt row at all.
sub({ level: 4, pid: 1 });
data.seq.open_submissions = sid; data.seq.open_attempts = aid;
users[1].profile = { free_course_enrollments: [{ track_key: TRACK, enrolled_at: old, activates_at: old, confirmed_at: old, reminders: { deliveries: [] } }] };
store.persist();
const mailer = require('../../mailer');
mailer.configured = true; mailer.send = async () => ({ sent: true }); mailer.notify = async () => ({ sent: false });
require('../../ai').enabled = () => false;
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
