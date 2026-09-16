'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const accounts = require('../demo/accounts');
const { allowed } = require('../demo/read-only');
const { rewrite } = require('../demo/rewrite');

function start(file, env) {
  const child = fork(path.join(__dirname, '..', file), [], { env: { ...process.env, ...env }, silent: true, execArgv: file === 'demo/worker.cjs' ? ['--max-old-space-size=96'] : [] });
  let logs = '';
  child.stdout.on('data', v => { logs += v; }); child.stderr.on('data', v => { logs += v; });
  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill(); reject(Error('Startup timed out: ' + logs)); }, 45000);
    child.once('message', value => { clearTimeout(timer); resolve(value); });
    child.once('exit', code => { clearTimeout(timer); reject(Error('Exited ' + code + ': ' + logs)); });
  });
  return { child, ready, logs: () => logs, async stop() { if (child.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill(); await done; } } };
}
async function request(base, url, cookie, method = 'GET', body) {
  const res = await fetch(base + url, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual', signal: AbortSignal.timeout(45000) });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, cookie: res.headers.get('set-cookie'), headers: res.headers };
}

test('demo denies mutations and dangerous GETs, scopes only application URL literals', () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'TRACE', 'OPTIONS']) assert.equal(allowed(method, '/api/users'), false);
  for (const url of ['/api/admin/backup.zip', '/API/ADMIN/BACKUP', '/auth/google/callback', '/%61uth/google', '/api/fetch-dataset?url=http://example.invalid', '/api/sessions/1/join', '/api/sessions/1/token']) {
    assert.equal(allowed('GET', url), false, url); assert.equal(allowed('HEAD', url), false, url);
  }
  assert.equal(allowed('POST', '/api/auth/login'), true);
  assert.equal(allowed('POST', '/api/auth/login/other'), false);
  const js = 'fetch("/api/my/courses"); x.split("/"); location.href="/login"; const y="/demo/api/test";';
  assert.equal(rewrite(js, 'application/javascript'), 'fetch("/demo/api/my/courses"); x.split("/"); location.href="/demo/login"; const y="/demo/api/test";');
  assert.match(rewrite('<head></head><a href="/" data-demo-exit>Exit</a>', 'text/html'), /href="\/" data-demo-exit/);
});

test('all demo roles browse synthetic data; writes cannot alter the store or SQL', { timeout: 90000 }, async t => {
  const worker = start('demo/worker.cjs', { ECHOLENS_DEMO_WORKER: '1', DATABASE_URL: 'postgres://must-never-connect.invalid/live', SMTP_HOST: 'must-never-send.invalid' });
  t.after(() => worker.stop());
  const ready = await worker.ready;
  const base = 'http://127.0.0.1:' + ready.port;
  async function inspect() { const response = once(worker.child, 'message'); worker.child.send('inspect'); return (await response)[0]; }
  const before = await inspect();
  assert.equal(before.readOnly, 'on');
  const diskBefore = fs.readFileSync(path.join(before.storage, 'store.json'), 'utf8');
  const endpoints = {
    admin: ['/api/overview', '/api/admin/users', '/api/admin/catalogue', '/api/admin/open-courses-progress', '/api/admin/registrations', '/api/admin/support-tickets', '/api/admin/system-health', '/api/admin/talent/analytics', '/api/batches/1/quest', '/api/batches/1/certificates'],
    teacher: ['/api/my/courses', '/api/teacher/grades', '/api/teacher/students', '/api/teacher/attendance', '/api/batches/1/quest'],
    student: ['/api/overview', '/api/my/courses', '/api/my/quests', '/api/certificates/mine', '/api/talent/me', '/api/talent/me/projects', '/api/support-tickets'],
    free: ['/api/open/enrollments', '/api/open/progress?track=fc01-c-basics', '/api/my/open-profile', '/api/certificates/mine'],
    coord: ['/api/overview', '/api/admin/users', '/api/my/courses'],
    hr: ['/api/hr/staff', '/api/hr/instructors', '/api/hr/ambassadors', '/api/hr/departments', '/api/hr/contracts'],
    finance: ['/api/finance/registrations', '/api/finance/expenses', '/api/finance/balance-sheet'],
    admit: ['/api/admissions/registrations', '/api/admissions/discount-categories', '/api/coordinator/queries'],
    staff: ['/api/staff/me', '/api/my-departments'], head: ['/api/staff/me', '/api/my-departments'],
    amb: ['/api/ambassador/me', '/api/ambassador/referrals', '/api/ambassador/leaderboard'],
    recruit: ['/api/talent/search?q=Python', '/api/talent/shortlists', '/api/talent/recruiter/contact-requests', '/api/talent/saved-searches'],
  };
  for (const account of accounts) {
    await t.test(account.username + ' login and role-specific browsing', async () => {
      const login = await request(base, '/api/auth/login', null, 'POST', { login: account.username, password: 'admin' });
      assert.equal(login.status, 200, JSON.stringify(login.data));
      const cookie = login.cookie.split(';')[0];
      const me = await request(base, '/api/auth/me', cookie);
      assert.equal(me.data.role, account.role); assert.equal(me.data.demo_read_only, true);
      for (const url of endpoints[account.username]) {
        const result = await request(base, url, cookie);
        assert.equal(result.status, 200, account.username + ': ' + url + ' ' + JSON.stringify(result.data));
      }
      for (const [method, url] of [['POST', '/api/certificates/issue'], ['PUT', '/api/talent/me'], ['PATCH', '/api/users/1'], ['DELETE', '/api/admin/users/1'], ['POST', '/api/auth/reset-password'], ['GET', '/api/admin/backup.zip'], ['GET', '/auth/google'], ['GET', '/api/fetch-dataset?url=https://example.invalid']]) {
        const blocked = await request(base, url, cookie, method, method === 'POST' ? { allow_incomplete: true } : undefined);
        assert.equal(blocked.status, 403, method + url); assert.equal(blocked.data.code, 'DEMO_READ_ONLY');
      }
    });
  }
  assert.equal((await request(base, '/api/auth/login', null, 'POST', { login: 'admin', password: 'wrong' })).status, 401);
  const after = await inspect();
  assert.equal(after.digest, before.digest, 'browsing, logins and denied writes leave all synthetic records unchanged');
  assert.equal(fs.readFileSync(path.join(before.storage, 'store.json'), 'utf8'), diskBefore);
  assert.doesNotMatch(worker.logs(), /FATAL|TypeError|Read-only demo: sample records cannot/);
});

