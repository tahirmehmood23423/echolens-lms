'use strict';
const selectChoice = require('./helpers/choices.cjs');
/**
 * Phase 2A: canonical curriculum, job roles and comprehensive subtrack
 * assessments, over HTTP against the real store. Covers acceptance tests
 * 1 to 8 from the Phase 2A brief plus catalogue and bank quality gates.
 */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const dbPath = path.join(os.tmpdir(), 'echolens-curriculum-' + crypto.randomUUID() + '.json');
require('dotenv').config = () => ({ parsed: {} });
process.env.DATABASE_URL = ''; process.env.DB_PATH = dbPath;
const store = require('../store');
const express = require('express');
const { register } = require('../career/routes');
const C = require('../career/curriculum');
const { validateQuestion, validateBank } = require('../career/curriculum/qdsl');
const { BANKS } = require('../career/curriculum/questions');
const { verifyCode } = require('../career/curriculum/verify');

let server, base, svc, cur;
const auth = (req, res, next) => { const u = store.Users.byId(Number(req.headers['x-user'])); if (!u) return res.status(401).json({ error: 'Sign in.' }); req.user = { id: u.id, role: u.role }; next(); };
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access only.' }));
before(async () => {
  const app = express(); app.use(express.json({ limit: '2mb' }));
  svc = register(app, { store, authRequired: auth, adminRequired: admin, optionalUser: (req) => (req.headers['x-user'] ? { id: Number(req.headers['x-user']) } : null) });
  cur = svc.curriculum;
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); });
beforeEach(() => {
  const d = store.allData();
  d.users = [{ id: 1, role: 'student', profile: {} }, { id: 2, role: 'student', profile: {} }, { id: 3, role: 'admin', profile: {} }];
  for (const k of ['career_st_config', 'career_stq', 'career_st_assess', 'career_curriculum']) d.settings[k] = undefined;
});
const call = async (method, url, user, body) => {
  const res = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(user ? { 'x-user': String(user) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const publish = (id) => call('POST', `/api/admin/career/curriculum/subtracks/${id}/publish`, 3);
const start = (u, id) => call('POST', `/api/career/me/st/subtracks/${id}/start`, u);
const submit = (u, a, answers) => call('POST', `/api/career/me/st/attempts/${a.id}/submit`, u, { answers });
const key = (sub, id) => BANKS[sub].questions.find((q) => q.id === id);
/** Answer each question correctly when pick(q) is true, otherwise choose a wrong option. */
const answersFor = (sub, attempt, pick) => Object.fromEntries(attempt.questions.map((q) => { const k = key(sub, q.id); return [q.id, selectChoice(q, k, pick(k) ? k.answer : (k.answer + 1) % 4)]; }));
const tally = (list, f) => list.reduce((m, x) => (m[f(x)] = (m[f(x)] || 0) + 1, m), {});

/* ------------------------------ catalogue gates ------------------------------ */
test('catalogue: 12 tracks, unique ids, no prerequisite cycles, every role path valid', () => {
  const v = C.validate();
  assert.deepEqual(v.errors, []);
  assert.equal(Object.keys(C.TRACKS).length, 12);
  assert.equal(new Set(C.SUBTRACKS.map((s) => s.id)).size, C.SUBTRACKS.length);
  for (const s of C.SUBTRACKS) assert.ok(s.modules.length >= 3 && s.modules.length <= 6, s.id);
  for (const r of C.ROLES) {
    const p = C.rolePath(r);
    // Prerequisites always come before the subtracks that need them.
    p.required.forEach((id, i) => C.subtrack(id).prereq.forEach((pre) => { if (p.required.includes(pre)) assert.ok(p.required.indexOf(pre) < i, `${r.id}: ${pre} before ${id}`); }));
    assert.ok(['search_summary_unverified', 'jd_verification_required'].includes(r.jd.status), r.id);
  }
});

test('banks: every built-in bank passes validation and every code output is verified by execution', () => {
  for (const [id, b] of Object.entries(BANKS)) {
    const v = validateBank(b.questions, C.subtrack(id));
    assert.deepEqual(v.errors, [], id); assert.deepEqual(v.warnings, [], id);
    // No length tell: guessing by option length never beats 40% (chance is 25%).
    for (const [k, pct] of Object.entries(v.length_guess)) assert.ok(pct <= 40, `${id}: guessing ${k} scores ${pct}%`);
    assert.ok(b.questions.length >= 90, `${id} has ${b.questions.length}`);
    assert.ok(b.questions.filter((q) => q.scenario).length / b.questions.length >= 0.7, `${id} scenario share`);
    const comps = C.subtrack(id).modules.flatMap((m) => m.objectives.map((o) => o.id.slice(id.length + 1)));
    for (const c of comps) assert.ok(b.questions.filter((q) => q.comp === c).length >= 5, `${id} ${c}`);
  }
  const out = execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'verify-career-code.js')], { encoding: 'utf8' });
  assert.match(out, / 0 problems/);
});

