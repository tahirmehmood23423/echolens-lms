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

test('a later module is refused until the previous one is graded and released', () => {
  const u = learner(9101, 'Paced Learner');
  reset(u.id);
  const m2 = modules[1];
  const entry = m2.levels[0];
  const pid = pacing.requiredProblems(entry)[0].pid;

  const blocked = submitTo(u, entry.no, pid, 'pacing-locked-000001');
  assert.equal(blocked.status, 409, 'module 2 is locked from the start');
  assert.match(blocked.error, /previous module/i);

  // Module 1 graded 14h ago: past the 12h hold so it counts as complete, but
  // less than 24h since it was opened - now the daily gate is what blocks.
  seedModule(u.id, modules[0], 14, 80);
  const tooSoon = submitTo(u, entry.no, pid, 'pacing-locked-000002');
  assert.equal(tooSoon.status, 409);
  assert.match(tooSoon.error, /One module opens per day/);
  assert.ok(tooSoon.unlocks_at, 'the learner is told when it opens');

  // Same work, 30h ago: released, and a day has passed.
  reset(u.id);
  seedModule(u.id, modules[0], 30, 80);
  const ok = submitTo(u, entry.no, pid, 'pacing-open-000001');
  assert.ok(!ok.error, 'module 2 opens: ' + ok.error);

  // ...and a second problem in the SAME module is never gated.
  const sibling = m2.levels[m2.levels.length - 1];
  const ok2 = submitTo(u, sibling.no, pacing.requiredProblems(sibling)[0].pid, 'pacing-open-000002');
  assert.ok(!ok2.error, 'same module stays open: ' + ok2.error);
});

test('a fresh grade is withheld from progress, gems and average for 12 hours', () => {
  const u = learner(9102, 'Held Learner');
  reset(u.id);
  const level = modules[0].levels[0];
  const pid = pacing.requiredProblems(level)[0].pid;
  seedModule(u.id, modules[0], 1, 95); // graded an hour ago

  const held = OpenQuest.progress(u.id, track.key);
  const cell = held.submissions[`${level.no}:${pid}`];
  assert.equal(cell.score, null, 'score hidden');
  assert.equal(cell.feedback, null, 'feedback hidden');
  assert.equal(cell.grade_pending, true);
  assert.ok(cell.grade_release_at, 'the release time is published');
  assert.equal(held.gems, 0, 'gems must not leak the score');
  assert.equal(held.avg, null, 'nor the average');
  assert.ok(held.awaiting_release > 0);

  // The same work, 13h old, is fully visible.
  reset(u.id);
  seedModule(u.id, modules[0], 13, 95);
  const shown = OpenQuest.progress(u.id, track.key);
  assert.equal(shown.submissions[`${level.no}:${pid}`].score, 95);
  assert.ok(shown.gems > 0);
  assert.equal(shown.awaiting_release, 0);
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
