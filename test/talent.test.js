'use strict';

/**
 * Talent Marketplace integration tests (Phases 0-6).
 *
 * Requires DATABASE_URL to point at a real, reachable Postgres SERVER
 * (any database on it - these tests never touch that database directly).
 * These are integration tests against the actual HTTP API and Postgres,
 * not unit tests with mocks (see the Phase 0 summary for why: this app's
 * whole point here is Postgres-backed search/contact-gating behaviour,
 * which a mock would not actually exercise).
 *
 * Everything in this file runs against a dedicated scratch database
 * (`echolens_test_<run id>`) created in the `before` hook and dropped in
 * `after` - it never reads or writes whatever database DATABASE_URL's own
 * path points at, so running this against a shared dev database is safe.
 * Needs CREATEDB privilege on the connecting role.
 *
 *   DATABASE_URL=postgres://postgres:echolens_dev@localhost:5433/echolens \
 *   PGSSLMODE=disable npm test
 */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { Client } = require('pg');

const ROOT = path.join(__dirname, '..');
const PORT = process.env.TEST_PORT || 3900;
const BASE = `http://localhost:${PORT}`;
const RUN_ID = Date.now();
const SCRATCH_DB_NAME = `echolens_test_${RUN_ID}`;
const SCRATCH_DB_PATH = path.join(os.tmpdir(), `echolens-test-empty-${RUN_ID}.json`);
const SSL = (process.env.PGSSLMODE || 'disable') === 'disable' ? false : { rejectUnauthorized: false };

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set - these are Postgres integration tests, not unit tests. See the file header for how to run them.');
  process.exit(1);
}
const adminUrl = new URL(process.env.DATABASE_URL); adminUrl.pathname = '/postgres';
const scratchUrl = new URL(process.env.DATABASE_URL); scratchUrl.pathname = `/${SCRATCH_DB_NAME}`;
const DATABASE_URL = scratchUrl.toString();

// Everything below - this test file's own in-process seed() included -
// must resolve DATABASE_URL/DB_PATH from *this* process's env, not just
// a spawned child's, so it's set here before store.js/db.js are ever
// required (both read these once, at module load, and cache them).
process.env.DATABASE_URL = DATABASE_URL;
process.env.PGSSLMODE = process.env.PGSSLMODE || 'disable';
process.env.DB_PATH = SCRATCH_DB_PATH;

const ENV = {
  ...process.env,
  DATABASE_URL, PGSSLMODE: process.env.PGSSLMODE,
  PORT: String(PORT), JWT_SECRET: 'test-secret-do-not-use-in-production',
  NODE_ENV: 'development', DB_PATH: SCRATCH_DB_PATH,
};

let serverProc;
let fixtures; // set by seed()

function runSync(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, env: ENV, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (exit ${r.status}):\n${r.stdout}\n${r.stderr}`);
  return r.stdout;
}
async function api(pathName, opts = {}) {
  const res = await fetch(BASE + pathName, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON response (e.g. HTML page, CSV) is fine for some tests */ }
  return { status: res.status, body, setCookie: res.headers.get('set-cookie') };
}
function cookieHeader(setCookie) { return { Cookie: (setCookie || '').split(';')[0] }; }

/** Creates a fresh admin/student/recruiter with known passwords and a published student profile, directly through store.js/Postgres - the same way the manual verification throughout development did, just scripted. */
async function seed() {
  const store = require('../store');
  const db = require('../db');
  await store.initFromPostgres();
  const { Users, Companies } = store;

  const email = (label) => `${label}.${RUN_ID}@test.echolens.invalid`;
  const admin = Users.create({ name: 'Test Admin', role: 'admin', email: email('admin'), username: email('admin') }).user;
  Users.setPassword(admin.id, 'TestPass123!');
  const student = Users.create({ name: 'Test Student', role: 'student', email: email('student'), username: email('student') }).user;
  Users.setPassword(student.id, 'TestPass123!');

  const company = Companies.create({ domain: `test-${RUN_ID}.example`, name: 'Test Co', website: null, size_band: '1-10' });
  const { user: recruiter } = Users.createRecruiter({
    name: 'Test Recruiter', email: email('recruiter'), company_id: company.id,
    designation: 'Recruiter', city: 'Lahore', hiring_note: 'Testing', override_requested: false, override_reason: null,
  });
  Users.setPassword(recruiter.id, 'TestPass123!');
  Users.setRecruiterStatus(recruiter.id, 'approved', { by: admin.id });

  await store.pendingPersist();

  const handle = `test-student-${RUN_ID}`;
  await db.query(
    `INSERT INTO talent_profiles (user_id, handle, headline, about, city, remote_pref, availability, work_type, published)
     VALUES ($1,$2,'Test headline','This About section is long enough to satisfy the completeness checklist for publishing.','Lahore','remote','immediately',ARRAY['internship'],true)`,
    [student.id, handle]
  );

  return {
    admin: { id: admin.id, login: admin.email, password: 'TestPass123!' },
    student: { id: student.id, login: student.email, password: 'TestPass123!' },
    recruiter: { id: recruiter.id, login: recruiter.email, password: 'TestPass123!' },
    handle,
  };
}

async function waitForServer() {
  const started = Date.now();
  while (Date.now() - started < 20000) {
    try { const r = await fetch(BASE + '/'); if (r.ok || r.status === 404) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Server did not become ready within 20s');
}

before(async () => {
  const admin = new Client({ connectionString: adminUrl.toString(), ssl: SSL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH_DB_NAME}`);
  await admin.query(`CREATE DATABASE ${SCRATCH_DB_NAME}`);
  await admin.end();

  runSync('node', [path.join('migrations', 'run.js')]);
  fixtures = await seed();
  serverProc = spawn('node', ['server.js'], { cwd: ROOT, env: ENV, stdio: 'pipe' });
  serverProc.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  await waitForServer();
});

