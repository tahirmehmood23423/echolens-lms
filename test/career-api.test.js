'use strict';
const selectChoice = require('./helpers/choices.cjs');
/**
 * Career assessment API, end to end over HTTP against the real store:
 * onboarding, assessment delivery and submission security, scoring,
 * admin permissions and versioning, and the five student scenarios.
 */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const dbPath = path.join(os.tmpdir(), 'echolens-career-' + crypto.randomUUID() + '.json');
require('dotenv').config = () => ({ parsed: {} });
process.env.DATABASE_URL = ''; process.env.DB_PATH = dbPath;
const store = require('../store');
const express = require('express');
const { register } = require('../career/routes');

let server, base, svc;
let AI_CALLS = 0;
const MAIL = [];
const fakeNotify = async (to, subject, text) => { MAIL.push({ to, subject, text }); };
const fakeAi = async (uid, { rubric }) => { AI_CALLS++; return { criteria: rubric.map((r, i) => ({ index: i + 1, points: r.points, why: 'looks complete' })), feedback: 'AI thinks this is great.', model: 'stub' }; };
const auth = (req, res, next) => { const id = Number(req.headers['x-user']); const u = store.Users.byId(id); if (!u) return res.status(401).json({ error: 'Sign in.' }); req.user = { id: u.id, role: u.role }; next(); };
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access only.' }));

before(async () => {
  const app = express(); app.use(express.json());
  svc = register(app, { store, authRequired: auth, adminRequired: admin, aiSuggest: fakeAi, notify: fakeNotify, appUrl: 'https://echolens.test' });
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); });
beforeEach(() => {
  const d = store.allData();
  d.users = [{ id: 1, role: 'free', profile: {} }, { id: 2, role: 'student', profile: {} }, { id: 3, role: 'admin', profile: {} }, { id: 4, role: 'instructor', profile: {} }];
  d.settings.career_questions = undefined; d.settings.career_config = undefined; d.settings.career_tracks = undefined;
  d.open_submissions = [];
});

