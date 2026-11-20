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

test('closing registration opens nothing - the series waits for admin-set competition dates', () => {
  const ev = series('2026-01-02T00:00'); // registration long closed
  const s = Events.shipLensSchedule(ev);
  assert.equal(s.task_opens_at, null);
  assert.equal(s.submission_deadline, null);
  assert.equal(s.results_due_at, null);
  assert.equal(s.window_set, false);
  assert.equal(Events.shipLensPhase(ev), 'pending');
  assert.equal(Events.status(ev), 'live');
  // An old stored submission date never shows on its own without a task-open date.
  ev.shiplens_submission_deadline = '2099-01-01T00:00';
  assert.equal(Events.shipLensSchedule(ev).submission_deadline, null);
  assert.equal(Events.shipLensPhase(ev), 'pending');
});

test('admin opens and closes the window manually, even after registration closed', () => {
  const ev = series('2026-01-02T00:00');
  const out = Events.setShipLensWindow(ev.id, { task_opens_at: '2026-01-05T09:00', submission_deadline: '2099-02-01T00:00' });
  assert.equal(out.error, undefined);
  assert.equal(out.schedule.task_opens_at, '2026-01-05T09:00');
  assert.equal(out.schedule.submission_deadline, '2099-02-01T00:00');
  assert.equal(out.schedule.results_due_at, Events.shipLensSchedule({ shiplens_task_opens_at: 'x', shiplens_submission_deadline: '2099-02-01T00:00' }).results_due_at,
    'results default to two weeks after submissions close');
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'submission');
  // Close it now: window in the past -> grading, then an explicit results date.
  const closed = Events.setShipLensWindow(ev.id, { task_opens_at: '2026-01-05T09:00', submission_deadline: '2026-01-10T00:00', results_due_at: '2099-03-01T00:00' });
  assert.equal(closed.schedule.results_due_at, '2099-03-01T00:00');
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'grading');
  // Reopen a finished window.
  Events.setShipLensWindow(ev.id, { task_opens_at: '2026-01-05T09:00', submission_deadline: '2099-04-01T00:00' });
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'submission');
  // Move the opening into the future: the brief is hidden again.
  Events.setShipLensWindow(ev.id, { task_opens_at: '2099-05-01T09:00', submission_deadline: '2099-06-01T00:00' });
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'pending');
});

test('clearing the window puts the series back to awaiting admin', () => {
  const ev = series('2026-01-02T00:00');
  Events.setShipLensWindow(ev.id, { task_opens_at: '2026-01-05T09:00', submission_deadline: '2099-02-01T00:00' });
  const out = Events.setShipLensWindow(ev.id, { task_opens_at: '' });
  assert.equal(out.cleared, true);
  assert.equal(out.schedule.window_set, false);
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'pending');
});

test('window validation', () => {
  const ev = series('2099-01-01T10:00');
  assert.match(Events.setShipLensWindow(ev.id, { task_opens_at: '2098-12-31T00:00', submission_deadline: '2099-02-01T00:00' }).error, /before registration closes/);
  assert.match(Events.setShipLensWindow(ev.id, { task_opens_at: '2099-01-02T00:00', submission_deadline: '2099-01-01T12:00' }).error, /close after the task opens/);
  assert.match(Events.setShipLensWindow(ev.id, { task_opens_at: '2099-01-02T00:00', submission_deadline: '' }).error, /submissions close/);
  assert.match(Events.setShipLensWindow(ev.id, { task_opens_at: '2099-01-02T00:00', submission_deadline: '2099-02-01T00:00', results_due_at: '2099-01-20T00:00' }).error, /Results/);
  assert.match(Events.setShipLensWindow(ev.id, { task_opens_at: 'soon', submission_deadline: '2099-02-01T00:00' }).error, /valid/);
  const plain = Events.create({ title: 'Quest', kind: 'quest' }, admin.id);
  assert.match(Events.setShipLensWindow(plain.id, { task_opens_at: '2099-01-02T00:00', submission_deadline: '2099-02-01T00:00' }).error, /not found/);
});

