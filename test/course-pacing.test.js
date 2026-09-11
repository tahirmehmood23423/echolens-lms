'use strict';
const test = require('node:test');
const assert = require('node:assert');
const P = require('../course-pacing');

const HOUR = 3600_000;
const T0 = Date.parse('2026-09-11T08:00:00.000Z');
const at = (h) => new Date(T0 + h * HOUR).toISOString();

const track = {
  levels: [
    { no: 1, title: 'One', problems: [{ pid: 1 }, { pid: 2 }] },
    { no: 2, title: 'Two', problems: [{ pid: 1 }, { pid: 2, optional: true }] },
    { no: 3, title: 'Three', problems: [{ pid: 1 }] },
  ],
};
const sub = (level, pid, hoursAgo, score = null) => ({ level, pid, assessment_kind: 'assignment', submitted_at: at(hoursAgo), score });

test('a grade stays hidden for 12 hours, then releases', () => {
  const graded = sub(1, 1, 0, 90);
  assert.equal(P.isReleased(graded, T0 + 11 * HOUR), false, '11h: still held');
  assert.equal(P.isReleased(graded, T0 + 12 * HOUR), true, '12h: released');

  const held = P.publicSubmission(graded, T0 + 2 * HOUR);
  assert.equal(held.score, null, 'score is stripped while held');
  assert.equal(held.feedback, null);
  assert.equal(held.grade_pending, true);
  assert.equal(held.grade_release_at, at(12), 'UI can count down to the release');

  const shown = P.publicSubmission(graded, T0 + 13 * HOUR);
  assert.equal(shown.score, 90, 'score is visible once due');
  assert.equal(shown.grade_released, true);
});

test('an ungraded submission reports when its grade is due, and never leaks a score', () => {
  const pending = P.publicSubmission(sub(1, 1, 0, null), T0 + HOUR);
  assert.equal(pending.score, null);
  assert.equal(pending.grade_release_at, at(12), 'learner is told when to come back');
});

test('module 2 stays locked until every required problem in module 1 is released', () => {
  const partly = [sub(1, 1, -13, 80)]; // only one of the two required problems
  let states = P.moduleStates(track, partly, T0);
  assert.equal(states[0].status, 'open');
  assert.equal(states[1].status, 'locked');
  assert.match(states[1].reason, /previous module/i);

  // Both graded but the second is still inside its 12h hold -> still locked.
  const held = [sub(1, 1, -13, 80), sub(1, 2, -2, 70)];
  states = P.moduleStates(track, held, T0);
  assert.equal(states[1].status, 'locked', 'a held grade does not unlock the next module');

  // Both released, and 24h have passed since module 1 was opened.
  const done = [sub(1, 1, -30, 80), sub(1, 2, -26, 70)];
  states = P.moduleStates(track, done, T0);
  assert.equal(states[0].status, 'complete');
  assert.equal(states[1].status, 'available');
  assert.equal(states[2].status, 'locked', 'module 3 waits on module 2');
});

test('optional problems do not hold a module back', () => {
  // Module 2's pid 2 is optional: pid 1 alone completes it.
  const s = [sub(1, 1, -60, 80), sub(1, 2, -60, 70), sub(2, 1, -30, 75)];
  const states = P.moduleStates(track, s, T0);
  assert.equal(states[1].status, 'complete', 'optional problem is not required');
  assert.equal(states[2].status, 'available');
});

test('a new module cannot be opened within 24h of the previous one', () => {
  // Module 1 opened 20h ago and is fully released, but the day is not up.
  const s = [sub(1, 1, -20, 80), sub(1, 2, -20, 70)];
  const states = P.moduleStates(track, s, T0);
  assert.equal(states[1].status, 'locked');
  assert.equal(states[1].unlocks_at, at(4), 'unlocks 24h after module 1 was opened');
  assert.match(states[1].reason, /One module opens per day/);

  const gate = P.canSubmit(track, s, 2, T0);
  assert.equal(gate.ok, false);
  assert.equal(gate.status, 409);
  assert.equal(gate.unlocks_at, at(4));
});