test('approved banks are live by default; unpublished assessments cannot be started; forms never contain the answer key', async () => {
  assert.equal((await call('GET', '/api/career/curriculum/subtracks/python-fundamentals', 1)).body.assessment.state, 'published');
  assert.equal((await call('GET', '/api/career/curriculum/subtracks/git-collaboration', 1)).body.assessment.state, 'published');
  assert.equal((await call('GET', '/api/career/curriculum/subtracks/linux-sysadmin', 1)).body.assessment.state, 'draft');
  assert.equal((await start(1,'linux-sysadmin')).status,409,'new unreviewed bank cannot start');
  assert.equal((await call('POST', '/api/admin/career/curriculum/subtracks/python-fundamentals/unpublish', 3)).status, 200);
  let r = await start(1, 'python-fundamentals');
  assert.equal(r.status, 409);
  assert.equal((await call('GET', '/api/career/curriculum/subtracks/python-fundamentals', 1)).body.assessment.state, 'ready');
  assert.equal((await publish('python-fundamentals')).status, 200);
  r = await start(1, 'python-fundamentals');
  assert.equal(r.status, 200);
  const raw = JSON.stringify(r.body);
  for (const k of ['"answer"', '"explanation"', '"why"', '"expect"']) assert.ok(!raw.includes(k), k);
  assert.equal((await call('POST', '/api/admin/career/curriculum/subtracks/python-fundamentals/publish', 1)).status, 403);
});

/* ------------------------------ acceptance tests ------------------------------ */
test('1. Python Fundamentals: realistic difficulty mix, scenario share, full coverage and accurate skill feedback', async () => {
  await publish('python-fundamentals');
  const { body: { attempt } } = await start(1, 'python-fundamentals');
  assert.equal(attempt.questions.length, 30);
  assert.deepEqual(tally(attempt.questions, (q) => q.difficulty), { easy: 6, medium: 11, hard: 10, advanced: 3 });
  assert.ok(attempt.questions.filter((q) => q.scenario).length >= 21, 'at least 70% scenarios');
  const s = C.subtrack('python-fundamentals'), comps = new Set(attempt.questions.map((q) => key('python-fundamentals', q.id).comp));
  for (const m of s.modules) for (const o of m.objectives) assert.ok(comps.has(o.id.slice(s.id.length + 1)), 'covers ' + o.id);
  // A foundational learner: right on easy and medium, wrong on hard and advanced.
  const { body: { result } } = await submit(1, attempt, answersFor('python-fundamentals', attempt, (k) => ['easy', 'medium'].includes(k.difficulty)));
  assert.equal(result.by_difficulty.easy.score, 100); assert.equal(result.by_difficulty.medium.score, 100);
  assert.equal(result.by_difficulty.hard.score, 0); assert.equal(result.by_difficulty.advanced.score, 0);
  assert.equal(result.overall, Math.round((17 / 30) * 100));
  assert.equal(result.outcome, 'learning_recommended');
  assert.ok(result.competencies.length >= 12 && result.competencies.every((c) => c.text && c.module));
  assert.ok(result.by_scenario.scenario.items + result.by_scenario.foundational.items === 30);
  assert.equal(result.label, 'EchoLens Assessed Knowledge Readiness');
});