test('registration can be extended until the task opens, without moving the competition dates', () => {
  const ev = series('2099-01-01T10:00');
  const out = Events.extendShipLens(ev.id, { target: 'registration', until: '2099-01-08T10:00' });
  assert.equal(out.error, undefined);
  assert.equal(out.schedule.reg_closes, '2099-01-08T10:00');
  assert.equal(out.schedule.task_opens_at, null, 'nothing is derived from registration any more');
  Events.setShipLensWindow(ev.id, { task_opens_at: '2099-01-10T00:00', submission_deadline: '2099-02-01T00:00' });
  assert.match(Events.extendShipLens(ev.id, { target: 'registration', until: '2099-01-12T00:00' }).error, /move the competition dates first/);
  const back = Events.extendShipLens(ev.id, { target: 'registration', until: '2098-12-20T10:00' });
  assert.equal(back.error, undefined);
  assert.equal(back.schedule.task_opens_at, '2099-01-10T00:00');
  // Registration that has closed (awaiting dates) can still be reopened.
  const closed = series('2026-01-02T00:00');
  assert.equal(Events.extendShipLens(closed.id, { target: 'registration', until: '2099-01-01T00:00' }).error, undefined);
  const released = series('2026-01-02T00:00');
  Events.setShipLensWindow(released.id, { task_opens_at: '2026-01-03T00:00', submission_deadline: '2099-01-01T00:00' });
  assert.match(Events.extendShipLens(released.id, { target: 'registration', until: '2099-01-01T00:00' }).error, /already been released/);
});

test('the legacy submission target only moves the close of a scheduled window', () => {
  const ev = series('2026-01-02T00:00');
  assert.match(Events.extendShipLens(ev.id, { target: 'submission', until: '2099-02-01T00:00' }).error, /competition dates/);
  Events.setShipLensWindow(ev.id, { task_opens_at: '2026-01-03T00:00', submission_deadline: '2026-01-10T00:00' });
  const out = Events.extendShipLens(ev.id, { target: 'submission', until: '2099-02-01T00:00' });
  assert.equal(out.error, undefined);
  assert.equal(out.schedule.task_opens_at, '2026-01-03T00:00');
  assert.equal(out.schedule.submission_deadline, '2099-02-01T00:00');
  assert.equal(Events.shipLensPhase(Events.byId(ev.id)), 'submission');
  assert.ok(Events.extendShipLens(ev.id, { target: 'results', until: '2099-03-01T00:00' }).error);
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

test('admin edits the project brief: goal, deliverables, judging criteria and grading settings', () => {
  const ev = series('2099-01-01T10:00');
  const p = Events.byId(ev.id).problems[0];
  Events.update(ev.id, { title: 'ShipLens 1.3', pass_mark: 70, auto_grade: true,
    problems: [{ ...p, objective: 'New goal', deliverables: '1. Site\n2. README', acceptance_criteria: 'Works on phone\nREADME reproduces it', points: 150, difficulty: 'Medium' }] });
  const after = Events.byId(ev.id);
  assert.equal(after.title, 'ShipLens 1.3');
  assert.equal(after.pass_mark, 70);
  assert.equal(after.auto_grade, true);
  assert.equal(after.problems.length, 1);
  assert.equal(after.problems[0].pid, 1, 'registered teams keep pointing at the same project');
  assert.equal(after.problems[0].objective, 'New goal');
  assert.equal(after.problems[0].acceptance_criteria, 'Works on phone\nREADME reproduces it');
  assert.equal(after.problems[0].points, 150);
  assert.equal(after.problems[0].difficulty, 'Medium');
  assert.equal(after.problems[0].title, p.title, 'untouched fields are kept');
  assert.equal(after.problems[0].visual_url, p.visual_url);
});
