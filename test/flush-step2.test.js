'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { captureSnapshot, prepareFlush, pendingCounts } = require('../normalized-flush-plan');

test('immutable snapshot retains nested values and later live edits remain pending', () => {
  const live = { users: [{ id: 1, name: 'Before', profile: { nested: { opened: false } } }], settings: {} };
  const captured = captureSnapshot(live);
  live.users[0].name = 'After'; live.users[0].profile.nested.opened = true;
  assert.equal(captured.users[0].name, 'Before');
  assert.equal(captured.users[0].profile.nested.opened, false);
  assert.throws(() => { captured.users[0].profile.nested.opened = true; }, TypeError);
  const plan = prepareFlush(captured);
  assert.equal(plan.operations[0].args.data[0].name, 'Before');
  assert.equal(pendingCounts(live, plan.nextSnapshot).users, 1);
  assert.equal(prepareFlush(captured, plan.nextSnapshot).operations.length, 0);
});

test('prepared plan handles parent/child order, feedback, metadata and deleted records', () => {
  const initial = { companies: [{ id: 1, domain: 'qa.invalid' }], users: [{ id: 1, name: 'Sample', company_id: 1 }],
    feedback: [{ id: 2, message: 'Before' }], seq: { users: 1 }, settings: { sample: null },
    issued_usernames: ['sample'], issued_regnos: ['S1'] };
  const baseline = prepareFlush(initial).nextSnapshot;
  const changed = { ...initial, companies: [], users: [], feedback: [{ id: 2, message: 'After' }], seq: { users: 2 }, settings: { sample: { enabled: true } }, issued_usernames: ['sample', 'next'] };
  const plan = prepareFlush(changed, baseline);
  assert.deepEqual(plan.operations.slice(0, 2).map(op => op.collection), ['users', 'companies']);
  assert.equal(plan.operations.find(op => op.collection === 'feedback').args.where.id, 2n);
  assert.deepEqual(plan.rowsWritten, { users: 1, companies: 1, feedback: 1, seq: 1, issued_usernames: 1, settings: 1 });
});

test('disabled flush leaves store exports usable; guard is inside the flush function', async () => {
  const source = fs.readFileSync(path.join(__dirname, '../store.js'), 'utf8');
  const start = source.indexOf('async function persistAllToPostgresNormalized(');
  const guard = source.indexOf("if (process.env.FLUSH_DISABLED === 'true')", start);
  const requireClient = source.indexOf("require('./prisma-client')", start);
  assert.ok(guard > start && guard < requireClient);
  const vm = require('node:vm');
  const context = vm.createContext({ process: { env: { FLUSH_DISABLED: 'true' } }, console: { warn() {} },
    require() { throw Error('Disabled flush must not load the database client'); } });
  vm.runInContext(source.slice(start, source.indexOf('/** Capture only when', start)), context);
  const result = await context.persistAllToPostgresNormalized(null);
  assert.equal(result.skipped, true);
});

test('admin dump endpoints stay reachable when persistence fails; other roles cannot inspect them', { timeout: 45000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-flush-diagnostics-'));
  const filename = 'failed-flush-synthetic.json';
  fs.writeFileSync(path.join(runtime, filename), JSON.stringify({ collections: { users: { created: [{ id: 1, email: 'private@qa.invalid', profile: { phone: '123' } }], updated: [], deleted_ids: [9] } } }));
  const child = fork(path.join(__dirname, 'fixtures/flush-diagnostics-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [] });
  let logs = ''; child.stdout.on('data', c => { logs += c; }); child.stderr.on('data', c => { logs += c; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill(); await done; }
    assert.equal(path.dirname(runtime), os.tmpdir());
    assert.ok(path.basename(runtime).startsWith('echolens-flush-diagnostics-'));
    fs.rmSync(runtime, { recursive: true, force: true });
  });
  const ready = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Fixture timeout: ' + logs)), 30000);
    child.once('message', message => { clearTimeout(timer); resolve(message); });
    child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); });
  });
  async function request(url, role) {
    const result = await fetch(`http://127.0.0.1:${ready.port}${url}`, { headers: role ? { Cookie: ready.cookies[role] } : {} });
    return { status: result.status, data: await result.json() };
  }
  for (const url of ['/api/admin/list-dumps', '/api/admin/inspect-dump?file=' + filename, '/api/admin/flush-health']) {
    assert.equal((await request(url)).status, 401);
    for (const role of ['student', 'instructor', 'finance', 'student_coordinator']) assert.equal((await request(url, role)).status, 403);
    assert.equal((await request(url, 'admin')).status, 200);
  }
  const listed = (await request('/api/admin/list-dumps', 'admin')).data;
  assert.equal(listed[0].filename, filename);
  assert.ok(listed[0].size > 0); assert.ok(listed[0].mtime);
  const inspected = (await request('/api/admin/inspect-dump?file=' + filename, 'admin')).data;
  assert.equal(inspected.collections.users.created, 1);
  assert.equal(inspected.collections.users.deleted, 1);
  assert.equal(inspected.collections.users.sample.email, '[redacted]');
  assert.equal(inspected.collections.users.sample.profile.phone, '[redacted]');
  assert.equal((await request('/api/admin/inspect-dump?file=..%2Fsecret.json', 'admin')).status, 400);
  const health = (await request('/api/admin/flush-health', 'admin')).data;
  assert.ok(health.pendingRecordCount.users > 0);
  assert.equal(health.lastFlushDurationMs, null);
});