const call = async (method, url, user, body) => {
  const res = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(user ? { 'x-user': String(user) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const publishAll = () => { for (const b of Object.keys(svc.BANKS)) svc.setQuestionStatus(svc.questions(b).map((q) => q.id), 'published', 3); };
const key = (q) => (q.grading === 'review' ? 'A thorough written answer covering every rubric point.' : q.type === 'output' ? q.answer[0] : q.type === 'multi' ? q.answer : q.answer[0]);
const wrong = (q) => (q.grading === 'review' ? 'not sure' : q.type === 'output' ? 'definitely wrong' : q.options.find((o) => !q.answer.includes(o.id)).id);
/** Answer each delivered question right or wrong according to rightFor(question). */
function answers(attempt, rightFor) {
  return Object.fromEntries(attempt.questions.map((q) => { const full = svc.questionById(q.id); return [q.id, selectChoice(q, full, rightFor(full) ? key(full) : wrong(full))]; }));
}
async function take(user, assessment, rightFor) {
  const s = await call('POST', '/api/career/me/attempts', user, { assessment });
  assert.equal(s.status, 200, JSON.stringify(s.body));
  const sub = await call('POST', `/api/career/me/attempts/${s.body.attempt.id}/submit`, user, { answers: answers(s.body.attempt, rightFor) });
  assert.equal(sub.status, 200, JSON.stringify(sub.body));
  return sub.body.attempt;
}
const skipCooldown = () => svc.updateConfig({ retake_cooldown_hours: 0 }, 3);

test('the 12 career tracks are public, data-driven and list real EchoLens courses only', async () => {
  const r = await call('GET', '/api/career/tracks');
  assert.equal(r.status, 200); assert.equal(r.body.tracks.length, 12);
  const fe = r.body.tracks.find((t) => t.slug === 'frontend-web-developer');
  assert.ok(fe.courses.length > 0);
  for (const c of fe.courses) assert.match(c.url, /^\/open#course\//);
  assert.equal((await call('GET', '/api/career/tracks/not-a-track')).status, 404);
});

test('reviewed questions ship published; retired or draft questions are never served', async () => {
  const common = svc.questions('common');
  assert.ok(common.every((q) => q.status === (q.grading === 'review' ? 'retired' : 'published') && q.reviewed_at), 'built-in items carry the content-review record');
  assert.equal((await call('POST', '/api/career/me/attempts', 1, { assessment: 'common' })).status, 200);
  await call('POST', `/api/career/me/attempts/${store.Users.byId(1).profile.career.active.id}/abandon`, 1);
  // Retiring the questions for one skill closes the assessment until it is covered again.
  svc.setQuestionStatus(common.filter((q) => q.skills[0] === 'cs.logic').map((q) => q.id), 'retired', 3);
  const s = await call('POST', '/api/career/me/attempts', 2, { assessment: 'common' });
  assert.equal(s.status, 409); assert.match(s.body.error, /reviewed/);
  // An admin edit is a new, unreviewed version: back to draft and not served until re-published.
  const q = common.find((x) => x.skills[0] === 'cs.computing' && x.grading !== 'review');
  svc.editQuestion(q.id, { explanation: 'Reworded explanation.' }, 3);
  assert.equal(svc.questionById(q.id).status, 'draft');
});

test('onboarding is optional, keeps only known values, and can be changed later', async () => {
  assert.equal((await call('GET', '/api/career/me', 1)).body.preferences, null, 'no forced onboarding');
  const p = await call('PUT', '/api/career/me/preferences', 1, { experience: 'None', languages: ['Python', 'Klingon'], interests: ['frontend-web-developer', 'nope'], goals: 'Get a job', cnic: '12345' });
  assert.equal(p.status, 200);
  assert.deepEqual(p.body.preferences.languages, ['Python']);
  assert.deepEqual(p.body.preferences.interests, ['frontend-web-developer']);
  assert.equal(p.body.preferences.preferred_track, 'frontend-web-developer');
  assert.equal(p.body.preferences.cnic, undefined);
  const q = await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'backend-developer' });
  assert.equal(q.body.preferences.preferred_track, 'backend-developer');
  assert.equal((await call('PUT', '/api/career/me/preferences', 4, {})).status, 403);
});

test('delivery hides answer keys; scoring is server-side, idempotent and ownership-checked', async () => {
  publishAll();
  const s = await call('POST', '/api/career/me/attempts', 1, { assessment: 'common' });
  const raw = JSON.stringify(s.body);
  for (const q of s.body.attempt.questions) { assert.equal(q.answer, undefined); assert.equal(q.explanation, undefined); }
  assert.ok(!/"answer"|"explanation"/.test(raw));
  const id = s.body.attempt.id;
  assert.equal((await call('POST', `/api/career/me/attempts/${id}/submit`, 2, { answers: {} })).status, 404, 'another learner cannot submit it');
  const forged = await call('POST', `/api/career/me/attempts/${id}/submit`, 1, { answers: { ...answers(s.body.attempt, () => false), score: 100, 'not-a-question': 'x' } });
  assert.equal(forged.body.attempt.result.raw_score, 0, 'client-sent scores are ignored');
  const again = await call('POST', `/api/career/me/attempts/${id}/submit`, 1, { answers: answers(s.body.attempt, () => true) });
  assert.equal(again.body.existing, true); assert.equal(again.body.attempt.result.raw_score, 0, 'resubmission returns the stored result');
});

test('autosave and resume; answers after the time limit do not count', async () => {
  publishAll();
  const s = await call('POST', '/api/career/me/attempts', 1, { assessment: 'common' });
  const a = s.body.attempt, first = a.questions[0], full = svc.questionById(first.id);
  assert.equal((await call('PUT', `/api/career/me/attempts/${a.id}/answers`, 1, { answers: { [first.id]: selectChoice(first, full, key(full)) } })).status, 200);
  const resumed = await call('GET', '/api/career/me/attempts/active', 1);
  assert.equal(resumed.body.resumed, true); assert.deepEqual(resumed.body.attempt.answers[first.id], selectChoice(first, full, key(full)));
  assert.equal((await call('POST', '/api/career/me/attempts', 1, { assessment: 'frontend-web-developer' })).status, 409, 'one assessment at a time');
  // Time runs out: the deadline passes, then the learner submits everything correct.
  const u = store.Users.byId(1); u.profile.career.active.expires_at = new Date(Date.now() - 10 * 60e3).toISOString();
  const late = await call('POST', `/api/career/me/attempts/${a.id}/submit`, 1, { answers: answers(a, () => true) });
  assert.equal(late.body.attempt.late, true);
  assert.equal(late.body.attempt.result.answered, 1, 'only the answer saved in time counts');
});

test('retakes respect the cooldown and draw an alternate form', async () => {
  publishAll();
  const first = await take(1, 'common', () => true);
  const blocked = await call('POST', '/api/career/me/attempts', 1, { assessment: 'common' });
  assert.equal(blocked.status, 429); assert.ok(blocked.body.retry_at);
  skipCooldown();
  const second = await call('POST', '/api/career/me/attempts', 1, { assessment: 'common' });
  const before = new Set(first.result.responses.map((r) => r.id));
  const repeats = second.body.attempt.questions.filter((q) => before.has(q.id)).length;
  assert.ok(repeats <= 2, `only pool-forced repeats, got ${repeats}`);
});

test('admin: permissions, versioned edits, configurable weights and bands, audit-safe history', async () => {
  for (const u of [1, 2, 4]) assert.equal((await call('GET', '/api/admin/career/overview', u)).status, 403);
  const ov = await call('GET', '/api/admin/career/overview', 3);
  assert.equal(ov.status, 200); assert.equal(ov.body.banks.find((b) => b.bank === 'common').published, svc.questions('common').filter((q) => q.grading !== 'review').length);
  publishAll(); skipCooldown();
  const done = await take(1, 'common', () => true);
  // A multiple-choice question: editing only its explanation must keep its options and key.
  const mcq = svc.questions('common').find((q) => q.type === 'single' && q.grading !== 'review');
  const mcqEdit = await call('PUT', `/api/admin/career/questions/${mcq.id}`, 3, { explanation: 'Reworded.' });
  assert.equal(mcqEdit.status, 200, JSON.stringify(mcqEdit.body));
  assert.deepEqual(mcqEdit.body.question.options.map((o) => o.text), mcq.options.map((o) => o.text));
  assert.deepEqual(mcqEdit.body.question.answer, mcq.answer);
  const id = done.result.responses.find((r) => r.id !== mcq.id && r.grading !== 'review').id;
  const edit = await call('PUT', `/api/admin/career/questions/${id}`, 3, { explanation: 'Clarified explanation.' });
  assert.equal(edit.status, 200); assert.equal(edit.body.question.version, 2); assert.equal(edit.body.question.status, 'draft', 'an edit goes back to review');
  const review = await call('GET', `/api/career/me/attempts/${done.id}/review`, 1);
  assert.notEqual(review.body.review.find((r) => r.id === id).explanation, 'Clarified explanation.', 'past attempts show the version they were scored on');
  assert.equal((await call('PUT', '/api/admin/career/config', 3, { common_weights: { 'cs.programming': -5 } })).status, 400);
  const cfg = await call('PUT', '/api/admin/career/config', 3, { bands: [{ min: 0, level: 'Foundation' }, { min: 40, level: 'Beginner' }, { min: 60, level: 'Intermediate' }, { min: 75, level: 'Proficient' }, { min: 90, level: 'Advanced' }] });
  assert.equal(cfg.status, 200); assert.equal(cfg.body.config.bands[1].min, 40);
  assert.equal(store.allData().users.find((u) => u.id === 1).profile.career.attempts[0].config_version, 2, 'stored result keeps the config version it was scored under');
  const bad = await call('POST', '/api/admin/career/questions', 3, { bank: 'common', type: 'single', skills: ['cs.logic'], prompt: 'Which is right?', options: ['A', 'A'], answer: ['a'], explanation: 'x' });
  assert.equal(bad.status, 400, 'duplicate options rejected');
  const add = await call('POST', '/api/admin/career/questions', 3, { bank: 'common', type: 'single', skills: ['cs.logic'], prompt: 'Which number is even?', options: ['3', '4'], answer: ['b'], explanation: '4 is divisible by 2.', difficulty: 1 });
  assert.equal(add.status, 200); assert.equal(add.body.question.status, 'draft');
});

test('Scenario A - complete beginner gets a foundation-level roadmap', async () => {
  publishAll();
  await call('PUT', '/api/career/me/preferences', 1, { experience: 'None', preferred_track: 'frontend-web-developer' });
  await take(1, 'common', () => false);
  const r = (await call('GET', '/api/career/me', 1)).body;
  assert.equal(r.common.score, 0);
  assert.equal(r.roadmap.starting_stage, 1);
  assert.equal(r.roadmap.stages[0].status, 'current');
  assert.ok(['Insufficient Evidence', 'Foundation'].includes(r.readiness.level));
  assert.ok(r.gaps.some((g) => g.skill === 'cs.programming' && g.status === 'Critical Prerequisite Gap'));
  const g = r.gaps.find((x) => x.skill === 'cs.programming');
  assert.match(g.recommendation, /0%/); assert.ok(g.resources.length > 0 && g.resources.every((m) => m.url.startsWith('/open#course/')));
});

test('Scenario B - strong Python, weak statistics: the gap is found without repeating Python', async () => {
  publishAll();
  await call('PUT', '/api/career/me/preferences', 2, { preferred_track: 'ai-machine-learning-engineer' });
  await take(2, 'ai-machine-learning-engineer', (q) => q.skills[0] !== 'ml.math_stats');
  const r = (await call('GET', '/api/career/me', 2)).body;
  const py = r.readiness.skills.find((s) => s.skill === 'ml.python'), st = r.readiness.skills.find((s) => s.skill === 'ml.math_stats');
  assert.equal(py.status, 'Strong'); assert.equal(st.status, 'Critical Prerequisite Gap');
  assert.equal(r.gaps[0].skill, 'ml.math_stats', 'statistics is the top priority');
  assert.ok(!r.gaps.some((g) => g.skill === 'ml.python'), 'Python is not recommended again');
  assert.equal(r.readiness.level, 'Beginner'); assert.match(r.readiness.explanation.join(' '), /Mathematics and statistics/);
  assert.match(r.gaps[0].recommendation, /does not yet have a module/, 'missing content is stated, not faked');
  const stage1 = r.roadmap.stages[0];
  assert.equal(stage1.skills.find((s) => s.skill === 'ml.python').satisfied, true);
  assert.equal(stage1.complete, false);
});

test('Scenario C - advanced frontend student gets advanced work and any remaining prerequisites', async () => {
  publishAll();
  await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'frontend-web-developer' });
  await take(1, 'common', () => true);
  await take(1, 'frontend-web-developer', () => true);
  const r = (await call('GET', '/api/career/me', 1)).body;
  assert.equal(r.readiness.level, 'Advanced');
  assert.ok(r.roadmap.starting_stage >= 5, `starts at the capstone or later, got ${r.roadmap.starting_stage}`);
  assert.equal(r.gaps.length, 0);
  assert.ok(r.strongest.length > 0);
});

