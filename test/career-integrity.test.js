'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fork } = require('node:child_process');
const { once } = require('node:events');
const { createCurriculumService } = require('../career/curriculum/service');
const { BANKS } = require('../career/curriculum/questions');
const C = require('../career/curriculum');
const select = require('./helpers/choices.cjs');
function fixture() {
  let time = Date.parse('2026-11-04T12:00:00Z');
  const settings = {}, user = { id: 1, role: 'student' };
  const cur = createCurriculumService({ settings: () => settings, save() {}, career: u => u.career || {}, writeCareer: (u, c) => { u.career = c; }, isLearner: u => u.role === 'student', iso: () => new Date(time).toISOString(), now: () => new Date(time), audit() {}, users: () => [user] });
  const start = () => cur.startSubtrack(user, 'python-fundamentals').attempt;
  const answers = (a, correct = () => true) => Object.fromEntries(a.questions.map(q => { const k = BANKS['python-fundamentals'].questions.find(k => k.id === q.id); return [q.id, select(q, k, correct(k) ? k.answer : (k.answer + 1) % 4)]; }));
  return { cur, user, settings, start, answers, advance: ms => { time += ms; } };
}
test('bank indices are never accepted as public choices; another attempt has different tokens', () => {
  const f = fixture(), a = f.start();
  assert.ok(a.questions.every(q => q.options.every(o => /^[a-f0-9]{24}$/.test(o.id))));
  const r = f.cur.submit(f.user, a.id, Object.fromEntries(a.questions.map(q => [q.id, '0']))).result;
  assert.equal(r.overall, 0);
  assert.equal(r.answered, 0);
  const b = fixture().start();
  assert.ok(!b.questions.flatMap(q => q.options.map(o => o.id)).some(id => a.questions.some(q => q.options.some(o => o.id === id))));
});
test('late autosaves are refused and cannot produce a pass', () => {
  const f = fixture(), a = f.start(); f.advance(3 * 3600000);
  assert.equal(f.cur.saveAnswers(f.user, a.id, f.answers(a)).status, 409);
  assert.equal(f.cur.submit(f.user, a.id, f.answers(a)).result.overall, 0);
});
test('pre-fix active forms upgrade without losing saved work or silently recording zero', () => {
  const f = fixture(), a = f.start(), original = f.user.career.st.active;
  for (const item of original.items) delete item.choices;
  original.answers[a.questions[0].id] = '0';
  assert.equal(f.cur.submit(f.user, a.id, {}).status, 409);
  assert.equal(f.user.career.st.attempts.length, 0);
  const resumed = f.cur.resume(f.user).attempt;
  const first = resumed.questions.find(q => q.id === a.questions[0].id);
  assert.ok(first.options.some(o => o.id === resumed.answers[first.id]));
});
test('an active assessment is graded under the rules it started with', () => {
  const f = fixture(), a = f.start();
  f.cur.updateConfig({ weights: { easy: 5, medium: 5, hard: 1, advanced: 1 }, pass_overall: 100 }, 9);
  const r = f.cur.submit(f.user, a.id, f.answers(a, q => ['easy', 'medium'].includes(q.difficulty))).result;
  assert.equal(r.overall, 57); assert.equal(r.pass_mark, 80);
});
test('scoring configuration refuses string weights, negative percentages and fractional question counts', () => {
  const f = fixture();
  for (const patch of [{ weights: { easy: '5' } }, { mix: { easy: -10, medium: 65, hard: 35, advanced: 10 } }, { items: 20.5 }]) {
    assert.equal(f.cur.updateConfig(patch, 9).status, 400);
  }
  assert.equal(f.cur.config().version, 1);
});
test('an unanswered competency is unassessed, not zero proficiency', () => {
  const f = fixture(), a = f.start(), r = f.cur.submit(f.user, a.id, {}).result;
  assert.equal(r.overall, 0); assert.ok(r.competencies.every(c => c.score === null));
  assert.equal(r.unassessed.length, r.competencies.length);
});
test('required role paths include every prerequisite even when listed as optional', () => {
  const f = fixture();
  for (const role of C.ROLES) {
    const p = f.cur.rolePath(role);
    for (const id of p.required) for (const pre of C.prereqClosure(id)) {
      assert.ok(p.required.includes(pre), `${role.id}: ${pre}`);
      assert.ok(!p.optional.includes(pre));
    }
  }
});
test('retakes retain qualifying evidence and all historical attempts', () => {
  const f = fixture(); let a = f.start(); f.cur.submit(f.user, a.id, f.answers(a));
  const evidence = structuredClone(f.user.career.st.results['python-fundamentals'].evidence);
  f.advance(25 * 3600000); a = f.start(); f.cur.submit(f.user, a.id, f.answers(a, () => false));
  assert.equal(f.cur.resultFor(f.user, 'python-fundamentals').status, 'passed');
  assert.deepEqual(f.user.career.st.results['python-fundamentals'].evidence, evidence);
  f.user.career.st.attempts.unshift(...Array.from({ length: 150 }, (_, i) => ({ id: 'old-' + i, key: 'other', submitted_at: '2020-01-01', responses: [] })));
  f.advance(25 * 3600000); a = f.start(); f.cur.submit(f.user, a.id, {});
  assert.equal(f.user.career.st.attempts.length, 153);
});
test('comprehensive evidence is visible in shared skills and career progress without fabricating lesson completion', () => {
  const f = fixture(), a = f.start(); f.cur.submit(f.user, a.id, f.answers(a));
  const skills = f.cur.sharedSkills(f.user);
  assert.ok(skills.length > 0); assert.ok(skills.every(s => s.verification === 'verified'));
  f.cur.setTarget(f.user, 'junior-backend-developer');
  const progress = f.cur.progress(f.user);
  assert.equal(progress.target.id, 'junior-backend-developer'); assert.ok(progress.passed > 0);
  assert.equal(progress.learning_completion, null); assert.ok(progress.next);
});
test('verification cannot access application files or inherited environment', () => {
  const { verifyCode } = require('../career/curriculum/verify');
  const previous = process.env.ECHOLENS_VERIFIER_SENTINEL;
  process.env.ECHOLENS_VERIFIER_SENTINEL = 'synthetic-test';
  try {
    const result = verifyCode({ code: 'import os\nprint("isolated" if not os.path.exists("/workspace") and "ECHOLENS_VERIFIER_SENTINEL" not in os.environ else "exposed")', lang: 'python', expect: 'isolated', options: ['isolated', 'exposed', 'x', 'y'], answer: 0 });
    assert.equal(result.ok, true, result.problem);
  } finally { if (previous === undefined) delete process.env.ECHOLENS_VERIFIER_SENTINEL; else process.env.ECHOLENS_VERIFIER_SENTINEL = previous; }
});
test('real authenticated profile endpoints do not expose active legacy keys', { timeout: 30000 }, async t => {
  const runtime = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-integrity-'));
  const child = fork(path.join(__dirname, 'fixtures/certificate-server.cjs'), [], { env: { ...process.env, ECHOLENS_TEST_RUNTIME: runtime }, silent: true });
  t.after(async () => { if (child.exitCode === null && child.signalCode === null) { const done = once(child, 'exit'); child.kill(); await done; } fs.rmSync(runtime, { recursive: true, force: true }); });
  const ready = await new Promise((resolve, reject) => { child.once('message', resolve); child.once('exit', c => reject(Error('fixture exited ' + c))); });
  const call = async (url, body) => { const r = await fetch(`http://127.0.0.1:${ready.port}${url}`, { method: body ? 'POST' : 'GET', headers: { cookie: ready.cookies[2], 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json() }; };
  const a = await call('/api/career/me/attempts', { assessment: 'common' }); assert.equal(a.status, 200);
  const me = await call('/api/auth/me'); assert.equal(me.status, 200); assert.equal(me.body.profile.career, undefined);
  const raw = JSON.stringify(me.body); assert.ok(!raw.includes('"answer"')); assert.ok(!raw.includes('"choice_nonce"'));
  assert.ok(a.body.attempt.questions.every(q => q.options.every(o => /^[a-f0-9]{24}$/.test(o.id))));
  const stored = JSON.parse(fs.readFileSync(path.join(runtime, 'store.json'), 'utf8'));
  assert.ok(stored.users.find(u => u.id === 2).profile.career.active.questions.some(q => q.answer));
  const forged = await call(`/api/career/me/attempts/${a.body.attempt.id}/submit`, { answers: Object.fromEntries(a.body.attempt.questions.map(q => [q.id, 'a'])) });
  assert.equal(forged.body.attempt.result.answered, 0);
  assert.equal(forged.body.attempt.result.raw_score, null, 'unaccepted IDs provide no knowledge evidence');
});
test('Career mutations report storage failure rather than fabricated success', async t => {
  const express = require('express');
  const { register } = require('../career/routes');
  const user = { id: 1, role: 'student', profile: {} }, data = { users: [user], settings: {} };
  const store = { allData: () => data, persist() {}, pendingPersist: async () => { throw Error('synthetic disk failure'); }, Users: { byId: () => user } };
  const app = express(); app.use(express.json());
  register(app, { store, authRequired: (req, res, next) => { req.user = user; next(); }, adminRequired: (req, res) => res.sendStatus(403) });
  const server = app.listen(0); await once(server, 'listening'); t.after(() => server.close());
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/career/me/st/subtracks/python-fundamentals/start`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(response.status, 503); assert.match((await response.json()).error, /could not be saved/);
});
