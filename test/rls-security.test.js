'use strict';

// Security tooling only: a loopback HTTP fixture, no SQL or database clients.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : '/bin/bash';
const fakeAnon = ['test', Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url'), 'fake'].join('.');
const privateFixture = 'PRIVATE_FIXTURE_MUST_NOT_APPEAR_IN_OUTPUT';

async function probe(t, responder, { key = fakeAnon, args = [], url } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, url: req.url, headers: req.headers });
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const result = responder(pathname);
    if (result.drop) { res.destroy(); return; }
    res.writeHead(result.status, { 'content-type': 'application/json', ...result.headers });
    res.end(typeof result.body === 'string' ? result.body : JSON.stringify(result.body));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const inherited = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
    /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|HOMEDRIVE|HOMEPATH)$/i.test(name)));
  const env = { ...inherited, SUPABASE_URL: url || `http://127.0.0.1:${server.address().port}`,
    SUPABASE_ANON_KEY: key, NO_PROXY: '127.0.0.1,localhost', no_proxy: '127.0.0.1,localhost' };
  // Only ordinary tool/OS paths are inherited, never real credentials or preload hooks.
  const result = await new Promise(resolve => {
    execFile(bash, ['scripts/verify-rls.sh', ...args], { cwd: root, env, timeout: 30000 }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout, stderr });
    });
  });
  for (const req of requests) {
    assert.equal(req.method, 'GET');
    assert.equal(req.headers.apikey, key);
    assert.equal(req.headers['accept-profile'], 'public');
    if (!req.url.endsWith('/rest/v1/')) {
      const query = new URL(req.url, 'http://localhost').searchParams;
      assert.equal(query.get('limit'), '1');
      assert.equal(query.get('select'), '*');
    }
  }
  assert.ok(!(result.stdout + result.stderr).includes(key));
  assert.ok(!(result.stdout + result.stderr).includes(privateFixture));
  return { ...result, requests };
}

function fixture(response, paths = {}) {
  return pathname => pathname === '/rest/v1/'
    ? { status: 200, body: { paths } }
    : response;
}

test('verifier reports exposed rows, discovers contact tables, and never logs records', async t => {
  const result = await probe(t, fixture({ status: 200, body: [{ email: privateFixture }] }, {
    '/contact_extra': {}, '/rpc/not_a_table': {}, '/contact_bad?injection': {}, '/feedback': {},
  }));
  assert.equal(result.code, 1);
  assert.match(result.stdout, /talent_profiles\s+EXPOSED/);
  assert.match(result.stdout, /contact_extra\s+EXPOSED/);
  assert.equal(result.requests.length, 8);
  assert.ok(!result.requests.some(req => req.url.includes('/rpc/')));
});

test('empty tables are inconclusive rather than falsely claiming RLS works', async t => {
  const result = await probe(t, fixture({ status: 200, body: [] }));
  assert.equal(result.code, 2);
  assert.match(result.stdout, /EMPTY/);
  assert.match(result.stdout, /never prove write denial/);
  assert.doesNotMatch(result.stdout, /All requested probes denied/);
});

test('database permission denial is distinguished from invalid API credentials', async t => {
  const denied = await probe(t, fixture({ status: 403, body: { code: '42501', message: privateFixture } }));
  assert.equal(denied.code, 0);
  assert.match(denied.stdout, /DENIED/);
  const invalid = await probe(t, fixture({ status: 401, body: { code: 'PGRST301', message: privateFixture } }));
  assert.equal(invalid.code, 2);
  assert.match(invalid.stdout, /INCONCLUSIVE/);
});

test('unexposed schema is denied; missing endpoints, server errors and invalid JSON are inconclusive', async t => {
  const blocked = await probe(t, () => ({ status: 406, body: { code: 'PGRST106' } }));
  assert.equal(blocked.code, 0);
  assert.match(blocked.stdout, /SCHEMA_NOT_EXPOSED/);
  for (const response of [
    { status: 404, body: { code: 'PGRST205' } },
    { status: 500, body: { code: 'XX000', message: privateFixture } },
    { status: 200, body: privateFixture },
  ]) {
    const result = await probe(t, fixture(response));
    assert.equal(result.code, 2);
  }
});

test('service-role, user and secret keys are refused before any network requests', async t => {
  for (const key of ['sb_secret_fake', ...['service_role', 'authenticated'].map(role =>
    ['test', Buffer.from(JSON.stringify({ role })).toString('base64url'), 'fake'].join('.'))]) {
    const result = await probe(t, fixture({ status: 200, body: [] }), { key });
    assert.equal(result.code, 2);
    assert.equal(result.requests.length, 0);
    assert.match(result.stderr, /Configuration rejected/);
  }
});

test('publishable keys use apikey only; mixed exposure takes precedence over inconclusive results', async t => {
  const result = await probe(t, pathname => {
    if (pathname === '/rest/v1/') return { status: 200, body: { paths: {} } };
    return pathname.endsWith('/feedback')
      ? { status: 206, body: [{ data: privateFixture }] }
      : { status: 200, body: [] };
  }, { key: 'sb_publishable_fake_for_test' });
  assert.equal(result.code, 1);
  assert.ok(result.requests.every(req => req.headers.authorization === undefined));
  assert.match(result.stdout, /feedback\s+EXPOSED \(HTTP 206/);
});

test('dashboard inventory adds hidden contact tables and deduplicates known tables', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-rls-test-'));
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'tables.txt');
  fs.writeFileSync(file, '# dashboard inventory\r\ncontact_hidden\r\ncontact_requests\r\n');
  const result = await probe(t, fixture({ status: 403, body: { code: '42501' } }), {
    args: ['--tables', file.replaceAll('\\', '/')],
  });
  assert.equal(result.code, 0);
  assert.match(result.stdout, /contact_hidden\s+DENIED/);
  assert.equal(result.requests.filter(req => req.url.includes('/contact_requests?')).length, 1);
});

test('plaintext non-loopback URLs and injected table names are refused', async t => {
  const insecure = await probe(t, fixture({ status: 200, body: [] }), { url: 'http://example.invalid' });
  assert.equal(insecure.code, 2);
  assert.equal(insecure.requests.length, 0);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-rls-test-'));
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'tables.txt');
  fs.writeFileSync(file, 'contact_extra?select=password_hash\n');
  const invalid = await probe(t, fixture({ status: 200, body: [] }), {
    args: ['--tables', file.replaceAll('\\', '/')],
  });
  assert.equal(invalid.code, 2);
  assert.equal(invalid.requests.length, 0);
});

test('transport failures remain inconclusive and do not log raw responses', async t => {
  const result = await probe(t, fixture({ drop: true }));
  assert.equal(result.code, 2);
  assert.match(result.stdout, /TRANSPORT_ERROR/);
});

test('redirects are not followed or classified as proof of protection', async t => {
  const result = await probe(t, fixture({ status: 302, headers: { location: '/capture-key' }, body: {} }));
  assert.equal(result.code, 2);
  assert.ok(result.requests.every(req => !req.url.includes('/capture-key')));
});