test('2. Backend API Design: retry, authentication, caching, validation, error and security scenarios appear', async () => {
  await publish('rest-api-design');
  const { body: { attempt } } = await start(1, 'rest-api-design');
  const comps = new Set(attempt.questions.map((q) => key('rest-api-design', q.id).comp));
  for (const [c, what] of [['m3.c1', 'retry/idempotency'], ['m1.c3', 'errors and authentication status'], ['m3.c3', 'caching'], ['m2.c1', 'validation'], ['m4.c2', 'secrets and security'], ['m3.c2', 'timeouts and rate limits']]) assert.ok(comps.has(c), what);
  assert.ok(attempt.questions.filter((q) => q.scenario).length >= 21);
  // Critical competencies get at least two items each.
  for (const c of ['m1.c1', 'm2.c1', 'm3.c1']) assert.ok(attempt.questions.filter((q) => key('rest-api-design', q.id).comp === c).length >= 2, c);
});

test('3. a 55% score names unmet competencies and their modules, and never marks mastery', async () => {
  await publish('sql-fundamentals');
  const { body: { attempt } } = await start(1, 'sql-fundamentals');
  let n = 0; const target = Math.round(30 * 0.55);
  const { body: { result } } = await submit(1, attempt, answersFor('sql-fundamentals', attempt, () => n++ < target));
  assert.equal(result.overall, Math.round((target / 30) * 100));
  assert.equal(result.outcome, 'learning_recommended');
  assert.ok(result.weakest.length > 0);
  assert.ok(result.learning_areas.length > 0);
  for (const a of result.learning_areas) { assert.equal(a.content, 'Learning content in preparation'); assert.ok(C.SUBTRACKS.some((s) => s.modules.some((m) => m.title === a.module))); assert.ok(!('url' in a)); }
  const view = (await call('GET', '/api/career/curriculum/subtracks/sql-fundamentals', 1)).body;
  assert.equal(view.student.status, 'learning_recommended');
  assert.notEqual(view.student.status, 'passed');
});

test('4. 85% overall with a failed critical competency needs further evidence, not mastery', async () => {
  await publish('sql-fundamentals');
  const { body: { attempt } } = await start(1, 'sql-fundamentals');
  // Miss every item of the critical competency m2.c1 (joins), get the rest right.
  const { body: { result } } = await submit(1, attempt, answersFor('sql-fundamentals', attempt, (k) => k.comp !== 'm2.c1'));
  assert.ok(result.overall >= 80, `overall ${result.overall}`);
  assert.equal(result.outcome, 'further_evidence_required');
  assert.ok(result.critical_gaps.some((c) => c.id === 'sql-fundamentals.m2.c1'));
  assert.equal((await call('GET', '/api/career/curriculum/subtracks/sql-fundamentals', 1)).body.student.status, 'further_evidence_required');
});

test('5. a retake gets a fresh question set of equivalent difficulty', async () => {
  await publish('python-fundamentals');
  await call('PUT', '/api/admin/career/curriculum/config', 3, { retake_hours: 0 });
  const a1 = (await start(1, 'python-fundamentals')).body.attempt;
  await submit(1, a1, answersFor('python-fundamentals', a1, () => true));
  const a2 = (await start(1, 'python-fundamentals')).body.attempt;
  const seen = new Set(a1.questions.map((q) => q.id)), overlap = a2.questions.filter((q) => seen.has(q.id)).length;
  assert.ok(overlap <= 3, `overlap ${overlap}`);
  assert.deepEqual(tally(a2.questions, (q) => q.difficulty), tally(a1.questions, (q) => q.difficulty));
  // Default rule: a 24 hour wait between attempts.
  await call('PUT', '/api/admin/career/curriculum/config', 3, { retake_hours: 24 });
  await submit(1, a2, {});
  assert.equal((await start(1, 'python-fundamentals')).status, 429);
});

