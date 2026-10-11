'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

process.env.DB_PATH = path.join(os.tmpdir(), `echolens-shiplens-extend-${crypto.randomUUID()}.json`);
const { Users, Events, Challans } = require('../store');
const { project } = require('../shiplens-content');

const admin = Users.createFixed({ name: 'Extend Admin', role: 'admin', username: 'shiplens.extend',
  email: 'extend@example.com', password: 'TestPassword123!' });
const series = (ends_at) => Events.create({ title: 'ShipLens extend', kind: 'competition', series_kind: 'shiplens',
  entry: 'paid', scope: 'both', starts_at: '2026-01-01T00:00', ends_at, problems: [project] }, admin.id);

test('extending registration moves the task release and every later date', () => {
  const ev = series('2099-01-01T10:00');
  const before = Events.shipLensSchedule(ev);
  const out = Events.extendShipLens(ev.id, { target: 'registration', until: '2099-01-08T10:00' });
  assert.equal(out.error, undefined);
  const after = out.schedule;
  assert.equal(after.reg_closes, '2099-01-08T10:00');
  assert.ok(after.task_opens_at > before.task_opens_at);
  assert.ok(after.submission_deadline > before.submission_deadline);
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'registration');
});

test('registration extension must be later and is refused once the task is released', () => {
  const ev = series('2099-01-01T10:00');
  assert.match(Events.extendShipLens(ev.id, { target: 'registration', until: '2098-12-01T10:00' }).error, /later/);
  const released = series('2026-01-02T00:00'); // task window long over
  assert.match(Events.extendShipLens(released.id, { target: 'registration', until: '2099-01-01T00:00' }).error, /already been released/);
});

test('extending submission reopens the window without moving the task release', () => {
  const ev = series('2026-01-02T00:00'); // phase is closed by now
  const before = Events.shipLensSchedule(ev);
  const out = Events.extendShipLens(ev.id, { target: 'submission', until: '2099-02-01T00:00' });
  assert.equal(out.error, undefined);
  assert.equal(out.schedule.task_opens_at, before.task_opens_at);
  assert.equal(out.schedule.submission_deadline, '2099-02-01T00:00');
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'submission');
  assert.match(Events.extendShipLens(ev.id, { target: 'submission', until: '2099-01-01T00:00' }).error, /later/);
});

test('rejects bad input and non-ShipLens events', () => {
  const ev = series('2099-01-01T10:00');
  assert.ok(Events.extendShipLens(ev.id, { target: 'registration', until: 'soon' }).error);
  assert.ok(Events.extendShipLens(ev.id, { target: 'results', until: '2099-03-01T00:00' }).error);
  const plain = Events.create({ title: 'Quest', kind: 'quest' }, admin.id);
  assert.match(Events.extendShipLens(plain.id, { target: 'submission', until: '2099-03-01T00:00' }).error, /not found/);
});

test('a registration extension uses the exact chosen date and moves unpaid challan pay-by dates', () => {
  const owner = Users.createFixed({ name: 'Date Lead', role: 'free', username: 'shiplens.date',
    email: 'date@example.com', password: 'TestPassword123!' });
  const ev = series('2099-01-01T10:00');
  const reg = Events.register({ event_id: ev.id, user: owner, challenge_pid: 1,
    team_details: [{ name: 'Date Lead', email: 'date@example.com', whatsapp: '03001234567', university: 'Uni', year: '2' }] });
  assert.equal(reg.error, undefined);
  const out = Events.extendShipLens(ev.id, { target: 'registration', until: '2099-01-03T18:30' });
  assert.equal(out.error, undefined);
  assert.equal(out.schedule.reg_closes, '2099-01-03T18:30');
  assert.equal(Challans.bySerial(reg.challan.serial).deadline, '2099-01-03');
});