test('Scenario D - switching Frontend to Full-Stack keeps frontend skills and assesses backend separately', async () => {
  publishAll();
  await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'frontend-web-developer' });
  await take(1, 'frontend-web-developer', () => true);
  await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'full-stack-web-developer' });
  const r = (await call('GET', '/api/career/me', 1)).body;
  assert.equal(r.track.slug, 'full-stack-web-developer');
  for (const id of ['fe.html', 'fe.css', 'fe.js']) assert.equal(r.readiness.skills.find((s) => s.skill === id).status, 'Strong', id);
  for (const id of ['be.http', 'be.sql']) assert.equal(r.readiness.skills.find((s) => s.skill === id).status, 'Not Yet Assessed', id);
  // Frontend evidence alone covers about half the track's weight - not enough
  // for a level, and the report says so instead of guessing.
  assert.equal(r.readiness.level, 'Insufficient Evidence');
  assert.match(r.readiness.explanation.join(' '), /enough evidence/);
  assert.ok(r.gaps.some((g) => g.skill === 'be.sql' && g.status === 'Not Yet Assessed'));
  const prefs = store.Users.byId(1).profile.career.preferences;
  assert.deepEqual(prefs.track_history.map((h) => h.track), ['frontend-web-developer', 'full-stack-web-developer']);
  assert.equal(r.assessments.track.available, true, 'full-stack draws on the frontend and backend banks');
});

