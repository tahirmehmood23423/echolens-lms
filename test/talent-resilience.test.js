'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');

test('missing Talent tables return 503 while certificates issue, verify and render; migration restores Talent', { timeout: 90000 }, async (t) => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-talent-'));
  const env = { ...process.env, ECHOLENS_TEST_RUNTIME: runtime };
  delete env.NODE_TEST_CONTEXT;
  const child = fork(path.join(__dirname, 'fixtures/talent-failure-server.cjs'), [], {
    env, execArgv: [], silent: true,
  });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    const resolved = path.resolve(runtime);
    assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('echolens-talent-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  function message() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { cleanup(); reject(new Error(`Server message timed out: ${logs}`)); }, 40000);
      function cleanup() { clearTimeout(timer); child.off('message', receive); child.off('exit', fail); }
      function receive(value) { cleanup(); resolve(value); }
      function fail(code) { cleanup(); reject(new Error(`Server exited (${code}): ${logs}`)); }
      child.once('message', receive);
      child.once('exit', fail);
    });
  }
  const ready = await message();
  assert.equal(ready.type, 'ready');
  const base = `http://127.0.0.1:${ready.port}`;
  async function request(url, role, body) {
    return fetch(base + url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', ...(role ? { Cookie: ready.cookies[role] } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  }
  assert.equal((await request('/api/talent/me')).status, 401);
  assert.equal((await request('/api/talent/me', 'admin')).status, 403);
  const certificate = { user_id: 2, kind: 'competition', title: 'Synthetic completion', completion_date: '2026-09-16' };
  const responses = await Promise.all([
    request('/api/talent/me', 'student'),
    request('/api/talent/me/contact-requests', 'student'),
    request('/api/admin/talent/analytics', 'admin'),
    request('/api/certificates/issue', 'admin', certificate),
  ]);
  for (const response of responses.slice(0, 3)) {
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.match(body.error, /please retry/);
    assert.doesNotMatch(body.error, /SELECT|relation|42P01|stack/i);
  }
  assert.equal(responses[3].status, 200);
  const issued = await responses[3].json();
  assert.ok(issued.ok);
  const serial = issued.cert.serial;
  const verification = await request('/api/verify/' + serial);
  assert.equal((await verification.json()).valid, true);
  const mine = await request('/api/certificates/mine', 'student');
  assert.equal((await mine.json()).certificates[0].serial, serial);
  const png = await request(`/api/cert-og/${serial}.png`);
  assert.equal(png.status, 200);
  assert.equal(png.headers.get('content-type'), 'image/png');
  assert.equal(Buffer.from(await png.arrayBuffer()).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const repeat = await request('/api/certificates/issue', 'admin', certificate);
  assert.equal((await repeat.json()).cert.serial, serial);
  assert.equal(JSON.parse(fs.readFileSync(path.join(runtime, 'store.json'))).certificates.length, 1);
  assert.match(logs, /42P01/);

  const migrated = message();
  child.send('migrate');
  assert.equal((await migrated).type, 'migrated');
  const profile = await request('/api/talent/me', 'student');
  assert.equal(profile.status, 200);
  const profileBody = await profile.json();
  assert.equal(profileBody.profile, null);
  assert.equal(profileBody.verified.certificates[0].serial, serial);
  assert.equal((await request('/api/talent/me/contact-requests', 'student')).status, 200);
});
