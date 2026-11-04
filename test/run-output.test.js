'use strict';
/**
 * The run output sent with a submission is treated by the grader as what the
 * program really printed, so runner chrome must never reach it as if the
 * student's program had printed it.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanRunOutput } = require('../ai');

test('strips the stdin banner compiled programs show', () => {
  const raw = 'This program reads input. Type ALL input lines below (press Enter after each, empty line to finish):\n4\n\nSquare: 16\n';
  assert.equal(cleanRunOutput(raw), '4\n\nSquare: 16');
});

test('strips the SQL dataset notice', () => {
  assert.equal(cleanRunOutput('-- Datasets loaded as tables: sales\n\n| a |\n'), '| a |');
});

test('keeps real program output, including bracketed lists', () => {
  assert.equal(cleanRunOutput('[1, 2, 3]\nTotal: 6\n'), '[1, 2, 3]\nTotal: 6');
});

test('empty or missing output stays empty', () => {
  assert.equal(cleanRunOutput(null), '');
  assert.equal(cleanRunOutput('   \n'), '');
});

const { applyLogicFloor } = require('../ai');

test('correct logic is always a clear pass', () => {
  assert.equal(applyLogicFloor(40, true, 60), 80);
  assert.equal(applyLogicFloor(40, true, 70), 85);
  assert.equal(applyLogicFloor(95, true, 60), 95); // never lowers a good score
});

test('incorrect logic keeps the grader score', () => {
  assert.equal(applyLogicFloor(40, false, 60), 40);
  assert.equal(applyLogicFloor(40, undefined, 60), 40);
  assert.equal(applyLogicFloor(140, false, 60), 100);
});