test('Scenario E - reassessment updates the report and roadmap without deleting history', async () => {
  publishAll(); skipCooldown();
  await call('PUT', '/api/career/me/preferences', 2, { preferred_track: 'backend-developer' });
  await take(2, 'backend-developer', (q) => q.skills[0] !== 'be.sql');
  let r = (await call('GET', '/api/career/me', 2)).body;
  assert.equal(r.readiness.skills.find((s) => s.skill === 'be.sql').status, 'Critical Prerequisite Gap');
  assert.equal(r.gaps.find((g) => g.skill === 'be.sql').reassess_available, true);
  const re = await take(2, 'skill:be.sql', () => true);
  assert.equal(re.result.skills['be.sql'].evidence, 'sufficient');
  r = (await call('GET', '/api/career/me', 2)).body;
  assert.equal(r.readiness.skills.find((s) => s.skill === 'be.sql').status, 'Strong');
  // Practical SQL is not re-proven by repeat questions: it stays flagged until a
  // reviewer scores the practical submission included in the reassessment.
  const left = r.gaps.find((g) => g.skill === 'be.sql');
  assert.ok(!left || (left.partial && left.status !== 'Critical Prerequisite Gap'));
  const sub = re.result.responses.find((x) => x.grading === 'review');
  if (sub) {
    const item = (await call('GET', '/api/career/reviews', 3)).body.reviews.find((x) => x.attempt_id === re.id);
    await call('POST', `/api/career/reviews/2/${re.id}/${item.question_id}`, 3, { criteria: item.rubric.map((c) => ({ points: c.points })), comment: 'Correct join, grouping and ordering.' });
    r = (await call('GET', '/api/career/me', 2)).body;
    const g = r.gaps.find((x) => x.skill === 'be.sql');
    assert.ok(!g || !g.weak_in.includes('practical'), 'reviewed practical work clears the practical weakness');
    // Any category whose only items were already seen keeps its earlier result until new items exist.
  }
  const h = (await call('GET', '/api/career/me/history', 2)).body;
  assert.equal(h.attempts.length, 2, 'both attempts kept');
  assert.deepEqual(h.skills.find((s) => s.skill === 'be.sql').history.map((x) => x.score), [0, 100], 'before and after');
});

