'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');

test('manual certificate override through the actual portal API', { timeout: 60000 }, async (t) => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-certificate-'));
  const env = { ...process.env, ECHOLENS_TEST_RUNTIME: runtime };
  delete env.NODE_TEST_CONTEXT;
  const child = fork(path.join(__dirname, 'fixtures/certificate-server.cjs'), [], { env, execArgv: [], silent: true });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exit = once(child, 'exit');
      child.kill();
      await exit;
    }
    assert.equal(path.dirname(path.resolve(runtime)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(runtime).startsWith('echolens-certificate-'));
    fs.rmSync(runtime, { recursive: true, force: true });
  });
  const ready = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Fixture timeout: ' + logs)); }, 20000);
    function cleanup() { clearTimeout(timeout); child.off('message', receive); child.off('exit', fail); }
    function receive(value) { cleanup(); resolve(value); }
    function fail(code) { cleanup(); reject(new Error(`Fixture exited ${code}: ${logs}`)); }
    child.once('message', receive);
    child.once('exit', fail);
  });
  const readStore = () => JSON.parse(fs.readFileSync(path.join(runtime, 'store.json')));
  const readMail = () => JSON.parse(fs.readFileSync(path.join(runtime, 'mail.json')));
  const initialSubmissions = readStore().quest_submissions;
  async function request(url, actor = 1, body) {
    const res = await fetch(`http://127.0.0.1:${ready.port}` + url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(actor ? { Cookie: ready.cookies[actor] } : {}) },
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000),
    });
    return { status: res.status, body: await res.json() };
  }
  const single = '/api/certificates/issue';
  const bulk = `/api/batches/${ready.batchId}/certificates/issue-all`;
  const cert = { user_id: 2, batch_id: ready.batchId, title: 'Manual certificate', kind: 'course' };

  await t.test('completion checks remain the default and only admins can override', async () => {
    assert.equal((await request(single, 0, cert)).status, 401);
    for (const actor of [1, 3]) {
      assert.equal((await request(single, actor, cert)).status, 400);
      assert.equal((await request(single, actor, { ...cert, allow_incomplete: 'true' })).status, 400);
    }
    for (const actor of [2, 3, 6]) assert.equal((await request(single, actor, { ...cert, allow_incomplete: true })).status, 403);
    assert.equal((await request(single, 1, { ...cert, user_id: 4, allow_incomplete: true })).status, 400, 'override still requires enrollment');
    assert.equal(readStore().certificates.length, 0);
  });

  await t.test('admin issues with no submissions; certificate and override audit are durable and verifiable', async () => {
    const result = await request(single, 1, { ...cert, allow_incomplete: true });
    assert.equal(result.status, 200);
    assert.equal(result.body.existing, false);
    const saved = readStore();
    const record = saved.certificates.find(c => c.serial === result.body.cert.serial);
    assert.equal(record.user_id, 2);
    const audit = saved.audit_log.find(a => a.target_type === 'certificate' && a.target_id === record.id);
    assert.equal(audit.action, 'certificate_completion_override');
    assert.equal(audit.actor_id, 1);
    assert.equal(audit.detail.batch_id, ready.batchId);
    assert.equal(audit.detail.bulk, false);
    assert.deepEqual(saved.quest_submissions, initialSubmissions);
    assert.equal((await request('/api/verify/' + record.serial, 0)).body.valid, true);
    assert.equal((await request('/api/certificates/mine', 2)).body.certificates[0].serial, record.serial);
    const repeat = await request(single, 1, { ...cert, allow_incomplete: true });
    assert.equal(repeat.body.cert.serial, record.serial);
    assert.equal(repeat.body.existing, true);
    assert.equal(readStore().certificates.length, 1);
    assert.equal(readStore().audit_log.length, saved.audit_log.length);
    assert.equal(readMail().length, 1, 'repeat requests do not send a second notification');
  });

  await t.test('assigned teachers can still issue normally for completed learners', async () => {
    const result = await request(single, 3, { ...cert, user_id: 5 });
    assert.equal(result.status, 200);
    assert.equal(readStore().audit_log.filter(a => a.target_id === result.body.cert.id && a.target_type === 'certificate').length, 0);
  });

  await t.test('bulk defaults to completed learners and requires an explicit admin opt-in', async () => {
    for (const actor of [2, 3, 6]) assert.equal((await request(bulk, actor, { title: 'Bulk certificate', only_completed: false })).status, 403);
    const result = await request(bulk, 1, { title: 'Bulk certificate' });
    assert.equal(result.status, 200);
    assert.equal(result.body.issued, 1);
    assert.equal(result.body.skipped, 2);
    const invalidBoolean = await request(bulk, 1, { title: 'Bulk certificate', only_completed: 'false' });
    assert.equal(invalidBoolean.body.issued, 0);
    assert.equal(invalidBoolean.body.skipped, 2);
    assert.equal(invalidBoolean.body.existing, 1);
    const override = await request(bulk, 1, { title: 'Bulk certificate', only_completed: false });
    assert.equal(override.body.issued, 2);
    assert.equal(override.body.skipped, 0);
    assert.equal(override.body.existing, 1);
    const saved = readStore();
    const audits = saved.audit_log.filter(a => a.action === 'certificate_completion_override' && a.detail.bulk);
    assert.deepEqual(audits.map(a => a.detail.user_id).sort(), [2, 7]);
    assert.deepEqual(saved.quest_submissions, initialSubmissions);
    const notificationCount = readMail().length;
    const repeat = await request(bulk, 1, { title: 'Bulk certificate', only_completed: false });
    assert.equal(repeat.body.issued, 0);
    assert.equal(repeat.body.existing, 3);
    assert.equal(readMail().length, notificationCount);
    assert.equal(readStore().audit_log.length, saved.audit_log.length);
  });

  await t.test('courses without an installed track also require the admin override', async () => {
    const withoutTrack = { ...cert, batch_id: ready.noTrackBatchId };
    assert.equal((await request(single, 1, withoutTrack)).status, 400);
    assert.equal((await request(single, 1, { ...withoutTrack, allow_incomplete: true })).status, 200);
    const progress = await request(`/api/batches/${ready.batchId}`, 2);
    assert.equal(progress.status, 200);
    assert.deepEqual(readStore().quest_submissions, initialSubmissions);
  });
});
