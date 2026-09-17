'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const policy = require('../free-course-policy');
const { createFreeCourseReminders } = require('../free-course-reminders');
function fixture(count = 1) {
  const users = Array.from({ length: count }, (_, i) => ({ id: i + 1, role: 'free', name: 'Sample Learner', email: `learner${i}@qa.invalid`, profile: { free_course_enrollments: [{ track_key: 'sample', enrolled_at: '2026-01-01 09:00:00' }] } }));
  const track = { key: 'sample', title: 'Sample Course', free: true }, sent = [], suppressed = new Set();
  let now = new Date('2026-01-08T09:00:00Z'), persistFailure = false;
  const store = { Users: { all: () => users, byId: id => users.find(u => u.id === id) }, Quests: { trackDef: () => track }, allData: () => ({ open_submissions: [] }),
    persist() {}, pendingPersist: async () => { if (persistFailure) throw Error('Persistence unavailable'); }, Suppressions: { has: email => suppressed.has(email) }, AuditLog: { record() {} },
    OpenQuest: { progress: id => ({ passed: !!users.find(u => u.id === id).completed }), removeEnrollment(id, key, reason, actor, at) { const user = users.find(u => u.id === id); const e = { ...user.profile.free_course_enrollments[0], removed_at: at, removal_reason: reason }; user.profile.free_course_enrollments = [e]; return { enrollment: e }; } } };
  const mailer = { configured: true, send: async message => { sent.push(message); return { sent: true }; } };
  const make = options => createFreeCourseReminders(store, mailer, { clock: () => now, pause: async () => {}, ...options });
  return { users, sent, store, mailer, suppressed, make, at: date => { now = new Date(date); }, failPersist: () => { persistFailure = true; } };
}
test('three calendar months clamp month-end and parse bare timestamps as UTC', () => {
  assert.equal(policy.deadline({ enrolled_at: '2026-01-31 09:30:00' }), '2026-04-30T09:30:00.000Z');
  const e = { enrolled_at: '2026-01-01 09:00:00' };
  assert.equal(policy.expired(e, false, Date.parse('2026-04-01T08:59:59Z')), false);
  assert.equal(policy.expired(e, false, Date.parse('2026-04-01T09:00:00Z')), true);
  assert.equal(policy.expired(e, true, Date.parse('2027-01-01T09:00:00Z')), false);
});
test('one-week inactivity sends once across restarts; opening resets inactivity', async () => {
  const f = fixture(); f.at('2026-01-08T08:59:59Z'); assert.equal((await f.make().run()).sent, 0);
  f.at('2026-01-08T09:00:00Z'); assert.equal((await f.make().run()).sent, 1);
  assert.match(f.sent[0].text, /at least one week/); assert.match(f.sent[0].text, /Remaining time: 83 days/);
  f.at('2026-01-09T09:00:00Z'); assert.equal((await f.make().run()).sent, 0);
  f.users[0].profile.free_course_enrollments[0].last_opened_at = '2026-01-09T09:00:00Z';
  f.at('2026-01-10T09:00:00Z'); assert.equal((await f.make().run()).sent, 0);
});
test('fortnightly reminders show current time remaining and skip stale periods', async () => {
  const f = fixture(); f.at('2026-01-15T09:00:00Z'); assert.equal((await f.make().run()).sent, 1);
  assert.match(f.sent[0].text, /Remaining time: 76 days/);
  f.at('2026-02-12T09:00:00Z'); assert.equal((await f.make().run()).sent, 1);
  assert.equal(f.users[0].profile.free_course_enrollments[0].reminders.deliveries.at(-1).interval, 3);
});
test('expiry removes incomplete seats with mail disabled; completed seats remain', async () => {
  const f = fixture(2); f.users[1].completed = true; f.mailer.configured = false;
  f.at('2026-04-01T09:00:00Z'); const result = await f.make().run(); assert.equal(result.expired, 1);
  assert.equal(f.users[0].profile.free_course_enrollments[0].removal_reason, 'expired');
  assert.equal(f.users[1].profile.free_course_enrollments[0].removed_at, undefined);
  f.mailer.configured = true; assert.equal((await f.make().run()).sent, 1);
  assert.match(f.sent[0].text, /window has ended/); assert.equal((await f.make().run()).sent, 0);
});
test('completed, manually removed, suppressed and staff accounts receive no reminders', async () => {
  const f = fixture(4); f.users[0].completed = true;
  Object.assign(f.users[1].profile.free_course_enrollments[0], { removed_at: '2026-01-04', removal_reason: 'admin' });
  f.suppressed.add(f.users[2].email); f.users[3].role = 'admin';
  assert.equal((await f.make().run()).sent, 0);
});
test('undated legacy enrollments receive a three-month window without immediate reminders', async () => {
  const f = fixture(); delete f.users[0].profile.free_course_enrollments[0].enrolled_at;
  assert.equal((await f.make().run()).sent, 0);
  const enrollment = f.users[0].profile.free_course_enrollments[0];
  assert.equal(enrollment.expires_at, '2026-04-08T09:00:00.000Z');
  assert.equal(enrollment.deadline_origin, 'legacy-undated-first-check');
});
test('failed persistence prevents mail; uncertain delivery is never blindly retried', async () => {
  const f = fixture(); f.failPersist(); await assert.rejects(f.make().run(), /Persistence/); assert.equal(f.sent.length, 0);
  const g = fixture(); g.mailer.send = async () => { throw Error('Transport timeout'); };
  assert.equal((await g.make().run()).failed, 1); g.at('2026-01-09T09:00:00Z');
  assert.equal((await g.make().run()).attempted, 0);
});
test('hourly runs cap recipients and stop at three failures; concurrent sweeps share one run', async () => {
  const f = fixture(5); const service = f.make({ maxPerRun: 2 });
  await Promise.all([service.run(), service.run()]); assert.equal(f.sent.length, 2);
  const g = fixture(5); g.mailer.send = async () => ({ sent: false }); assert.equal((await g.make().run()).attempted, 3);
});
