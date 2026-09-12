'use strict';
/**
 * What the automatic grader is told about a problem.
 *
 * Regression cover for the bug that marked a correct C submission 0: the
 * grader was never sent the problem's `criteria`, so it invented its own
 * standard. These tests pin the contract that the rubric, the reference
 * solution and the expected output all reach it.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
process.env.DB_PATH = path.join(os.tmpdir(), `echolens-rubric-${crypto.randomUUID()}.json`);

const { expectedOutputOf, sampleInputOf, graderContext } = require('../problem-rubric');
const { Quests } = require('../store');

test('expected output parses both brief formats used across the courses', () => {
  // Block form - FC-01 / FC-02 style.
  assert.equal(
    expectedOutputOf({ description: 'Do a thing.\n\nInput: None\nExpected Output:\nOriginal Price in main: 100' }),
    'Original Price in main: 100');
  // Inline form - CS-104 style. An earlier extractor handled only the block
  // form and silently sent no target for 148 problems.
  assert.equal(
    expectedOutputOf({ description: "Do a thing.\n\nSample Input: 4 12.5\nExpected Output: Total: 50.0 | Type: <class 'float'>" }),
    "Total: 50.0 | Type: <class 'float'>");
  // Multi-line block stops at the blank line, not at the end of the brief.
  assert.equal(
    expectedOutputOf({ description: 'Brief.\n\nExpected Output:\nline one\nline two\n\nNotes: ignore me' }),
    'line one\nline two');
  // An explicit field always wins.
  assert.equal(expectedOutputOf({ expected_output: 'X', description: 'Expected Output: Y' }), 'X');
  assert.equal(expectedOutputOf({ description: 'No target stated here.' }), null);
  assert.equal(expectedOutputOf(null), null);
});

test('sample input is extracted, and "None" is treated as no input', () => {
  assert.equal(sampleInputOf({ description: 'Brief.\n\nSample Input: 4 12.5\nExpected Output: x' }), '4 12.5');
  assert.equal(sampleInputOf({ description: 'Brief.\n\nInput: None\nExpected Output:\nx' }), null, '"None" is not an input');
  assert.equal(sampleInputOf({ description: 'Brief with no input line.' }), null);
});

test('graderContext carries the rubric, the solution and the target', () => {
  const problem = {
    criteria: ['first thing', '', 'second thing'],
    solution: 'the reference answer',
    description: 'Brief.\n\nExpected Output:\nhello',
    pass_mark: 70,
  };
  const ctx = graderContext(problem, { pass_mark: 60 });
  assert.deepEqual(ctx.criteria, ['first thing', 'second thing'], 'blank criteria are dropped');
  assert.equal(ctx.solution, 'the reference answer');
  assert.equal(ctx.expectedOutput, 'hello');
  assert.equal(ctx.passMark, 70, 'the problem overrides the track');
  assert.equal(graderContext({}, { pass_mark: 60 }).passMark, 60, 'falling back to the track');
  assert.equal(graderContext({}, {}).passMark, 60, 'and to a sane default');
  assert.deepEqual(graderContext({}, {}).criteria, [], 'no criteria is an empty list, never undefined');
});

test('the problem that was wrongly marked 0 now yields a full grader context', () => {
  const track = Quests.trackDef('fc01-c-basics');
  const problem = track.levels.find((l) => l.no === 15).problems[0];
  const ctx = graderContext(problem, track);

  assert.equal(ctx.criteria.length, 2, 'both rubric items reach the grader');
  assert.match(ctx.criteria[0], /modifies only its local parameter/);
  assert.match(ctx.criteria[1], /still exactly 100/);
  assert.ok(ctx.solution, 'a reference solution is sent');
  assert.equal(ctx.expectedOutput, 'Original Price in main: 100', 'and the exact target output');
});

test('every published free course sends its grader a rubric it can use', () => {
  const tracks = Quests.tracks({ includeUnpublished: false })
    .map((t) => Quests.trackDef(t.key))
    .filter((t) => t && t.free);
  assert.ok(tracks.length >= 5, 'expected the free catalogue to be populated');

  const naked = [];
  for (const t of tracks) {
    for (const level of t.levels || []) {
      for (const p of level.problems || []) {
        const ctx = graderContext(p, t);
        if (!ctx.criteria.length) naked.push(`${t.course_code} L${level.no} "${p.title}"`);
      }
    }
  }
  assert.deepEqual(naked, [], 'a problem with no criteria forces the grader to invent its own standard');
});
