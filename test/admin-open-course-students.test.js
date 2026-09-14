'use strict';
/**
 * Store-level cover for OpenQuest.studentsFor()/adminEnroll() - the pieces
 * behind the admin "manually add students to a free course" page. The HTTP
 * route and credential-emailing are covered live (see
 * .claude/skills/run-echolens-lms/admin-open-course-students-check.mjs);
 * this pins the store contract: admin-driven enrolment obeys the exact same
 * rules a self-service learner would hit, and the roster reflects it.
 */
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const dbPath = path.join(os.tmpdir(), 'echolens-admin-open-course-' + crypto.randomUUID() + '.json');
require('dotenv').config = () => ({ parsed: {} });
process.env.DATABASE_URL = ''; process.env.DB_PATH = dbPath;
const store = require('../store');
const { OpenQuest, Users, Quests } = store;
const tracks = Quests.tracks().filter((t) => t.free && store.officialCatalogue().some((c) => c.code === t.course_code && c.price_pkr === 0));
const key = tracks[0].key, otherKey = tracks[1].key, thirdKey = tracks[2].key;

beforeEach(() => {
  const d = store.allData();
  d.users = [
    { id: 1, role: 'free', name: 'Learner One', email: 'one@example.com', reg_no: 'R1', username: 'one@example.com', profile: {} },
    { id: 2, role: 'admin', name: 'Admin', profile: {} },
  ];
  d.open_submissions = []; d.open_attempts = [];
});
after(() => { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); });

test('an empty course has an empty roster, and adminEnroll fills it exactly like self-enrol', () => {
  assert.deepEqual(OpenQuest.studentsFor(key), []);
  const out = OpenQuest.adminEnroll(1, key);
  assert.equal(out.error, undefined);
  assert.equal(out.existing, false);
  const roster = OpenQuest.studentsFor(key);
  assert.equal(roster.length, 1);
  assert.equal(roster[0].id, 1);
  assert.equal(roster[0].name, 'Learner One');
  assert.equal(roster[0].active, false, 'a fresh seat is not yet confirmed');
  assert.ok(roster[0].confirmation_note);
});

test('adminEnroll is idempotent and reports it', () => {
  OpenQuest.adminEnroll(1, key);
  const again = OpenQuest.adminEnroll(1, key);
  assert.equal(again.existing, true);
  assert.equal(OpenQuest.studentsFor(key).length, 1, 'no duplicate roster row');
});

test('adminEnroll respects the two-active-course cap - an admin cannot place a learner anywhere self-service could not', () => {
  assert.equal(OpenQuest.adminEnroll(1, key).error, undefined);
  assert.equal(OpenQuest.adminEnroll(1, otherKey).error, undefined);
  const blocked = OpenQuest.adminEnroll(1, thirdKey);
  assert.ok(blocked.error);
  assert.equal(blocked.status, 409);
  assert.equal(OpenQuest.studentsFor(thirdKey).length, 0);
});

test('adminEnroll refuses a non-learner account with the same error self-service would give', () => {
  const out = OpenQuest.adminEnroll(2, key); // user 2 is an admin, not a learner
  assert.ok(out.error);
  assert.equal(out.status, 403);
});

test('studentsFor only lists learners actually holding a seat, never staff or an unrelated track', () => {
  OpenQuest.adminEnroll(1, key);
  assert.deepEqual(OpenQuest.studentsFor(otherKey), []);
  assert.equal(OpenQuest.studentsFor(key).some((s) => s.id === 2), false);
});
