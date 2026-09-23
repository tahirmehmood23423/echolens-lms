'use strict';
const { test } = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { fork } = require('node:child_process'), { once } = require('node:events');

test('the admin queue surfaces every unmarked state, and marking one frees the learner', { timeout: 45000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-unmarked-'));
  const child = fork(path.join(__dirname, 'fixtures/unmarked-work-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true, execArgv: [] });
  let logs = ''; child.stdout.on('data', c => logs += c); child.stderr.on('data', c => logs += c);
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; } fs.rmSync(runtime, { recursive: true, force: true }); });
  const ready = await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error(logs)), 20000); child.once('message', d => { clearTimeout(timer); resolve(d); }); child.once('exit', () => { clearTimeout(timer); reject(Error(logs)); }); });
  const base = 'http://127.0.0.1:' + ready.port;
  const api = async (url, role = 'admin', method = 'GET', body) => {
    const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(role ? { Cookie: ready.cookies[role] } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, data: await r.json().catch(() => ({})) };
  };

  // The report is admin-only.
  for (const role of [null, 'student', 'instructor']) {
    assert.equal((await api('/api/admin/open-attempts', role)).status, role ? 403 : 401);
  }

  const report = await api('/api/admin/open-attempts');
  assert.equal(report.status, 200);
  const byReason = Object.fromEntries(report.data.attempts.map(a => [a.reason, a]));
  // Each stranding state is present exactly once...
  assert.deepEqual(Object.keys(byReason).sort(), ['grading_failed', 'no_attempt', 'overdue']);
  // ...and the already-marked submission is not, since nobody is blocked by it.
  assert.equal(report.data.attempts.length, 3);
  assert.equal(report.data.summary.total, 3);
  assert.equal(report.data.summary.needs_marking, 3, 'none of these are ordinary staff review');
  assert.equal(report.data.summary.by_course['FC-01'].total, 3);
  assert.equal(report.data.summary.by_course['FC-01'].no_attempt, 1);
  // Rows carry who is blocked and on what, so an admin can act without digging.
  assert.equal(byReason.no_attempt.learner_name, 'Synthetic learner');
  assert.equal(byReason.no_attempt.course_code, 'FC-01');
  assert.equal(byReason.no_attempt.id, null, 'an orphan has no attempt id to grade through');

  // The orphan cannot be graded directly - it must be adopted first.
  const orphan = byReason.no_attempt.submission_id;
  assert.equal((await api('/api/admin/open-submissions/' + orphan + '/adopt', 'student', 'POST')).status, 403);
  const adopted = await api('/api/admin/open-submissions/' + orphan + '/adopt', 'admin', 'POST');
  assert.equal(adopted.status, 200);
  assert.ok(adopted.data.attempt.id);
  // Adopting again reuses the row rather than forking the learner's work.
  assert.equal((await api('/api/admin/open-submissions/' + orphan + '/adopt', 'admin', 'POST')).data.attempt.id, adopted.data.attempt.id);

  // A score with no feedback is enough: requiring prose kept learners waiting.
  assert.equal((await api('/api/admin/open-attempts/' + adopted.data.attempt.id + '/grade', 'admin', 'POST', { feedback: 'words but no score' })).status, 400);
  const graded = await api('/api/admin/open-attempts/' + adopted.data.attempt.id + '/grade', 'admin', 'POST', { score: 72 });
  assert.equal(graded.status, 200);
  const saved = JSON.parse(fs.readFileSync(path.join(runtime, 'store.json'))).open_submissions.find(s => s.id === orphan);
  assert.equal(saved.score, 72, 'the mark reaches the submission, which is what opens the next module');
  assert.ok(saved.graded_at);

  // Once marked it leaves the queue, so the count is a real backlog figure.
  const after = await api('/api/admin/open-attempts');
  assert.equal(after.data.summary.total, 2);
  assert.ok(!after.data.attempts.some(a => a.submission_id === orphan));
  // An already-marked submission cannot be adopted back into the queue.
  assert.equal((await api('/api/admin/open-submissions/' + orphan + '/adopt', 'admin', 'POST')).status, 409);

  // "Grade with AI" is admin-only, and says so plainly when no provider is
  // configured rather than leaving the marker staring at a dead button.
  const stuck = after.data.attempts[0];
  assert.equal((await api('/api/admin/open-attempts/' + stuck.id + '/ai-grade', 'student', 'POST')).status, 403);
  const aiTry = await api('/api/admin/open-attempts/' + stuck.id + '/ai-grade', 'admin', 'POST');
  assert.equal(aiTry.status, 503, 'this fixture runs with AI switched off');
  assert.match(aiTry.data.error, /not configured/i);
  // A refused AI grade must leave the attempt exactly as it was, still markable.
  const untouched = await api('/api/admin/open-attempts');
  assert.ok(untouched.data.attempts.some(a => a.submission_id === stuck.submission_id));
});
