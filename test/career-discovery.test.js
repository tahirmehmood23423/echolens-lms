'use strict';
const selectChoice = require('./helpers/choices.cjs');
/**
 * Release 1 - Career Discovery: welcome state, onboarding answers, the
 * beginner discovery quiz (guest and signed-in), signed results, transparent
 * recommendations, choosing any track, admin-editable matching rules, and
 * the feature flag. Over HTTP against the real store.
 */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const dbPath = path.join(os.tmpdir(), 'echolens-discovery-' + crypto.randomUUID() + '.json');
require('dotenv').config = () => ({ parsed: {} });
process.env.DATABASE_URL = ''; process.env.DB_PATH = dbPath;
const store = require('../store');
const express = require('express');
const { register } = require('../career/routes');
const D = require('../career/discovery');

let server, base, svc;
const userOf = (req) => store.Users.byId(Number(req.headers['x-user'])) || null;
const auth = (req, res, next) => { const u = userOf(req); if (!u) return res.status(401).json({ error: 'Sign in.' }); req.user = { id: u.id, role: u.role }; next(); };
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access only.' }));
before(async () => {
  const app = express(); app.use(express.json());
  svc = register(app, { store, authRequired: auth, adminRequired: admin, optionalUser: userOf, secret: 'test-secret' });
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); });
beforeEach(() => {
  const d = store.allData();
  d.users = [{ id: 1, role: 'free', profile: {} }, { id: 2, role: 'student', profile: {} }, { id: 3, role: 'admin', profile: {} }];
  d.settings.career_discovery_config = undefined; d.settings.career_config = undefined;
  d.open_submissions = [];
});
const call = async (method, url, user, body) => {
  const res = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(user ? { 'x-user': String(user) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const key = (q) => selectChoice(q, svc.questionById(q.id), svc.questionById(q.id).answer[0]);
const wrong = (q) => q.options.find((o) => o.id !== key(q)).id;

test('the discovery quiz is beginner-friendly: 12 MCQs across all 8 areas, published, with no answer keys sent', async () => {
  const info = (await call('GET', '/api/career/discovery')).body;
  assert.equal(info.enabled, true);
  assert.equal(info.questions.length, 5);
  assert.deepEqual(info.questions.map((q) => q.id), ['experience', 'technologies', 'interests', 'goal', 'commitment']);
  assert.equal(info.tracks.length, 12);
  assert.equal(info.quiz.items, 12); assert.equal(info.quiz.available, true);
  const s = await call('POST', '/api/career/discovery/quiz');
  assert.equal(s.status, 200);
  assert.equal(s.body.questions.length, 12);
  const areas = new Set(s.body.questions.map((q) => svc.questionById(q.id).skills[0]));
  assert.equal(areas.size, 8, 'every area is covered');
  for (const q of s.body.questions) { assert.equal(q.options.length, 4); assert.ok(['single', 'scenario'].includes(q.type)); }
  assert.ok(!/"answer"|explanation/.test(JSON.stringify(s.body)), 'no keys or explanations before submitting');
  assert.ok(svc.published('discovery').length >= 32);
});

test('Scenario 1 - complete beginner as a guest: skips, scores without penalty, gets foundation-first suggestions', async () => {
  const s = (await call('POST', '/api/career/discovery/quiz')).body;
  // Answers three questions correctly, one wrongly, skips the rest.
  const answers = {};
  s.questions.slice(0, 3).forEach((q) => { answers[q.id] = key(q); });
  answers[s.questions[3].id] = wrong(s.questions[3]);
  const onboarding = { interests: ['unsure'], experience: 'never', technologies: ['none'] };
  const out = await call('POST', '/api/career/discovery/quiz/submit', null, { token: s.token, answers, onboarding });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  assert.equal(out.body.result.answered, 4); assert.equal(out.body.result.total, 12);
  assert.ok(out.body.result.score >= 60, 'skipped questions are not counted as wrong');
  assert.equal(out.body.recommendations.length, 3);
  for (const r of out.body.recommendations) { assert.ok(r.reasons.length); assert.ok(r.start); }
  // Nothing chosen beyond "Not sure yet": suggestions come from strong quiz areas (small nudges) or beginner-friendly tracks.
  for (const r of out.body.recommendations) assert.ok(r.matched ? r.reasons.some((x) => /quiz answers/.test(x)) : D.DEFAULT_CONFIG.beginner_friendly.includes(r.slug), r.slug);
  const blank = D.recommend({ interests: ['unsure'] }, null, svc.discoveryInfo().tracks);
  assert.deepEqual(blank.recommendations.map((r) => r.slug), D.DEFAULT_CONFIG.beginner_friendly, 'beginner-friendly tracks when the student is not sure');
  assert.ok(out.body.review.every((x) => x.explanation && x.correct_answer), 'explanations after submitting');
  const skipped = Object.values(out.body.result.areas).filter((a) => a.level === 'skipped');
  assert.ok(skipped.length >= 1 && skipped.every((a) => /fine/.test(a.message)));
  assert.ok(!/https?:\/\/|\/open#|"url"/.test(JSON.stringify(out.body.result)), 'no course or lesson links in Career Discovery');
  assert.ok(out.body.result_token, 'a signed result the guest can keep');
  assert.equal(store.allData().users.filter((u) => u.profile?.career).length, 0, 'nothing is stored for a guest');
});

test('signed tokens cannot be forged, reused across accounts or used after they expire', async () => {
  const s = (await call('POST', '/api/career/discovery/quiz')).body;
  const [body, mac] = s.token.split('.');
  const p = JSON.parse(Buffer.from(body, 'base64url').toString()); p.items = p.items.slice(0, 1);
  const forged = Buffer.from(JSON.stringify(p)).toString('base64url') + '.' + mac;
  assert.equal((await call('POST', '/api/career/discovery/quiz/submit', null, { token: forged, answers: {} })).status, 410);
  // A learner's form cannot be submitted by someone else.
  const mine = (await call('POST', '/api/career/discovery/quiz', 1)).body;
  assert.equal((await call('POST', '/api/career/discovery/quiz/submit', 2, { token: mine.token, answers: {} })).status, 403);
  assert.equal((await call('POST', '/api/career/discovery/quiz/submit', null, { token: mine.token, answers: {} })).status, 403);
  // A forged result token is not accepted when claiming.
  assert.equal((await call('POST', '/api/career/me/discovery/claim', 1, { result_token: 'e30.bad' })).status, 400);
});

test('a signed-in learner saves answers, resumes, and the quiz result stays out of the verified skill profile', async () => {
  let st = (await call('GET', '/api/career/discovery', 1)).body.state;
  assert.equal(st.show_welcome, true, 'a learner with no career activity sees the welcome');
  await call('PUT', '/api/career/me/discovery', 1, { answers: { interests: ['ai', 'data'], experience: 'basics', bogus: 'x' }, step: 2 });
  st = (await call('GET', '/api/career/discovery', 1)).body.state;
  assert.equal(st.show_welcome, false, 'shown once - it does not keep reappearing');
  assert.deepEqual(st.discovery.answers, { interests: ['ai', 'data'], experience: 'basics' });
  assert.equal(st.discovery.step, 2);
  const s = (await call('POST', '/api/career/discovery/quiz', 1)).body;
  assert.equal((await call('GET', '/api/career/discovery', 1)).body.state.discovery.active_quiz.token, s.token, 'the quiz can be resumed');
  assert.equal((await call('POST', '/api/career/discovery/quiz/resume', null, { token: s.token })).body.questions.length, 12);
  const answers = Object.fromEntries(s.questions.map((q) => [q.id, key(q)]));
  const out = await call('POST', '/api/career/discovery/quiz/submit', 1, { token: s.token, answers });
  assert.equal(out.body.result.score, 100);
  assert.equal(out.body.recommendations[0].slug, 'ai-machine-learning-engineer');
  // Submitting the same form twice does not create a second result.
  const again = await call('POST', '/api/career/discovery/quiz/submit', 1, { token: s.token, answers: {} });
  assert.equal(again.body.duplicate, true); assert.equal(again.body.result.score, 100);
  const c = store.Users.byId(1).profile.career;
  assert.equal(c.discovery.quiz.score, 100);
  assert.equal((c.attempts || []).length, 0, 'not an assessment attempt');
  assert.deepEqual(svc.skillRecords(store.Users.byId(1)), [], 'no verified skill evidence from a screening quiz');
  // A retake prefers questions the student has not seen.
  const retake = (await call('POST', '/api/career/discovery/quiz', 1)).body;
  const seen = new Set(s.questions.map((q) => q.id));
  assert.ok(retake.questions.filter((q) => !seen.has(q.id)).length >= 10);
});

test('recommendations are transparent, additive and never close a career to a beginner', async () => {
  const tracks = svc.discoveryInfo().tracks;
  const low = { score: 5, areas: Object.fromEntries(['disc.web', 'disc.data', 'disc.logic'].map((a) => [a, { score: 0, name: a }])) };
  const ai = D.recommend({ interests: ['ai'], experience: 'never', technologies: ['none'] }, low, tracks);
  assert.equal(ai.recommendations[0].slug, 'ai-machine-learning-engineer', 'no Python and a low quiz score still recommend AI/ML');
  assert.match(ai.recommendations[0].reasons[0], /artificial intelligence/);
  assert.match(ai.recommendations[0].start, /very beginning.*no experience needed/i);
  const strong = D.recommend({ interests: ['ai'] }, { score: 95, areas: { 'disc.web': { score: 100, name: 'Internet and web basics' } } }, tracks);
  const lowAll = new Map(ai.all.map((x) => [x.slug, x.score])), strongAll = new Map(strong.all.map((x) => [x.slug, x.score]));
  for (const [slug, sc] of lowAll) assert.ok(strongAll.get(slug) >= sc, `${slug}: quiz results only add points`);
  const fe = D.recommend({ interests: ['websites'], enjoy: ['design'], technologies: ['html_css'] }, null, tracks);
  assert.equal(fe.recommendations[0].slug, 'frontend-web-developer');
  assert.ok(fe.recommendations[0].reasons.some((r) => /HTML\/CSS/.test(r)));
});

test('Scenario 5 - recommendation override: recommended Frontend, chooses Cybersecurity, and gets that roadmap', async () => {
  await call('PUT', '/api/career/me/discovery', 1, { answers: { interests: ['websites'], enjoy: ['design'] } });
  const recs = (await call('POST', '/api/career/discovery/recommendations', 1, {})).body;
  assert.equal(recs.recommendations[0].slug, 'frontend-web-developer');
  assert.ok(!recs.recommendations.some((r) => r.slug === 'cybersecurity-analyst'));
  const e = await call('POST', '/api/career/me/enrollments', 1, { track: 'cybersecurity-analyst' });
  assert.equal(e.status, 200);
  assert.equal(e.body.primary.track, 'cybersecurity-analyst');
  const saved = await call('PUT', '/api/career/me/discovery', 1, { chosen_track: 'cybersecurity-analyst', completed: true });
  assert.equal(saved.body.discovery.chosen_recommended, false, 'the override is recorded for analytics, not blocked');
  const rm = (await call('GET', '/api/career/me?track=cybersecurity-analyst', 1)).body;
  assert.equal(rm.track.slug, 'cybersecurity-analyst');
  assert.equal(rm.roadmap.stages.length, 6);
  assert.equal(svc.discoveryAnalytics().chose_unrecommended, 1);
});

test('a guest result is claimed after sign-in and never overwrites a newer saved result', async () => {
  const s = (await call('POST', '/api/career/discovery/quiz')).body;
  const out = (await call('POST', '/api/career/discovery/quiz/submit', null, { token: s.token, answers: { [s.questions[0].id]: key(s.questions[0]) } })).body;
  const c = await call('POST', '/api/career/me/discovery/claim', 2, { answers: { interests: ['security'] }, result_token: out.result_token, step: 5 });
  assert.equal(c.status, 200);
  assert.equal(c.body.discovery.quiz.score, 100);
  assert.deepEqual(c.body.discovery.answers, { interests: ['security'] });
  const recs = (await call('POST', '/api/career/discovery/recommendations', 2, {})).body;
  assert.equal(recs.recommendations[0].slug, 'cybersecurity-analyst');
  // Taking a newer quiz while signed in, then claiming the old guest result, keeps the newer one.
  const mine = (await call('POST', '/api/career/discovery/quiz', 2)).body;
  await call('POST', '/api/career/discovery/quiz/submit', 2, { token: mine.token, answers: Object.fromEntries(mine.questions.map((q) => [q.id, wrong(q)])) });
  await call('POST', '/api/career/me/discovery/claim', 2, { result_token: out.result_token });
  assert.equal(store.Users.byId(2).profile.career.discovery.quiz.score, 0, 'the newer saved result is kept');
});

test('Scenario 8 - an existing student keeps everything and is not pushed into the welcome', async () => {
  const u = store.Users.byId(2);
  u.profile = { career: { preferences: { preferred_track: 'backend-developer' }, attempts: [], projects: {} }, gems: 120 };
  const st = (await call('GET', '/api/career/discovery', 2)).body.state;
  assert.equal(st.show_welcome, false);
  const r = await call('PUT', '/api/career/me/discovery', 2, { answers: { goal: 'improve' } });
  assert.equal(r.status, 200, 'they can still start Career Discovery manually');
  const after = store.Users.byId(2).profile;
  assert.equal(after.gems, 120); assert.equal(after.career.preferences.preferred_track, 'backend-developer');
  // Staff accounts are not learners.
  assert.equal((await call('PUT', '/api/career/me/discovery', 3, { answers: {} })).status, 403);
});

test('admins edit the matching rules with validation and versioning; the feature flag turns discovery off', async () => {
  assert.equal((await call('GET', '/api/admin/career/discovery', 1)).status, 403);
  const g = (await call('GET', '/api/admin/career/discovery', 3)).body;
  assert.equal(g.config.version, 1); assert.ok(g.analytics);
  assert.equal((await call('PUT', '/api/admin/career/discovery', 3, { interests: { websites: ['no-such-track'] } })).status, 400);
  assert.equal((await call('PUT', '/api/admin/career/discovery', 3, { weights: { interests: 99 } })).status, 400);
  const ok = await call('PUT', '/api/admin/career/discovery', 3, { interests: { ...D.DEFAULT_CONFIG.interests, websites: ['cybersecurity-analyst'] } });
  assert.equal(ok.status, 200); assert.equal(ok.body.config.version, 2);
  const recs = (await call('POST', '/api/career/discovery/recommendations', null, { answers: { interests: ['websites'] } })).body;
  assert.equal(recs.recommendations[0].slug, 'cybersecurity-analyst', 'the edited rule is used');
  assert.equal(recs.basis.config_version, 2);
  await call('PUT', '/api/admin/career/discovery', 3, { enabled: false });
  assert.equal((await call('GET', '/api/career/discovery')).body.enabled, false);
  assert.equal((await call('POST', '/api/career/discovery/quiz')).status, 404);
  assert.equal((await call('GET', '/api/career/discovery', 1)).body.state.show_welcome, false);
  const reset = await call('POST', '/api/admin/career/discovery/reset', 3);
  assert.equal(reset.body.config.enabled, true);
  assert.equal((await call('POST', '/api/career/discovery/quiz')).status, 200);
});

test('student-facing text uses plain punctuation: no dash asides in questions, discovery screens or the home page', () => {
  const fs2 = require('node:fs');
  const { BANKS } = require('../career/banks');
  const aside = /[A-Za-z)\]"'.%] - [A-Za-z("']|—|–/;
  const maths = new Set(['m-ml-math_stats-p1', 'da-bz-p1', 'm-da-business-p1', 'm-se-arrays_strings-t3']); // real minus signs
  const bad = [];
  for (const b of Object.values(BANKS)) for (const q of b.questions) {
    if (q.status !== 'published' || maths.has(q.id)) continue;
    for (const t of [q.prompt, q.explanation, ...q.options.map((o) => o.text)]) if (aside.test(t || '')) bad.push(q.id);
  }
  assert.deepEqual(bad, []);
  for (const f of ['public/landing.html', 'public/js/career-discovery.js']) assert.ok(!/&mdash;|&ndash;|—|–/.test(fs2.readFileSync(path.join(__dirname, '..', f), 'utf8')), `${f} has no dashes`);
  for (const q of D.QUESTIONS) assert.ok(!aside.test(q.title + q.hint + q.options.map(([, t]) => t.replace(/(?<=\d)–(?=\d)/g, ' to ')).join(' ')), q.id);
});
