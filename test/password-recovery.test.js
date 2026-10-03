'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const create = require('../password-recovery');

test('email must be verified before a single-use reset grant is available', () => {
  const r = create();
  const pin = r.issue('user@example.com', 1, '/open#free');
  assert.match(pin, /^\d{6}$/);
  assert.equal(r.get(pin), undefined);
  assert.equal(r.verify('other@example.com', pin), null);
  const token = r.verify('user@example.com', pin);
  assert.equal(r.get(token).userId, 1);
  assert.equal(r.verify('user@example.com', pin), null);
  r.consume(token);
  assert.equal(r.get(token), undefined);
});
test('PIN expires, locks after five failures, and resends have a cooldown', () => {
  let time = 0;
  const r = create({ now: () => time });
  const pin = r.issue('a', 1);
  assert.equal(r.issue('a', 1), null);
  for (let i = 0; i < 5; i++) assert.equal(r.verify('a', 'invalid'), null);
  assert.equal(r.verify('a', pin), null);
  const second = r.issue('a', 1);
  time += 10 * 60000;
  assert.equal(r.verify('a', second), null);
  const third = r.issue('a', 1);
  const token = r.verify('a', third);
  time += 10 * 60000;
  assert.equal(r.get(token), undefined);
});
test('a new request invalidates older verified grants', () => {
  const r = create();
  const token = r.verify('a', r.issue('a', 1));
  r.issue('a', 1);
  assert.equal(r.get(token), undefined);
});
