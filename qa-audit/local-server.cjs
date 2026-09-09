'use strict';
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const runtime = path.join(__dirname, 'runtime');
fs.mkdirSync(runtime, { recursive: true });
require('dotenv').config = () => ({ parsed: {} });
// Never inherit credentials from the real application's environment.
for (const key of Object.keys(process.env)) {
  if (/^(DATABASE_URL|DIRECT_URL|SMTP_|MAIL_|BULK_|BREVO_|GROQ_|GEMINI_|GOOGLE_|JAAS_|R2_|RENDER|AI_|PROD_DB_MARKER)/.test(key)) delete process.env[key];
}
Object.assign(process.env, {
  NODE_ENV: 'test', DATABASE_URL: '', DIRECT_URL: '', PORT: '4318',
  DB_PATH: path.join(runtime, 'data.json'), UPLOAD_DIR: path.join(runtime, 'uploads'),
  JWT_SECRET: 'local-qa-only-20260909-do-not-deploy', APP_URL: 'http://127.0.0.1:4318',
  ADMISSIONS_EMAIL: 'admissions@qa.invalid', FINANCE_EMAIL: 'finance@qa.invalid', MAIL_DRY_RUN: 'true',
});
const store = require('../store');
// A sandbox interruption can happen after the synthetic records are saved but
// before the fixture manifest is written. Recover only this audit's records.
if (!fs.existsSync(path.join(runtime, 'fixtures.json')) && store.Users.all().length) {
  const existing = store.Users.all();
  if (!existing.every(u => u.username.startsWith('qa.') && u.email.endsWith('@qa.invalid'))) throw new Error('Unexpected non-audit records');
  const users = Object.fromEntries(existing.map(u => [u.username.slice(3), { id: u.id, username: u.username, reg_no: u.reg_no }]));
  const batch = store.Batches.all().find(b => b.name === 'QA Synthetic Cohort');
  if (!batch || !users.empty) throw new Error('Incomplete seed requires inspection');
  const track = store.allData().quests.find(q => q.batch_id === batch.id).track_key;
  fs.writeFileSync(path.join(runtime, 'fixtures.json'), JSON.stringify({ users, batchId: batch.id, courseId: batch.course_id, track }, null, 2));
}
if (!fs.existsSync(path.join(runtime, 'fixtures.json'))) {
  if (store.Users.all().length) throw new Error('Refusing to seed over existing records. Use a fresh isolated audit directory.');
  const users = {};
  const roles = ['admin', 'instructor', 'coordinator', 'student', 'free', 'hr', 'finance', 'student_coordinator', 'staff', 'ambassador', 'recruiter'];
  for (const role of roles) {
    const u = store.Users.createFixed({ name: `QA ${role}`, role, username: `qa.${role}`, email: `${role}@qa.invalid`, password: 'LocalQa!2026' });
    u.profile = { phone: '03001234567', whatsapp: '03001234567', city: 'Lahore' };
    u.onboarding_complete = true;
    if (role === 'recruiter') u.status = 'pending';
    users[role] = { id: u.id, username: u.username, reg_no: u.reg_no };
  }
  const empty = store.Users.createFixed({ name: 'QA Empty Student', role: 'student', username: 'qa.empty', email: 'empty@qa.invalid', password: 'LocalQa!2026' });
  empty.profile.phone = '03001234567';
  users.empty = { id: empty.id, username: empty.username, reg_no: empty.reg_no };
  store.loadOfficialCatalogue();
  const course = store.Courses.byCode('SC-01') || store.Courses.all()[0];
  const batch = store.Batches.create({ course_id: course.id, name: 'QA Synthetic Cohort', start_date: '2026-09-01', instructor_ids: [users.instructor.id] });
  store.Enrollments.create(users.student.id, batch.id);
  const track = store.Quests.tracks().find(t => t.course_code === course.code) || store.Quests.tracks()[0];
  store.Quests.install(batch.id, track.key);
  store.Sessions.create({ batch_id: batch.id, week_no: 1, title: 'QA upcoming live class', session_date: '2026-09-15', start_time: '18:00', end_time: '19:00' });
  store.Announcements.create({ batch_id: batch.id, title: 'QA welcome', body: 'Synthetic course announcement for local workflow testing.' }, users.admin.id);
  store.persist();
  fs.writeFileSync(path.join(runtime, 'fixtures.json'), JSON.stringify({ users, batchId: batch.id, courseId: course.id, track: track.key }, null, 2));
}
const qaFixtures = JSON.parse(fs.readFileSync(path.join(runtime, 'fixtures.json'), 'utf8'));
const ambassadorUser = store.Users.byId(qaFixtures.users.ambassador.id);
if (!store.Ambassadors.byUserId(ambassadorUser.id)) store.Ambassadors.create({ name: ambassadorUser.name, email: ambassadorUser.email, university: 'QA University', user_id: ambassadorUser.id }, qaFixtures.users.admin.id);
const staffUser = store.Users.byId(qaFixtures.users.staff.id);
if (!store.StaffRecords.byUserId(staffUser.id)) store.StaffRecords.create({ user_id: staffUser.id, name: staffUser.name, email: staffUser.email, phone: '03001234567', position: 'QA assistant', employment_type: 'paid_staff' });
require('../server');
