'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { fork } = require('node:child_process'), { once } = require('node:events');

// The reported incident: learners received working credentials for accounts
// that were not in the system. mailer.notify() leaves the process immediately,
// while store.save() only queues the Postgres write - so a failed flush sent
// the password and lost the account.
test('a signup whose write fails sends no credentials and reports the failure', { timeout: 45000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-durability-'));
  const child = fork(path.join(__dirname, 'fixtures/signup-durability-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [] });
  let logs = ''; child.stdout.on('data', c => logs += c); child.stderr.on('data', c => logs += c);
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; } fs.rmSync(runtime, { recursive: true, force: true }); });
  const ready = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error(logs)), 25000); child.once('message', d => { clearTimeout(timer); resolve(d); }); child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); }); });
  // The fixture answers with its own verb: break -> broken, heal -> healed.
  const REPLY = { break: 'broken', heal: 'healed', mail: 'mail' };
  const ask = (type) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.off('message', on); reject(Error(`no ${REPLY[type]} reply`)); }, 10000);
    const on = (m) => { if (m?.type === REPLY[type]) { clearTimeout(timer); child.off('message', on); resolve(m); } };
    child.on('message', on); child.send({ type });
  });
  const post = (url, body) => fetch('http://127.0.0.1:' + ready.port + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  // Signup is code-gated when mail is up; the fixture captures the code mail,
  // so the test can read its own code rather than weakening the route.
  const codeFor = async (email) => {
    await post('/api/auth/email-code', { email });
    const box = await ask('mail');
    const codeMail = box.sent.filter(m => m.to === email && /verification code/i.test(m.subject)).pop();
    return (String(codeMail?.text || '').match(/\b(\d{6})\b/) || [])[1];
  };
  const register = (email, code) => post('/api/auth/register-open', { name: 'Synthetic Learner', email, code, age_declaration: 'adult', whatsapp: '03001234567', city: 'Lahore', university: 'Sample', degree: 'BS CS', study_year: '3' });
  const signup = async (email) => register(email, await codeFor(email));

  // A healthy signup is the control: it must still work and still email.
  const good = await signup('durable@gmail.com');
  const goodBody = await good.json();
  assert.equal(good.status, 200, 'healthy signup should succeed: ' + JSON.stringify(goodBody));
  const afterGood = await ask('mail');
  assert.equal(afterGood.sent.filter(m => m.to === 'durable@gmail.com' && /your password/i.test(m.subject)).length, 1, 'the control signup is emailed');

  // Now make the account write fail the way a failed flush does. The code is
  // fetched first so the armed failure lands on the signup itself.
  const lostCode = await codeFor('lost@gmail.com');
  await ask('break');
  const bad = await register('lost@gmail.com', lostCode);
  const badBody = await bad.json().catch(() => ({}));
  assert.notEqual(bad.status, 200, 'a signup that did not save must not report success');
  assert.match(String(badBody.error || ''), /could not be saved|went wrong/i);

  // The whole point: no credentials for an account that is not in the system.
  const afterBad = await ask('mail');
  const leaked = afterBad.sent.filter(m => m.to === 'lost@gmail.com' && /your password/i.test(m.subject));
  assert.deepEqual(leaked, [], 'no email may be sent for an account whose write failed');
  // And no session cookie that would let them "sign in" to a missing account.
  assert.ok(!/el_token=[^;\s]/.test(String(bad.headers.get('set-cookie') || '')), 'no live session token for an account that did not save');

  // Recovery: once the flush works again, signups email normally.
  await ask('heal');
  const recovered = await signup('recovered@gmail.com');
  assert.equal(recovered.status, 200);
  const afterHeal = await ask('mail');
  assert.equal(afterHeal.sent.filter(m => m.to === 'recovered@gmail.com' && /your password/i.test(m.subject)).length, 1);
});