test('existing website proxy isolates cookies, data, uploads and browser URLs', { timeout: 90000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-demo-proxy-test-'));
  const parent = start('test/fixtures/certificate-server.cjs', { ECHOLENS_TEST_RUNTIME: runtime });
  t.after(async () => {
    await parent.stop();
    assert.equal(path.dirname(path.resolve(runtime)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(runtime).startsWith('echolens-demo-proxy-test-'));
    fs.rmSync(runtime, { recursive: true, force: true });
  });
  const ready = await parent.ready;
  const base = 'http://127.0.0.1:' + ready.port;
  const landing = await request(base, '/demo/');
  assert.equal(landing.status, 200, landing.data);
  assert.match(landing.data, /\/demo\/js\/demo-guard.js/);
  assert.match(landing.data, /fetch\('\/demo\/api\/auth\/login'/);
  assert.equal(landing.headers.get('cache-control'), 'no-store');
  const uppercase = await request(base, '/DEMO/dashboard');
  assert.equal(uppercase.status, 308); assert.equal(uppercase.headers.get('location'), '/demo/dashboard');
  assert.equal((await request(base, '/demo/api/auth/me', ready.cookies[1])).status, 401, 'live cookie is not sent into demo');
  const login = await request(base, '/demo/api/auth/login', ready.cookies[1], 'POST', { login: 'admin', password: 'admin' });
  assert.equal(login.status, 200); assert.match(login.cookie, /^el_demo_token=/); assert.match(login.cookie, /Path=\/demo(?:;|$)/);
  const cookie = login.cookie.split(';')[0];
  assert.equal((await request(base, '/api/auth/me', cookie)).status, 401, 'demo cookie is not a live session');
  assert.equal((await request(base, '/api/auth/me', ready.cookies[1])).data.name, 'Synthetic Admin');
  const users = await request(base, '/demo/api/admin/users', cookie + '; ' + ready.cookies[1]);
  assert.doesNotMatch(JSON.stringify(users.data), /Synthetic Admin|qa.invalid/);
  assert.match(JSON.stringify(users.data), /demo.invalid/);
  const dashboard = await request(base, '/demo/dashboard', cookie);
  assert.match(dashboard.data, /\/demo\/js\/dashboard.js/);
  assert.equal((await request(base, '/demo/api/certificates/issue', cookie, 'POST', { user_id: 2, allow_incomplete: true })).data.code, 'DEMO_READ_ONLY');
  const form = new FormData(); form.append('file', new Blob(['forbidden']), 'forbidden.txt');
  const upload = await fetch(base + '/demo/api/me/avatar', { method: 'POST', headers: { Cookie: cookie }, body: form });
  assert.equal(upload.status, 403);
  assert.equal(JSON.parse(fs.readFileSync(path.join(runtime, 'store.json'))).certificates.length, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(runtime, 'mail.json'))).length, 0);
  assert.equal((await request(base, '/demo/api/auth/logout', cookie, 'POST')).status, 200);
  assert.equal((await request(base, '/api/auth/me', ready.cookies[1])).status, 200, 'demo logout does not clear live session');
});