test('roadmap modules reflect real course progress and project links are validated', async () => {
  publishAll();
  await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'frontend-web-developer' });
  const mod = svc.resources('fe.html', 1)[0];
  const def = store.Quests.trackDef(mod.track_key), lvl = def.levels.find((l) => l.no === mod.level);
  store.allData().open_submissions = lvl.problems.map((p, i) => ({ id: i + 1, user_id: 1, track_key: mod.track_key, level: mod.level, pid: p.pid, score: 100 }));
  assert.equal(svc.resources('fe.html', 1)[0].completed, true);
  assert.equal((await call('POST', '/api/career/me/projects', 1, { track: 'frontend-web-developer', stage: 5, link: 'javascript:alert(1)' })).status, 400);
  const ok = await call('POST', '/api/career/me/projects', 1, { track: 'frontend-web-developer', stage: 5, link: 'https://github.com/someone/capstone' });
  assert.equal(ok.body.projects[5].self_reported, true);
});

test('content gaps are reported to admins, never shown as links', async () => {
  const a = await call('GET', '/api/admin/career/analytics', 3);
  assert.equal(a.status, 200);
  const stats = a.body.content_gaps.find((g) => g.skill === 'ml.math_stats');
  assert.ok(stats); assert.match(stats.reason, /No EchoLens module/);
  assert.deepEqual(svc.resources('ml.math_stats', 1), []);
});

test('all 12 career-track assessments open once their questions are published, each with all three categories', async () => {
  publishAll();
  const r = await call('GET', '/api/career/tracks');
  for (const t of r.body.tracks) {
    assert.equal(t.assessment.available, true, `${t.slug}: ${t.assessment.reason}`);
    for (const c of ['theory', 'practical', 'scenario']) assert.ok(t.assessment.coverage.categories[c] > 0, `${t.slug} ${c}`);
    assert.equal(t.assessment.reviewed_items, 0, `${t.slug}: MCQ only, no staff-reviewed items`);
    assert.ok(t.assessment.items >= 25, `${t.slug}: at least 25 MCQs (${t.assessment.items})`);
  }
});