test('6. SQL Fundamentals evidence from Data Analytics is recognised in Data Engineering', async () => {
  await publish('sql-fundamentals');
  const a = (await start(1, 'sql-fundamentals')).body.attempt;
  const { body: { result } } = await submit(1, a, answersFor('sql-fundamentals', a, () => true));
  assert.equal(result.outcome, 'passed');
  const find = (view) => view.order.flatMap((e) => e.subtracks).find((s) => s.id === 'sql-fundamentals');
  const da = (await call('GET', '/api/career/curriculum/tracks/data-analyst-business-intelligence', 1)).body;
  const de = (await call('GET', '/api/career/curriculum/tracks/data-engineer', 1)).body;
  assert.equal(find(da).student.status, 'passed'); assert.equal(find(de).student.status, 'passed');
  const role = (await call('GET', '/api/career/curriculum/roles/junior-data-engineer', 1)).body;
  assert.equal(role.required.find((s) => s.id === 'sql-fundamentals').student.status, 'passed');
  assert.equal(role.readiness.label, 'EchoLens Assessed Knowledge Readiness');
  assert.equal(role.readiness.ready, false); // one subtrack is not the whole role
  assert.equal(role.final_assessment.state, 'blueprint');
});

test('7. question-quality validation flags multiple correct answers and invalid code output', async () => {
  const s = C.subtrack('python-fundamentals');
  const base = { id: 'x-1', comp: 'm1.c1', difficulty: 'medium', type: 'output', scenario: 'retail', prompt: 'What does this code print for the shop?', code: 'print(2 + 2)',
    options: ['4', '22', '5', '8'], answer: 0, explanation: 'Integer addition of two and two gives four.', why: ['Strings would concatenate.', 'Off by one error in the sum.', 'Multiplied twice instead of added.'], expect: '4', lang: 'python' };
  assert.deepEqual(validateQuestion(base, s).errors, []);
  assert.ok(verifyCode(base).ok);
  // Two options with the same text are two correct answers.
  assert.ok(validateQuestion({ ...base, options: ['4', '4', '5', '8'] }, s).errors.some((e) => /same text/.test(e)));
  assert.ok(validateQuestion({ ...base, options: ['4', 'All of the above', '5', '8'] }, s).errors.some((e) => /all\/none/.test(e)));
  // A wrong declared output is caught by execution.
  const wrong = { ...base, options: ['5', '22', '4', '8'], expect: '5' };
  assert.deepEqual(validateQuestion(wrong, s).errors, []);
  assert.equal(verifyCode(wrong).ok, false);
  // Admin import rejects both, and accepts the valid one as a draft.
  const r = await call('POST', '/api/admin/career/curriculum/subtracks/python-fundamentals/questions/import', 3,
    { questions: [{ ...base, id: 'imp-ok' }, { ...base, id: 'imp-dup', options: ['4', '4', '5', '8'] }, { ...wrong, id: 'imp-bad' }] });
  assert.deepEqual(r.body.added, ['imp-ok']);
  assert.deepEqual(r.body.rejected.map((x) => x.id).sort(), ['imp-bad', 'imp-dup']);
  const q = (await call('GET', '/api/admin/career/curriculum/subtracks/python-fundamentals/questions?status=draft', 3)).body.questions;
  assert.ok(q.some((x) => x.id === 'imp-ok'));
  // An edit that breaks a code answer cannot be marked reviewed.
  await call('PUT', '/api/admin/career/curriculum/subtracks/python-fundamentals/questions/imp-ok', 3, { code: 'print(2 * 3)' });
  const st = await call('POST', '/api/admin/career/curriculum/subtracks/python-fundamentals/questions/status', 3, { ids: ['imp-ok'], status: 'reviewed' });
  assert.deepEqual(st.body.refused, ['imp-ok']);
});

test('8. a subtrack with insufficient reviewed questions cannot be published as complete', async () => {
  // This canonical subtrack still has no bank; Linux now has an unreviewed draft.
  let r = await publish('kubernetes');
  assert.equal(r.status, 409);
  assert.equal((await call('GET', '/api/career/curriculum/subtracks/kubernetes')).body.assessment.state, 'planned');
  // A real bank with most items sent back to draft.
  const ids = BANKS['python-fundamentals'].questions.slice(0, 70).map((q) => q.id);
  await call('POST', '/api/admin/career/curriculum/subtracks/python-fundamentals/questions/status', 3, { ids, status: 'draft' });
  r = await publish('python-fundamentals');
  assert.equal(r.status, 409);
  assert.ok(r.body.reasons.length > 0);
  assert.equal((await call('GET', '/api/career/curriculum/subtracks/python-fundamentals')).body.assessment.state, 'draft');
  // QA dashboard reports it as not complete.
  const qa = (await call('GET', '/api/admin/career/curriculum', 3)).body;
  const row = qa.subtracks.find((x) => x.id === 'python-fundamentals');
  assert.equal(row.coverage_ok, false); assert.equal(row.assessment, 'draft');
});

