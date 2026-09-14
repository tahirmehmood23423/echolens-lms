'use strict';
/**
 * The pacing rules as the API actually applies them: through OpenQuest, on a
 * real free track, with a real store. course-pacing.test.js proves the rules;
 * this proves they are wired in and cannot be walked around.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
process.env.DB_PATH = path.join(os.tmpdir(), `echolens-pacing-${crypto.randomUUID()}.json`);

const store = require('../store');
const { Quests, OpenQuest, Users } = store;
const pacing = require('../course-pacing');

const HOUR = 3600_000;
// Free tracks that actually pass OpenQuest.enroll's catalogue gate. trackDef()
// (not tracks()) is what carries `levels` - tracks() returns summaries only.
const KEYS = ['fc01-c-basics', 'fc02-cpp-objects', 'cs104-python'];
const [track, other, third] = KEYS.map((k) => Quests.trackDef(k));
const modules = pacing.modulesOf(track);

function learner(id, name) {
  const data = store.allData();
  data.users = data.users.filter((u) => u.id !== id);
  data.users.push({ id, role: 'free', name, email: `pacing${id}@example.com`, reg_no: 'P' + id, profile: {} });
  return Users.byId(id);
}
function seedModule(uid, module_, hoursAgo, score) {
  const data = store.allData();
  for (const level of module_.levels) {
    for (const p of pacing.requiredProblems(level)) {
      data.open_submissions.push({
        id: (data.seq.open_submissions = (data.seq.open_submissions || 0) + 1),
        user_id: uid, track_key: track.key, assessment_kind: 'assignment',
        level: level.no, pid: p.pid, problem_title: p.title || 'seeded', points: p.points || 30,
        score, gems: score ? Math.round((score / 100) * (p.points || 30)) : 0,
        feedback: score != null ? 'Seeded feedback.' : null, attempts: 1,
        submitted_at: new Date(Date.now() - hoursAgo * HOUR).toISOString(),
      });
    }
  }
}
function reset(uid) {
  const data = store.allData();
  data.open_submissions = data.open_submissions.filter((s) => s.user_id !== uid);
  data.open_attempts = data.open_attempts.filter((a) => a.user_id !== uid);
  const u = Users.byId(uid);
  if (u) u.profile = {};
}
/** Enrol and backdate the seat past its one-hour confirmation window. */
function enrolConfirmed(uid, key = track.key) {
  const out = OpenQuest.enroll(uid, key);
  if (out.error) throw new Error('enrol failed: ' + out.error);
  const u = Users.byId(uid);
  u.profile.free_course_enrollments = u.profile.free_course_enrollments.map((e) =>
    e.track_key === key ? { ...e, activates_at: new Date(Date.now() - HOUR).toISOString() } : e);
  return OpenQuest.enrollment(uid, key);
}
const submitTo = (u, level, pid, key) =>
  OpenQuest.submit({ user: u, track_key: track.key, level, pid, code: 'int main(){}', language: 'c', request_key: key, fingerprint: key });

test('the free tracks group into far fewer modules than levels', () => {
  assert.ok(modules.length >= 2, 'need a multi-module track');
  assert.ok(modules.length < track.levels.length, `${track.key}: ${track.levels.length} levels collapse to ${modules.length} modules`);
  assert.equal(modules[0].levels.length >= 1, true);
  // Every level belongs to exactly one module.
  const seen = modules.flatMap((m) => m.levels.map((l) => l.no));
  assert.equal(new Set(seen).size, track.levels.length);
});

test('a later module opens the moment the previous one is graded', () => {
  const u = learner(9101, 'Paced Learner');
  reset(u.id);
  enrolConfirmed(u.id);
  const m2 = modules[1];
  const entry = m2.levels[0];
  const pid = pacing.requiredProblems(entry)[0].pid;

  const blocked = submitTo(u, entry.no, pid, 'pacing-locked-000001');
  assert.equal(blocked.status, 409, 'module 2 is locked from the start');
  assert.match(blocked.error, /previous module is graded/i);

  // Module 1 submitted but NOT yet graded: module 2 stays shut.
  seedModule(u.id, modules[0], 0.1, null);
  const ungraded = submitTo(u, entry.no, pid, 'pacing-locked-000002');
  assert.equal(ungraded.status, 409, 'a submitted-but-ungraded module does not unlock the next');

  // Graded ten minutes ago - no clock, no daily cap, it opens straight away.
  reset(u.id);
  enrolConfirmed(u.id);
  seedModule(u.id, modules[0], 0.16, 80);
  const ok = submitTo(u, entry.no, pid, 'pacing-open-000001');
  assert.ok(!ok.error, 'module 2 opens as soon as module 1 is graded: ' + ok.error);

  // ...and a second problem in the SAME module is never gated.
  const sibling = m2.levels[m2.levels.length - 1];
  const ok2 = submitTo(u, sibling.no, pacing.requiredProblems(sibling)[0].pid, 'pacing-open-000002');
  assert.ok(!ok2.error, 'same module stays open: ' + ok2.error);
});

