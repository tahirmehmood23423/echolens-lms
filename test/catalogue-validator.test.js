'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
test('catalogue validation checks current quiz and coding structure without making release network requests', () => {
  const output = execFileSync(process.execPath, [path.join(__dirname, '../scripts/validate-trending-tech.js')], { encoding: 'utf8', timeout: 10000 });
  assert.match(output, /72 quizzes, 31 coding tasks, 41 optional projects/);
  assert.match(output, /validate:catalogue:release/);
  assert.doesNotMatch(output, /Coming Soon/);
});
