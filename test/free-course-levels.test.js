'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const lv = require('../free-course-levels');

test('every mapped course has a level 1-3 and its recommendations sit on a lower level', () => {
  for (const [code, [level, first]] of Object.entries(lv.COURSES)) {
    assert.ok([1, 2, 3].includes(level), code);
    for (const f of first) assert.ok(lv.COURSES[f] && lv.COURSES[f][0] < level, `${code} -> ${f}`);
  }
});

test('modules split into beginner, intermediate and advanced thirds, in order', () => {
  const stages = Array.from({ length: 12 }, (_, i) => lv.moduleStage(i, 12).name);
  assert.deepEqual(stages, [...Array(4).fill('Beginner'), ...Array(4).fill('Intermediate'), ...Array(4).fill('Advanced')]);
  assert.equal(lv.moduleStage(0, 5).name, 'Beginner');
  assert.equal(lv.moduleStage(4, 5).name, 'Advanced');
});

test('courseLevel returns placement plus titled recommendations, or nothing for unknown codes', () => {
  const out = lv.courseLevel('py3-adv', (c) => (c === 'CS-104' ? 'Fundamentals of Python' : null));
  assert.equal(out.level, 'Intermediate');
  assert.deepEqual(out.recommended_first, [{ code: 'CS-104', title: 'Fundamentals of Python' }]);
  assert.deepEqual(lv.courseLevel('NOPE'), {});
});