test('a grade is visible as soon as it is awarded, and a pending one names its deadline', () => {
  const u = learner(9102, 'Graded Learner');
  reset(u.id);
  const level = modules[0].levels[0];
  const pid = pacing.requiredProblems(level)[0].pid;

  // Graded a minute ago - nothing is held back.
  seedModule(u.id, modules[0], 0.02, 95);
  const shown = OpenQuest.progress(u.id, track.key);
  const cell = shown.submissions[`${level.no}:${pid}`];
  assert.equal(cell.score, 95, 'the score is visible immediately');
  assert.equal(cell.grade_pending, false);
  assert.ok(shown.gems > 0, 'and it counts toward gems right away');
  assert.equal(shown.awaiting_grades, 0);

  // Submitted but not yet graded - the learner is told when it is due.
  reset(u.id);
  seedModule(u.id, modules[0], 0.02, null);
  const pending = OpenQuest.progress(u.id, track.key);
  const waiting = pending.submissions[`${level.no}:${pid}`];
  assert.equal(waiting.score, null);
  assert.equal(waiting.grade_pending, true);
  assert.ok(waiting.grade_due_by, 'the deadline is published');
  assert.ok(pending.awaiting_grades > 0);
  assert.equal(pending.grading_window_hours, 8);
});

test('progress reports a module map the catalogue can render', () => {
  const u = learner(9103, 'Map Learner');
  reset(u.id);
  const map = OpenQuest.progress(u.id, track.key).modules;
  assert.equal(map.length, modules.length);
  assert.equal(map[0].status, 'available', 'module 1 is open to a new learner');
  assert.equal(map[1].status, 'locked');
  assert.ok(map[1].reason, 'a locked module always explains itself');
  assert.ok(Array.isArray(map[0].levels) && map[0].levels.length, 'the map names its levels');
});

test('a learner may hold only two free courses at once', () => {
  const u = learner(9104, 'Busy Learner');
  reset(u.id);

  assert.equal(OpenQuest.enroll(u.id, track.key).existing, false);
  assert.equal(OpenQuest.enroll(u.id, other.key).existing, false);
  const blocked = OpenQuest.enroll(u.id, third.key);
  assert.equal(blocked.status, 409, 'third course is refused');
  assert.match(blocked.error, /Finish one of your current courses/);
  assert.equal(blocked.active, 2);

  // Re-enrolling in a course already held is never blocked by the cap.
  assert.equal(OpenQuest.enroll(u.id, track.key).existing, true);
});

test('reserving a staged course is not an enrollment and costs no slot', (t) => {
  const staged = Quests.tracks({ includeUnpublished: true }).find((x) => OpenQuest.isStaged(x.key));
  if (!staged) return t.skip('needs a staged track');
  const u = learner(9105, 'Waiting Learner');
  reset(u.id);

  assert.equal(OpenQuest.enroll(u.id, staged.key).status, 400, 'a staged course cannot be enrolled in');

  assert.equal(OpenQuest.reserve(u.id, staged.key).existing, false);
  assert.equal(OpenQuest.reserve(u.id, staged.key).existing, true, 'reserving twice is idempotent');

  const list = OpenQuest.waitlist(u.id);
  assert.equal(list.length, 1);
  assert.equal(list[0].waitlisted, true);
  assert.equal(list[0].launched, false);

  // The reservation left both study slots free.
  assert.equal(pacing.canEnroll(OpenQuest.enrollments(u.id)).active, 0);
  assert.equal(OpenQuest.enroll(u.id, track.key).existing, false);
  assert.equal(OpenQuest.enroll(u.id, other.key).existing, false);

  assert.ok(OpenQuest.waitlistFor(staged.key).some((x) => x.id === u.id), 'appears in the launch list');
  OpenQuest.markNotified(u.id, staged.key);
  assert.equal(OpenQuest.waitlistFor(staged.key).some((x) => x.id === u.id), false, 'and is not emailed twice');

  OpenQuest.unreserve(u.id, staged.key);
  assert.equal(OpenQuest.waitlist(u.id).length, 0);
});

