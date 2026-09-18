'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { redactRowForLog, failureDetails, assertReplayableDump } = require('../flush-diagnostics');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('actual health and alert functions expose full error details without connecting to a database', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'store.js'), 'utf8').replace(/\r\n/g, '\n');
  const health = source.slice(source.indexOf('function flushHealth()'), source.indexOf('/*\n * ------------------------- bounded fail-fast'));
  const alert = source.slice(source.indexOf('function sendFlushFailureAlert('), source.indexOf('function chunkRows('));
  const failure = { ...failureDetails(Object.assign(new Error('\nTransaction expired\nTimeout: 60000 ms'), {
    code: 'P2028', meta: { modelName: 'User', timeout: 60000, timeTaken: 60374 },
  })), at: '2026-09-18T00:00:00Z', collection: 'users', op: 'update', constraint: null };
  const messages = [];
  const context = vm.createContext({ lastSuccessfulFlushAt: null, consecutiveFlushFailures: 1,
    require: module => require(path.join(__dirname, '..', module)), data: {}, lastPersistedSnapshot: {}, lastFlushTiming: null,
    lastFlushFailure: failure, DB_PATH: '/synthetic/store.json', FAIL_FAST_THRESHOLD: 3, path,
    process: { env: { MAIL_ALERT_TO: 'synthetic@qa.invalid' } },
    mailer: { notify: (...args) => messages.push(args) } });
  vm.runInContext(health + '\n' + alert, context);
  assert.equal(context.flushHealth().lastFailure.message, failure.message);
  assert.deepEqual(context.flushHealth().lastFailure.meta, failure.meta);
  context.sendFlushFailureAlert(failure);
  assert.equal(messages.length, 1);
  assert.ok(messages[0][2].includes(failure.message));
  assert.ok(messages[0][2].includes('P2028'));
  assert.ok(messages[0][2].includes(JSON.stringify(failure.meta)));
});

test('flush errors retain complete multiline message, code and Prisma metadata', () => {
  const error = Object.assign(new Error('\nTransaction expired\nTimeout: 60000 ms'), {
    code: 'P2028', meta: { modelName: 'User', timeout: 60000, timeTaken: 60374 },
  });
  assert.deepEqual(failureDetails(error), { message: error.message, code: error.code, meta: error.meta });
});

test('dump redaction covers nested profiles, bank details and aliased credential fields', () => {
  const row = { id: 1, student_email: 'student@example.test', passwordHash: 'hash',
    profile: { contacts: [{ email: 'private@example.test', phone: '123' }] },
    bank_snapshot: { account_number: '456', iban: '789' }, r2_key: 'image/key' };
  const result = redactRowForLog(row);
  assert.equal(result.passwordHash, '[redacted]');
  assert.equal(result.student_email, '[redacted]');
  assert.equal(result.profile.contacts[0].email, '[redacted]');
  assert.equal(result.profile.contacts[0].phone, '[redacted]');
  assert.equal(result.bank_snapshot.iban, '[redacted]');
  assert.equal(result.bank_snapshot.account_number, '[redacted]');
  assert.equal(result.r2_key, row.r2_key);
  assert.equal(row.profile.contacts[0].email, 'private@example.test');
});

test('replay validation refuses nested placeholders before writing any rows', () => {
  const dump = { collections: { users: { updated: [{ id: 1, profile: { email: '[redacted]' } }] } } };
  let writes = 0;
  assert.throws(() => { assertReplayableDump(dump); writes++; }, error =>
    error.code === 'REDACTED_FLUSH_DUMP' && error.message.includes('$.collections.users.updated.0.profile.email'));
  assert.equal(writes, 0);
  assert.doesNotThrow(() => assertReplayableDump({ collections: { users: { updated: [{ id: 1, email: 'restored@example.test' }] } } }));
});
