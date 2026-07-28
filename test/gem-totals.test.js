'use strict';

/**
 * Unit test for the Task 1 gem-scan fix - no Postgres, no HTTP. Asserts
 * gemTotalsByUser()'s one-pass map agrees exactly, per user, with
 * totalGemsForStudent()'s existing per-user computation (the function every
 * other single-student call site still uses), across a synthetic dataset
 * covering all four gem sources - submissions, gem_events,
 * quest_submissions, open_submissions - plus users who appear in some, all,
 * or none of them. If this ever fails, the batch path has drifted from the
 * per-student one and the leaderboard/admin totals would be wrong.
 *
 * Run: node --test test/gem-totals.test.js
 */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const SCRATCH_DB_PATH = path.join(os.tmpdir(), `gem-totals-test-${Date.now()}.json`);
process.env.DB_PATH = SCRATCH_DB_PATH; // JSON-file mode, own scratch file - never touches a real echolens.json

const store = require('../store');

after(() => { try { fs.unlinkSync(SCRATCH_DB_PATH); } catch {} try { fs.unlinkSync(SCRATCH_DB_PATH + '.tmp'); } catch {} });

test('gemTotalsByUser() matches totalGemsForStudent() for every user, across all four gem sources', () => {
  const data = store.allData();
  data.users = [];
  data.submissions = [];
  data.gem_events = [];
  data.quest_submissions = [];
  data.open_submissions = [];

  const userIds = [101, 102, 103, 104, 105];
  for (const id of userIds) data.users.push({ id, name: `User ${id}`, role: 'student', created_at: '2026-01-01 00:00:00' });

  // 101: appears in all four sources
  data.submissions.push({ id: 1, user_id: 101, assignment_id: 1, gems: 10 });
  data.gem_events.push({ id: 1, user_id: 101, batch_id: null, amount: 5, source: 'manual' });
  data.quest_submissions.push({ id: 1, user_id: 101, quest_id: 1, pid: 1, gems: 20 });
  data.open_submissions.push({ id: 1, user_id: 101, track_key: 'x', gems: 3 });

  // 102: only quest_submissions, multiple rows
  data.quest_submissions.push({ id: 2, user_id: 102, quest_id: 1, pid: 2, gems: 15 });
  data.quest_submissions.push({ id: 3, user_id: 102, quest_id: 2, pid: 1, gems: 7 });

  // 103: only gem_events, including a zero-amount row
  data.gem_events.push({ id: 2, user_id: 103, batch_id: null, amount: 0, source: 'manual' });
  data.gem_events.push({ id: 3, user_id: 103, batch_id: null, amount: 12, source: 'streak' });

  // 104: rows with missing/undefined `gems` (an ungraded submission) mixed
  // with a real value - both totalGemsForStudent()'s per-source helpers and
  // gemTotalsByUser() must treat missing gems as 0, not NaN.
  data.submissions.push({ id: 2, user_id: 104, assignment_id: 1, gems: null });
  data.quest_submissions.push({ id: 4, user_id: 104, quest_id: 1, pid: 1, gems: undefined });
  data.open_submissions.push({ id: 2, user_id: 104, track_key: 'x', gems: 9 });

  // 105: no gem activity anywhere - deliberately nothing pushed

  const totalsMap = store.gemTotalsByUser();
  for (const id of userIds) {
    const oldWay = store.totalGemsForStudent(id);
    const newWay = totalsMap.get(id) || 0;
    assert.equal(newWay, oldWay, `user ${id}: gemTotalsByUser=${newWay} but totalGemsForStudent=${oldWay}`);
  }

  // Concrete expected values too, not just "old and new agree with each
  // other" (in case both were wrong the same way):
  assert.equal(totalsMap.get(101), 10 + 5 + 20 + 3);
  assert.equal(totalsMap.get(102), 15 + 7);
  assert.equal(totalsMap.get(103), 0 + 12);
  assert.equal(totalsMap.get(104), 0 + 0 + 9);
  assert.equal(totalsMap.get(105) || 0, 0);
});