after(async () => {
  if (serverProc) serverProc.kill();
  try { fs.unlinkSync(SCRATCH_DB_PATH); } catch { /* fine if it was never written */ }
  const admin = new Client({ connectionString: adminUrl.toString(), ssl: SSL });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${SCRATCH_DB_NAME}`);
  await admin.end();
});

test('recruiter cannot see student contact details before the request is accepted', async () => {
  const rec = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: fixtures.recruiter.login, password: fixtures.recruiter.password }) });
  const recCookie = cookieHeader(rec.setCookie);
  const stu = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: fixtures.student.login, password: fixtures.student.password }) });
  const stuCookie = cookieHeader(stu.setCookie);

  const sent = await api(`/api/talent/profile/${fixtures.handle}/contact-request`, { method: 'POST', headers: recCookie, body: JSON.stringify({ message: 'Test outreach message.' }) });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const requestId = sent.body.request.id;

  const beforeAccept = await api(`/api/talent/recruiter/contact-requests/${requestId}`, { headers: recCookie });
  assert.equal(beforeAccept.status, 200);
  assert.equal(beforeAccept.body.email, undefined, 'email must not be present before acceptance');
  assert.equal(beforeAccept.body.status, 'pending');

  const msgBeforeAccept = await api(`/api/talent/contact-requests/${requestId}/messages`, { method: 'POST', headers: recCookie, body: JSON.stringify({ body: 'hi' }) });
  assert.equal(msgBeforeAccept.status, 403, 'messaging must be blocked before acceptance');

  const accept = await api(`/api/talent/me/contact-requests/${requestId}/accept`, { method: 'POST', headers: stuCookie });
  assert.equal(accept.status, 200);

  const afterAccept = await api(`/api/talent/recruiter/contact-requests/${requestId}`, { headers: recCookie });
  assert.equal(afterAccept.status, 200);
  assert.equal(afterAccept.body.status, 'accepted');
  assert.equal(afterAccept.body.email, fixtures.student.login, 'email must be revealed after acceptance');
});

test('an unpublished profile returns 404 on its public URL', async () => {
  const live = await api(`/api/talent/profile/${fixtures.handle}`);
  assert.equal(live.status, 200);

  const admin = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: fixtures.admin.login, password: fixtures.admin.password }) });
  const adminCookie = cookieHeader(admin.setCookie);
  const unpub = await api(`/api/admin/talent/profiles/${fixtures.student.id}/unpublish`, { method: 'POST', headers: adminCookie, body: JSON.stringify({ reason: 'Integration test unpublish.' }) });
  assert.equal(unpub.status, 200, JSON.stringify(unpub.body));

  const gone = await api(`/api/talent/profile/${fixtures.handle}`);
  assert.equal(gone.status, 404);

  const page = await fetch(`${BASE}/talent/${fixtures.handle}`);
  assert.equal(page.status, 200); // the page shell always 200s (client-side renders the 404 state)
  const html = await page.text();
  assert.ok(!html.includes(fixtures.handle) || !html.includes('og:title'), 'the unpublished profile must not get server-rendered SEO tags');

  // Republish so later tests (and re-runs against a persistent scratch DB) see a normal, published profile again.
  const stu = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: fixtures.student.login, password: fixtures.student.password }) });
  await api('/api/talent/me/publish', { method: 'POST', headers: cookieHeader(stu.setCookie) });
});

test('search is authorized: only an approved recruiter can search, not a student or an anonymous visitor', async () => {
  const anon = await api('/api/talent/search');
  assert.equal(anon.status, 401);

  const stu = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: fixtures.student.login, password: fixtures.student.password }) });
  const asStudent = await api('/api/talent/search', { headers: cookieHeader(stu.setCookie) });
  assert.equal(asStudent.status, 403);

  const rec = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ login: fixtures.recruiter.login, password: fixtures.recruiter.password }) });
  const asRecruiter = await api('/api/talent/search', { headers: cookieHeader(rec.setCookie) });
  assert.equal(asRecruiter.status, 200);
  assert.ok(Array.isArray(asRecruiter.body.results));
});

test('the JSON to Postgres import (the real CLI, not a reimplementation) preserves record counts exactly', async () => {
  const { Client } = require('pg');
  const { COLLECTIONS } = require('../migrations/collections');

  // Runs migrations/import-json.js for real, against a dedicated scratch
  // database (created and dropped by this test) rather than the shared
  // one the other tests seed fixtures into - importing truncates and
  // reloads its target tables, which would wreck those fixtures.
  const scratchDbName = `echolens_import_test_${RUN_ID}`;
  const adminUrl = new URL(DATABASE_URL); adminUrl.pathname = '/postgres';
  const scratchUrl = new URL(DATABASE_URL); scratchUrl.pathname = `/${scratchDbName}`;

  const admin = new Client({ connectionString: adminUrl.toString(), ssl: ENV.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false } });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS ${scratchDbName}`);
  await admin.query(`CREATE DATABASE ${scratchDbName}`);
  await admin.end();

  const fixtureJson = { seq: {}, issued_usernames: [], issued_regnos: [], settings: {} };
  for (const name of COLLECTIONS) fixtureJson[name] = [];
  fixtureJson.users = [
    { id: 1, name: 'Import Test Alice', role: 'student', username: `alice-${RUN_ID}`, email: null, password_hash: null, profile: {}, streak: 0, best_streak: 0, created_at: '2026-01-01 00:00:00' },
    { id: 2, name: 'Import Test Bob', role: 'admin', username: `bob-${RUN_ID}`, email: null, password_hash: null, profile: {}, streak: 0, best_streak: 0, created_at: '2026-01-01 00:00:00' },
  ];
  fixtureJson.leads = [{ id: 1, name: 'Import Test Lead', email: `lead-${RUN_ID}@test.invalid`, whatsapp: '0000', source: 'test' }];
  fixtureJson.courses = [{ id: 1, code: 'TC-01', title: 'Import Test Course', tier: 'Bootcamp', created_at: '2026-01-01 00:00:00' }];

  const tmpJson = path.join(os.tmpdir(), `echolens-import-fixture-${RUN_ID}.json`);
  fs.writeFileSync(tmpJson, JSON.stringify(fixtureJson));

  try {
    const scratchEnv = { ...ENV, DATABASE_URL: scratchUrl.toString(), DB_PATH: tmpJson };
    let r = spawnSync('node', [path.join('migrations', 'run.js')], { cwd: ROOT, env: scratchEnv, encoding: 'utf8' });
    assert.equal(r.status, 0, `migrate failed:\n${r.stdout}\n${r.stderr}`);
    r = spawnSync('node', [path.join('migrations', 'import-json.js')], { cwd: ROOT, env: scratchEnv, encoding: 'utf8' });
    assert.equal(r.status, 0, `import failed:\n${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /All collections match/);

    const scratchClient = new Client({ connectionString: scratchUrl.toString(), ssl: scratchEnv.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false } });
    await scratchClient.connect();
    for (const [name, records] of Object.entries({ users: fixtureJson.users, leads: fixtureJson.leads, courses: fixtureJson.courses })) {
      const { rows } = await scratchClient.query(`SELECT count(*)::int AS n FROM ${name}`);
      assert.equal(rows[0].n, records.length, `${name}: expected exactly ${records.length} row(s) after import, found ${rows[0].n}`);
    }
    await scratchClient.end();
  } finally {
    fs.unlinkSync(tmpJson);
    const cleanup = new Client({ connectionString: adminUrl.toString(), ssl: ENV.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false } });
    await cleanup.connect();
    await cleanup.query(`DROP DATABASE IF EXISTS ${scratchDbName}`);
    await cleanup.end();
  }
});
