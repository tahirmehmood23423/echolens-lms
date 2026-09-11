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

/* --------------------------- the 8-hour window --------------------------- */

test('a grade shows the moment it is awarded - the 8 hours is a promise, not a delay', () => {
  const justGraded = sub(1, 1, 0, 90);
  assert.equal(P.isGraded(justGraded), true);
  const view = P.publicSubmission(justGraded, T0 + 60_000);
  assert.equal(view.score, 90, 'no hold: the score is visible one minute later');
  assert.equal(view.grade_pending, false);
  assert.equal(view.grade_due_by, null, 'nothing is owed once it is graded');
});

test('a pending submission carries the deadline it is promised by', () => {
  const pending = P.publicSubmission(sub(1, 1, 0, null), T0 + HOUR);
  assert.equal(pending.score, null);
  assert.equal(pending.grade_pending, true);
  assert.equal(pending.grade_due_by, at(8), 'due 8 hours after submitting');
  assert.equal(pending.grade_overdue, false);

  const late = P.publicSubmission(sub(1, 1, -9, null), T0);
  assert.equal(late.grade_overdue, true, 'past the window, the promise is broken');
});

test('the grading window is what the worker retries across', () => {
  assert.equal(P.withinGradingWindow(at(0), T0 + 7 * HOUR), true);
  assert.equal(P.withinGradingWindow(at(0), T0 + 8 * HOUR), false, 'give up at the deadline');
  assert.equal(P.GRADING_WINDOW_HOURS, 8);
});

/* ------------------------- one module at a time ------------------------- */

test('module 2 opens the moment module 1 is fully graded - no clock, no daily cap', () => {
  // Only one of module 1's two required problems is graded.
  let states = P.moduleStates(track, [sub(1, 1, -1, 80)], T0);
  assert.equal(states[0].status, 'open');
  assert.equal(states[1].status, 'locked');
  assert.match(states[1].reason, /as soon as the previous module is graded/i);

  // Both graded, ten minutes ago: module 2 is open immediately.
  states = P.moduleStates(track, [sub(1, 1, -1, 80), sub(1, 2, -0.16, 70)], T0);
  assert.equal(states[0].status, 'complete');
  assert.equal(states[1].status, 'available', 'graded means open, right away');
  assert.equal(states[2].status, 'locked', 'module 3 still waits on module 2');
});

test('an open module waiting on the grader says so, and names the deadline', () => {
  const states = P.moduleStates(track, [sub(1, 1, -1, 80), sub(1, 2, -1, null)], T0);
  assert.equal(states[0].status, 'open');
  assert.equal(states[0].awaiting_grades, 1);
  assert.match(states[0].reason, /results arrive within 8 hours/i);
  assert.equal(states[0].unlocks_at, at(7), 'the pending grade is due 8h after it was submitted');
  assert.equal(states[1].status, 'locked');
});

test('optional problems do not hold a module back', () => {
  const s = [sub(1, 1, -2, 80), sub(1, 2, -2, 70), sub(2, 1, -1, 75)];
  const states = P.moduleStates(track, s, T0);
  assert.equal(states[1].status, 'complete', 'module 2 pid 2 is optional');
  assert.equal(states[2].status, 'available');
});

test('pacing gates the first entry to a module, never resubmission inside it', () => {
  assert.equal(P.canSubmit(track, [sub(1, 1, -1, null)], 1, T0).ok, true, 'same module: always allowed');
  assert.equal(P.canSubmit(track, [], 1, T0).ok, true, 'module 1 is open from the start');
  const blocked = P.canSubmit(track, [], 2, T0);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 409);
  assert.equal(P.canSubmit(track, [], 99, T0).status, 404, 'unknown module');
});

/* ------------------------------ enrolment ------------------------------ */

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

/* ------------------------------ regression ------------------------------ */

// store.js's now() renders UTC as 'YYYY-MM-DD HH:mm:ss', which Date.parse reads
// as LOCAL time. Parsed naively, every deadline shifted by the host's UTC
// offset - the grading window and the 1h enrolment hold both drifted, and
// learning-attempts.js delayed each retry by the same amount. It only looked
// correct because Render runs UTC.
test('bare store timestamps are read as UTC, so deadlines do not shift with the host timezone', () => {
  const bare = '2026-09-11 08:00:00';          // store.js now() format, UTC
  const explicit = '2026-09-11T08:00:00.000Z'; // the same instant, zoned
  assert.equal(P.parseTimestamp(bare), P.parseTimestamp(explicit), 'both parse to one instant');
  assert.equal(P.activatesAt(bare), '2026-09-11T09:00:00.000Z');
  assert.equal(P.gradeDueBy(bare), '2026-09-11T16:00:00.000Z', '8h after 08:00 UTC');

  // A seat taken "now" in store format must never already be confirmed.
  const storeNow = new Date().toISOString().replace('T', ' ').slice(0, 19);
  assert.equal(P.isEnrollmentActive({ activates_at: P.activatesAt(storeNow) }), false,
    'a brand-new seat is not instantly active');
  assert.equal(P.withinGradingWindow(storeNow), true,
    'a brand-new submission is inside its grading window');
});