test('pacing gates the first entry to a module, never resubmission inside it', () => {
  const s = [sub(1, 1, -1, null)];
  assert.equal(P.canSubmit(track, s, 1, T0).ok, true, 'same module: always allowed');
  assert.equal(P.canSubmit(track, [], 1, T0).ok, true, 'module 1 is open from the start');
  assert.equal(P.canSubmit(track, [], 2, T0).ok, false, 'module 2 is not');
  assert.equal(P.canSubmit(track, [], 99, T0).status, 404, 'unknown module');
});

test('two active courses at a time; completed and waitlisted courses do not occupy a slot', () => {
  assert.equal(P.canEnroll([]).ok, true);
  assert.equal(P.canEnroll([{ completed: false }]).ok, true);

  const full = P.canEnroll([{ completed: false }, { completed: false }]);
  assert.equal(full.ok, false);
  assert.equal(full.status, 409);
  assert.match(full.error, /Finish one of your current courses/);

  assert.equal(P.canEnroll([{ completed: true }, { completed: false }]).ok, true, 'finishing frees a slot');
  assert.equal(P.canEnroll([{ waitlisted: true }, { waitlisted: true }, { completed: false }]).ok, true,
    'reserving an unlaunched course costs nothing');
  assert.equal(P.activeCourseCount([{ completed: true }, { waitlisted: true }, { completed: false }]), 1);
});

test('staff-reviewed capstones are never held - the hold only buys the AI grader quota room', () => {
  const capstone = { level: 0, pid: 0, assessment_kind: 'capstone', submitted_at: at(0), score: 90 };
  assert.equal(P.isReleased(capstone, T0 + 60_000), true, 'visible as soon as staff grade it');
  assert.equal(P.publicSubmission(capstone, T0 + 60_000).score, 90);
  assert.equal(P.isHeldKind(capstone), false);
  assert.equal(P.isHeldKind({ level: 1, pid: 1 }), true, 'assignments default to held');
});

test('a seat is confirmed an hour after enrolling, not on enrolling', () => {
  const e = { enrolled_at: at(0), activates_at: P.activatesAt(at(0)) };
  assert.equal(e.activates_at, at(1), 'confirmation lands one hour later');
  assert.equal(P.isEnrollmentActive(e, T0), false, 'not active at enrolment');
  assert.equal(P.isEnrollmentActive(e, T0 + 59 * 60_000), false, 'still not at 59 min');
  assert.equal(P.isEnrollmentActive(e, T0 + HOUR), true, 'active on the hour');
  assert.match(P.confirmationNote(e, T0 + 20 * 60_000), /about 40 minutes/);
  assert.equal(P.confirmationNote(e, T0 + HOUR), null, 'no note once confirmed');
});

test('an enrolment predating the confirmation rule is never locked out', () => {
  assert.equal(P.isEnrollmentActive({ enrolled_at: at(-100) }), true, 'no activates_at means already open');
  assert.equal(P.isEnrollmentActive(null), false, 'but no enrolment at all is not access');
});

// Regression: store.js's now() renders UTC as 'YYYY-MM-DD HH:mm:ss', which
// Date.parse reads as LOCAL time. Parsed naively, every deadline shifted by the
// host's UTC offset - the 12h hold ran 7h on UTC+5 and 17h on UTC-5, and the 1h
// enrolment hold expired before it started. It only looked correct because
// Render runs UTC.
test('bare store timestamps are read as UTC, so holds do not shift with the host timezone', () => {
  const bare = '2026-09-11 08:00:00';          // store.js now() format, UTC
  const explicit = '2026-09-11T08:00:00.000Z'; // the same instant, zoned
  assert.equal(P.activatesAt(bare), P.activatesAt(explicit), 'both parse to the same instant');
  assert.equal(P.activatesAt(bare), '2026-09-11T09:00:00.000Z');
  assert.equal(P.releaseAt(bare), '2026-09-11T20:00:00.000Z', '12h after 08:00 UTC');

  // A seat taken "now" in store format must never already be confirmed.
  const storeNow = new Date().toISOString().replace('T', ' ').slice(0, 19);
  assert.equal(P.isEnrollmentActive({ activates_at: P.activatesAt(storeNow) }), false,
    'a brand-new seat is not instantly active');
  // And a grade submitted "now" must not already be released.
  assert.equal(P.isReleased({ score: 80, submitted_at: storeNow, level: 1, pid: 1 }), false,
    'a brand-new grade is not instantly released');
});