/* ------------------------------ further safety rules ------------------------------ */
test('a later lower score never erases an earlier valid pass, and history is kept', async () => {
  await publish('rest-api-design');
  await call('PUT', '/api/admin/career/curriculum/config', 3, { retake_hours: 0 });
  const a = (await start(2, 'rest-api-design')).body.attempt;
  await submit(2, a, answersFor('rest-api-design', a, () => true));
  const b = (await start(2, 'rest-api-design')).body.attempt;
  await submit(2, b, {});
  const v = (await call('GET', '/api/career/curriculum/subtracks/rest-api-design', 2)).body.student;
  assert.equal(v.status, 'passed'); assert.equal(v.attempts, 2); assert.equal(v.attempts_list.length, 2);
  const review = (await call('GET', `/api/career/me/st/attempts/${b.id}/review`, 2)).body.review;
  assert.ok(review.every((x) => !('correct_answer' in x) && x.explanation === null));
});

test('structure edits are validated: prerequisite cycles and mandatory/optional overlaps are refused', async () => {
  let r = await call('PUT', '/api/admin/career/curriculum/structure', 3, { subtrack: { id: 'programming-foundations', prereq: ['rest-api-design'] } });
  assert.equal(r.status, 400); assert.match(r.body.error, /cycle/);
  const role = C.role('junior-data-engineer');
  r = await call('PUT', '/api/admin/career/curriculum/structure', 3, { role: { id: role.id, optional: [role.mandatory[0]] } });
  assert.equal(r.status, 400);
  r = await call('PUT', '/api/admin/career/curriculum/structure', 3, { role: { id: role.id, jd_status: 'jd_reviewed' } });
  assert.equal(r.status, 200);
  assert.equal((await call('GET', '/api/career/curriculum/roles/junior-data-engineer')).body.jd.status, 'jd_reviewed');
});

test('role final assessment: 60 items from every required subtrack, graded server side, readiness needs every subtrack too', async () => {
  const subs = ['programming-foundations', 'python-fundamentals', 'sql-fundamentals', 'git-collaboration'];
  await call('PUT', '/api/admin/career/curriculum/structure', 3, { role: { id: 'junior-data-analyst', mandatory: subs, optional: [] } });
  await call('PUT', '/api/admin/career/curriculum/config', 3, { retake_hours: 0 });
  const role = (await call('GET', '/api/career/curriculum/roles/junior-data-analyst', 1)).body;
  assert.deepEqual(role.required.map((s) => s.id), subs);
  assert.equal(role.final_assessment.state, 'published');
  const a = (await call('POST', '/api/career/me/st/roles/junior-data-analyst/start', 1)).body.attempt;
  assert.equal(a.questions.length, 60);
  const owner = (id) => subs.find((s) => BANKS[s].questions.some((q) => q.id === id));
  for (const s of subs) assert.ok(a.questions.filter((q) => owner(q.id) === s).length >= 2, s);
  assert.ok(a.questions.filter((q) => q.scenario).length >= 42);
  const answers = Object.fromEntries(a.questions.map((q) => [q.id, selectChoice(q, key(owner(q.id), q.id), key(owner(q.id), q.id).answer)]));
  const { body: { result } } = await submit(1, a, answers);
  assert.equal(result.overall, 100); assert.equal(result.outcome, 'passed');
  let rd = (await call('GET', '/api/career/curriculum/roles/junior-data-analyst', 1)).body.readiness;
  assert.equal(rd.ready, false, 'subtrack assessments are still required');
  for (const s of subs) { const x = (await start(1, s)).body.attempt; await submit(1, x, answersFor(s, x, () => true)); }
  rd = (await call('GET', '/api/career/curriculum/roles/junior-data-analyst', 1)).body.readiness;
  assert.equal(rd.ready, true); assert.equal(rd.passed, 4);
});