test('MCQ-only delivery: every assessment has 25+ multiple-choice questions, all categories, basic to advanced', async () => {
  publishAll(); skipCooldown();
  const tracks = (await call('GET', '/api/career/tracks')).body.tracks.map((t) => t.slug);
  for (const key of ['common', ...tracks]) {
    const s = await call('POST', '/api/career/me/attempts', 2, { assessment: key, mode: 'full' });
    assert.equal(s.status, 200, `${key}: ${JSON.stringify(s.body)}`);
    const qs = s.body.attempt.questions;
    assert.ok(qs.length >= 25, `${key}: ${qs.length} questions`);
    for (const q of qs) {
      assert.ok(['single', 'multi', 'debug', 'scenario'].includes(q.type), `${key}: ${q.id} is ${q.type}`);
      assert.ok(q.options.length >= 2 && q.grading !== 'review', `${key}: ${q.id} has options`);
    }
    for (const c of ['theory', 'practical', 'scenario']) {
      const ds = new Set(qs.filter((q) => q.category === c).map((q) => svc.questionById(q.id).difficulty));
      assert.ok(ds.size >= 2, `${key} ${c}: difficulties ${[...ds]}`);
    }
    assert.ok(new Set(qs.map((q) => svc.questionById(q.id).difficulty)).size === 3, `${key}: basic, intermediate and advanced items`);
    assert.ok(!/model_answer|"answer"/.test(JSON.stringify(s.body)), 'no answer keys delivered');
    await call('POST', `/api/career/me/attempts/${s.body.attempt.id}/abandon`, 2);
  }
});

test('category feedback tells the student whether the weakness is theory, coding or application', async () => {
  publishAll();
  await call('PUT', '/api/career/me/preferences', 2, { preferred_track: 'backend-developer' });
  await take(2, 'backend-developer', (q) => q.category !== 'practical');
  const r = (await call('GET', '/api/career/me', 2)).body;
  const fb = r.readiness.category_feedback;
  assert.equal(fb.rows.find((x) => x.category === 'practical').level, 'weak');
  assert.equal(fb.rows.find((x) => x.category === 'theory').level, 'strong');
  assert.match(fb.summary, /practical implementation/);
  assert.ok(r.gaps.some((g) => g.weak_in.includes('practical')));
  assert.match(r.gaps.find((g) => g.weak_in.includes('practical')).recommendation, /practical implementation/);
  assert.equal(r.readiness.weakest_category.category, 'practical');
});

test('admins can set theory / practical / scenario weights per track', async () => {
  const bad = await call('PUT', '/api/admin/career/config', 3, { category_weights: { 'backend-developer': { theory: 50, practical: -1, scenario: 10 } } });
  assert.equal(bad.status, 400);
  const ok = await call('PUT', '/api/admin/career/config', 3, { category_weights: { 'backend-developer': { theory: 20, practical: 60, scenario: 20 } } });
  assert.equal(ok.status, 200);
  assert.deepEqual(svc.categoryWeights('backend-developer'), { theory: 20, practical: 60, scenario: 20 });
  assert.equal(svc.categoryWeights('frontend-web-developer').practical, 45, 'other tracks keep their defaults');
});

test('common CS retakes get unseen practical and scenario items for every skill', async () => {
  publishAll(); skipCooldown();
  const first = await take(1, 'common', () => true);
  const seen = new Set(first.result.responses.map((r) => r.id));
  const second = (await call('POST', '/api/career/me/attempts', 1, { assessment: 'common' })).body.attempt;
  for (const sk of ['cs.programming', 'cs.logic', 'cs.computing', 'cs.dsa_basics', 'cs.git_tools', 'cs.debugging']) for (const c of ['practical', 'scenario']) {
    const fresh = second.questions.find((q) => svc.questionById(q.id).skills[0] === sk && q.category === c && !seen.has(q.id));
    assert.ok(fresh, `${sk} ${c}: an unseen item on retake`);
  }
  const cov = svc.availability('common').coverage;
  assert.deepEqual(cov.thin, [], 'admin coverage shows no thin categories for the common assessment');
  for (const t of svc.tracks()) assert.deepEqual(svc.availability(t.slug).coverage.thin, [], `${t.slug} has an alternate practical and scenario item for every skill`);
});