test('a free course is shut until the seat is confirmed an hour later', () => {
  const u = learner(9106, 'New Learner');
  reset(u.id);
  const level = modules[0].levels[0];
  const pid = pacing.requiredProblems(level)[0].pid;

  // Not enrolled at all: submission is refused outright.
  const stranger = submitTo(u, level.no, pid, 'seat-none-00000001');
  assert.equal(stranger.status, 403);
  assert.match(stranger.error, /Enroll in this course/i);

  // Enrolled, but inside the confirmation hour: still refused, with the wait.
  const seat = OpenQuest.enroll(u.id, track.key).enrollment;
  assert.equal(seat.active, false, 'a new seat is not active');
  assert.match(seat.confirmation_note, /confirmed in about/i);
  const early = submitTo(u, level.no, pid, 'seat-early-0000001');
  assert.equal(early.status, 409);
  assert.match(early.error, /confirmed/i);
  assert.ok(early.activates_at, 'the learner is told when the seat opens');

  // The slot is consumed while pending - a held seat is a held seat.
  assert.equal(pacing.canEnroll(OpenQuest.enrollments(u.id)).active, 1);

  // Past the hour: confirmed, and work is accepted.
  enrolConfirmed(u.id);
  assert.equal(OpenQuest.enrollment(u.id, track.key).active, true);
  const ok = submitTo(u, level.no, pid, 'seat-ready-0000001');
  assert.ok(!ok.error, 'confirmed seat accepts work: ' + ok.error);
});

test('the confirmation sweep emails each seat exactly once', () => {
  const u = learner(9107, 'Sweep Learner');
  reset(u.id);
  OpenQuest.enroll(u.id, track.key);
  assert.equal(OpenQuest.dueForConfirmation().some((r) => r.user.id === u.id), false, 'not due inside the hour');

  enrolConfirmed(u.id); // backdate past the window
  const due = OpenQuest.dueForConfirmation();
  assert.ok(due.some((r) => r.user.id === u.id), 'due once the hour has passed');
  assert.equal(due.find((r) => r.user.id === u.id).title, track.title);

  OpenQuest.markConfirmationAttempt(u.id, track.key, { sent: false, error: 'Temporary mail failure' });
  assert.equal(OpenQuest.dueForConfirmation().some((r) => r.user.id === u.id), false, 'failed mail observes a retry cooldown');
  const pending = Users.byId(u.id).profile.free_course_enrollments.find((e) => e.track_key === track.key);
  pending.confirmation_email_attempted_at = new Date(Date.now() - 16 * 60_000).toISOString();
  assert.equal(OpenQuest.dueForConfirmation().some((r) => r.user.id === u.id), true, 'failed mail becomes retryable');

  OpenQuest.markConfirmationAttempt(u.id, track.key, { sent: true });
  assert.equal(OpenQuest.dueForConfirmation().some((r) => r.user.id === u.id), false, 'never emailed twice');
  assert.equal(OpenQuest.enrollment(u.id, track.key).active, true, 'and access is unaffected by the email');
});

test('the learner is told once - and only once - when the next module opens', () => {
  const u = learner(9108, 'Unlock Learner');
  reset(u.id);
  enrolConfirmed(u.id);

  // Nothing to announce before module 1 is finished.
  assert.equal(OpenQuest.moduleUnlockToAnnounce(u.id, track.key), null, 'nothing at the start');
  seedModule(u.id, modules[0], 0.1, null); // submitted, ungraded
  assert.equal(OpenQuest.moduleUnlockToAnnounce(u.id, track.key), null, 'nothing while it is being graded');

  // Grade module 1 -> module 2 opens and is announced exactly once.
  reset(u.id);
  enrolConfirmed(u.id);
  seedModule(u.id, modules[0], 0.1, 80);
  const out = OpenQuest.moduleUnlockToAnnounce(u.id, track.key);
  assert.ok(out, 'the unlock is announced');
  assert.equal(out.module.no, 2);
  assert.equal(out.previous.no, 1);
  assert.equal(out.course, track.title);
  assert.ok(out.user.email);

  assert.equal(OpenQuest.moduleUnlockToAnnounce(u.id, track.key), null, 'never announced twice');

  // A regrade of the same module must not re-announce it either.
  const data = store.allData();
  for (const s of data.open_submissions.filter((s) => s.user_id === u.id)) s.score = 90;
  assert.equal(OpenQuest.moduleUnlockToAnnounce(u.id, track.key), null, 'a regrade does not re-announce');

  // Finishing module 2 announces module 3 - a different, separate unlock.
  seedModule(u.id, modules[1], 0.05, 85);
  const next = OpenQuest.moduleUnlockToAnnounce(u.id, track.key);
  assert.ok(next, 'the following unlock is announced in its turn');
  assert.equal(next.module.no, 3);
});

test('module 1 is never announced - there is no unlock to report', () => {
  const u = learner(9109, 'Fresh Learner');
  reset(u.id);
  enrolConfirmed(u.id);
  assert.equal(OpenQuest.moduleUnlockToAnnounce(u.id, track.key), null);
});
