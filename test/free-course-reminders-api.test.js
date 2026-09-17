'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { fork } = require('node:child_process'), { once } = require('node:events');
test('admin email enrollment/removal, activity and expiry preserve work and enforce access', { timeout: 45000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-free-reminders-'));
  const child = fork(path.join(__dirname, 'fixtures/free-course-reminders-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [] });
  let logs = ''; child.stdout.on('data', c => logs += c); child.stderr.on('data', c => logs += c);
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; } assert.equal(path.dirname(runtime), os.tmpdir()); assert.ok(path.basename(runtime).startsWith('echolens-free-reminders-')); fs.rmSync(runtime, { recursive: true, force: true }); });
  const ready = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error(logs)), 20000); child.once('message', data => { clearTimeout(timer); resolve(data); }); child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); }); });
  const base = 'http://127.0.0.1:' + ready.port, route = '/api/admin/open-courses/fc01-c-basics/enroll-email';
  async function api(url, role = 'admin', method = 'GET', data) { const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Cookie: ready.cookies[role] } : {}) }, body: data ? JSON.stringify(data) : undefined }); return { status: response.status, data: await response.json() }; }
  const body = { email: ' STUDENT@qa.invalid ' };
  for (const role of [null, 'instructor', 'finance', 'student_coordinator', 'student']) {
    assert.equal((await api(route, role, 'POST', body)).status, role ? 403 : 401);
    assert.equal((await api(route, role, 'DELETE', body)).status, role ? 403 : 401);
  }
  assert.equal((await api(route, 'admin', 'POST', { email: 'invalid' })).status, 400);
  assert.equal((await api(route, 'admin', 'POST', { email: 'finance@qa.invalid' })).status, 404);
  const enrolled = await api(route, 'admin', 'POST', body); assert.equal(enrolled.status, 200);
  assert.ok(enrolled.data.enrollment.expires_at);
  const originalDeadline = enrolled.data.enrollment.expires_at;
  assert.equal((await api(route, 'admin', 'POST', body)).data.enrollment.expires_at, originalDeadline);
  assert.equal((await api('/api/open/activity', 'student', 'POST', { track_key: 'fc01-c-basics' })).status, 200);
  const saved = () => JSON.parse(fs.readFileSync(path.join(runtime, 'store.json')));
  assert.ok(saved().users.find(u => u.role === 'student').profile.free_course_enrollments[0].last_opened_at);
  assert.equal((await api('/api/open/activity', 'student', 'POST', { track_key: 'fc02-cpp-objects' })).status, 403);
  assert.equal((await api(route, 'admin', 'DELETE', body)).status, 200);
  assert.equal((await api('/api/open/activity', 'student', 'POST', { track_key: 'fc01-c-basics' })).status, 403);
  assert.equal((await api('/api/open/enrollments', 'student', 'POST', { track_key: 'fc01-c-basics' })).status, 409);
  assert.equal((await api('/api/public/tracks/fc01-c-basics', 'student')).data.open_levels, 0);
  assert.equal((await api('/api/open/enrollments', 'student')).data.courses.length, 0);
  assert.equal((await api(route, 'admin', 'POST', body)).status, 200);
  const before = saved();
  const restoredDeadline = before.users.find(u => u.role === 'student').profile.free_course_enrollments[0].expires_at;
  const next = once(child, 'message'); child.send({ type: 'sweep', now: new Date(Date.parse(restoredDeadline) - 1).toISOString() }); const [swept] = await next;
  assert.equal(swept.type, 'swept', swept.error); assert.equal(swept.result.expired, 0); // just before the exact deadline
  const again = once(child, 'message'); child.send({ type: 'sweep', now: restoredDeadline }); const [expired] = await again;
  assert.equal(expired.type, 'swept', expired.error); assert.equal(expired.result.expired, 1);
  const after = saved(); assert.deepEqual(after.open_submissions, before.open_submissions); assert.deepEqual(after.certificates, before.certificates);
  assert.equal((await api('/api/public/tracks/fc01-c-basics', 'student')).data.open_levels, 0);
  assert.ok(after.audit_log.some(a => a.action === 'free_course_expired'));
});
