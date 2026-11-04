'use strict';
const selectChoice = require('./helpers/choices.cjs');
/**
 * Multi-career roadmaps over HTTP against the real store: enrollment limits,
 * exactly one Primary, pause/resume/archive with history, the shared skill
 * profile and evidence reuse, separate track readiness, and concurrency.
 */
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const dbPath = path.join(os.tmpdir(), 'echolens-roadmaps-' + crypto.randomUUID() + '.json');
require('dotenv').config = () => ({ parsed: {} });
process.env.DATABASE_URL = ''; process.env.DB_PATH = dbPath;
const store = require('../store');
const express = require('express');
const { register } = require('../career/routes');
const R = require('../career/roadmaps');

let server, base, svc;
const auth = (req, res, next) => { const u = store.Users.byId(Number(req.headers['x-user'])); if (!u) return res.status(401).json({ error: 'Sign in.' }); req.user = { id: u.id, role: u.role }; next(); };
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admin access only.' }));
before(async () => {
  const app = express(); app.use(express.json());
  svc = register(app, { store, authRequired: auth, adminRequired: admin });
  await new Promise((r) => { server = app.listen(0, r); });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); });
beforeEach(() => {
  const d = store.allData();
  d.users = [{ id: 1, role: 'free', profile: {} }, { id: 2, role: 'student', profile: {} }, { id: 3, role: 'admin', profile: {} }, { id: 4, role: 'instructor', profile: {} }];
  d.settings.career_config = undefined; d.settings.career_tracks = undefined;
  d.open_submissions = [];
  svc.updateConfig({ retake_cooldown_hours: 0 }, 3);
});

const call = async (method, url, user, body) => {
  const res = await fetch(base + url, { method, headers: { 'content-type': 'application/json', ...(user ? { 'x-user': String(user) } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
};
const enroll = (u, track, primary) => call('POST', '/api/career/me/enrollments', u, { track, ...(primary ? { primary: true } : {}) });
const act = (u, track, action) => call('POST', `/api/career/me/enrollments/${track}/${action}`, u);
const list = async (u) => (await call('GET', '/api/career/me/enrollments', u)).body;
const primaries = (l) => l.enrollments.filter((e) => e.primary);
const right = (q) => (q.grading === 'review' ? 'A complete worked answer.' : q.type === 'multi' ? q.answer : q.answer[0]);
/** Take an assessment over HTTP, answering everything correctly, and have staff mark every review item in full. */
async function take(u, assessment, mode) {
  const s = await call('POST', '/api/career/me/attempts', u, { assessment, ...(mode ? { mode } : {}) });
  assert.equal(s.status, 200, JSON.stringify(s.body));
  const a = s.body.attempt;
  const sub = await call('POST', `/api/career/me/attempts/${a.id}/submit`, u, { answers: Object.fromEntries(a.questions.map((q) => [q.id, selectChoice(q, svc.questionById(q.id), right(svc.questionById(q.id)))])) });
  assert.equal(sub.status, 200, JSON.stringify(sub.body));
  for (const item of svc.reviewQueue().filter((x) => x.attempt_id === a.id)) {
    const out = svc.submitReview({ id: 4, role: 'instructor' }, u, a.id, item.question_id, { criteria: item.rubric.map((c) => ({ points: c.points })), comment: 'Covers every rubric point correctly.' });
    assert.ok(!out.error, out.error);
  }
  return { delivered: a, done: svc.career(store.Users.byId(u)).attempts.find((x) => x.id === a.id) };
}
const skillsOf = (a) => [...new Set(a.questions.map((q) => svc.questionById(q.id).skills[0]))];

test('1. first enrollment becomes the Primary roadmap and asks for the common CS test', async () => {
  const r = await enroll(1, 'frontend-web-developer');
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.enrollments.length, 1);
  assert.equal(r.body.primary.track, 'frontend-web-developer');
  assert.equal(r.body.primary.status, 'active');
  assert.equal(r.body.recommendation.common_required, true);
  assert.equal(r.body.primary.progress.assessment_status.state, 'common_required');
  assert.equal(r.body.primary.progress.next_activity.href, '#assess/common');
  assert.equal(r.body.primary.progress.completion_pct, 0);
  // Mirrors into the old preference so existing screens keep working.
  assert.equal(svc.career(store.Users.byId(1)).preferences.preferred_track, 'frontend-web-developer');
  // Staff accounts cannot enroll; unknown tracks are rejected.
  assert.equal((await enroll(3, 'frontend-web-developer')).status, 403);
  assert.equal((await enroll(1, 'no-such-track')).status, 404);
});

test('2. second roadmap reuses verified shared skills and assesses only the rest', async () => {
  await enroll(1, 'frontend-web-developer');
  await take(1, 'common');
  const fe = await take(1, 'frontend-web-developer');
  const feReport = (await call('GET', '/api/career/me?track=frontend-web-developer', 1)).body;
  const r = await enroll(1, 'full-stack-web-developer');
  assert.equal(r.status, 200);
  assert.equal(r.body.primary.track, 'frontend-web-developer', 'Primary unchanged');
  assert.equal(r.body.enrollments.find((e) => e.track === 'full-stack-web-developer').primary, false);
  const adv = r.body.recommendation;
  assert.equal(adv.common_required, false, 'recent valid common result is not retaken');
  const reused = adv.reused.map((x) => x.skill), needed = adv.needed.map((x) => x.skill);
  const feSkills = new Set(skillsOf(fe.delivered));
  for (const s of reused) assert.ok(feSkills.has(s) || s.startsWith('cs.'), `${s} reused only because it was assessed`);
  assert.ok(reused.includes('fe.html') && reused.includes('fe.react'), 'shared front-end skills reused');
  for (const s of ['be.http', 'be.sql', 'be.auth']) assert.ok(needed.includes(s), `${s} still needs assessing`);
  // Gap-mode assessment asks ONLY about the skills not yet verified.
  const gap = await take(1, 'full-stack-web-developer');
  const asked = skillsOf(gap.delivered);
  for (const s of asked) assert.ok(needed.includes(s), `gap form only asks about ${s} because it was needed`);
  assert.ok(!asked.includes('fe.html'));
  // Readiness is separate per roadmap and the first roadmap is untouched.
  const fsRep = (await call('GET', '/api/career/me?track=full-stack-web-developer', 1)).body;
  const feAfter = (await call('GET', '/api/career/me?track=frontend-web-developer', 1)).body;
  assert.deepEqual(feAfter.readiness.score, feReport.readiness.score);
  assert.equal(fsRep.track.slug, 'full-stack-web-developer');
  assert.equal(fsRep.enrollment.track, 'full-stack-web-developer');
  // Completed learning activities are not inferred from shared skills.
  assert.equal(fsRep.enrollment.progress.completed_modules.length, 0);
  assert.equal(fsRep.enrollment.progress.completed_projects.length, 0);
  // After all skills verified, the gap form refuses and points to a full retake.
  const again = await call('POST', '/api/career/me/attempts', 1, { assessment: 'full-stack-web-developer' });
  assert.equal(again.status, 409);
  assert.match(again.body.error, /full assessment/i);
  assert.equal((await call('POST', '/api/career/me/attempts', 1, { assessment: 'full-stack-web-developer', mode: 'full' })).status, 200);
});

test('3 and 4. a third roadmap is allowed, a fourth active roadmap is rejected server-side', async () => {
  for (const t of ['frontend-web-developer', 'backend-developer', 'data-engineer']) assert.equal((await enroll(1, t)).status, 200);
  const before = await list(1);
  assert.equal(before.active_count, 3);
  assert.equal(primaries(before).length, 1);
  const fourth = await enroll(1, 'cybersecurity-analyst');
  assert.equal(fourth.status, 409);
  assert.match(fourth.body.error, /at most 3/);
  const afterList = await list(1);
  assert.deepEqual(afterList.enrollments.map((e) => e.track), before.enrollments.map((e) => e.track), 'nothing written on rejection');
  // Duplicate enrollment is rejected too.
  assert.equal((await enroll(1, 'backend-developer')).status, 409);
  // The limit is admin-configurable.
  svc.updateConfig({ max_active_roadmaps: 4 }, 3);
  assert.equal((await enroll(1, 'cybersecurity-analyst')).status, 200);
  svc.updateConfig({ max_active_roadmaps: 2 }, 3);
  // Lowering the limit never locks a student out of tidying up.
  assert.equal((await act(1, 'cybersecurity-analyst', 'primary')).status, 200);
  assert.equal((await act(1, 'data-engineer', 'pause')).status, 200);
  assert.equal((await act(1, 'data-engineer', 'resume')).status, 409, 'cannot add back above the lowered limit');
});

test('5. switching Primary keeps exactly one Primary and keeps all progress', async () => {
  await enroll(1, 'frontend-web-developer'); await enroll(1, 'backend-developer');
  await call('POST', '/api/career/me/projects', 1, { track: 'frontend-web-developer', stage: 5, link: 'https://github.com/example/capstone' });
  const before = (await list(1)).enrollments.find((e) => e.track === 'frontend-web-developer');
  const r = await act(1, 'backend-developer', 'primary');
  assert.equal(r.status, 200);
  assert.equal(primaries(r.body).length, 1);
  assert.equal(r.body.primary.track, 'backend-developer');
  const fe = r.body.enrollments.find((e) => e.track === 'frontend-web-developer');
  assert.equal(fe.status, 'active');
  assert.deepEqual(fe.progress.completed_projects, before.progress.completed_projects);
  assert.ok(fe.progress.completed_projects.includes(5));
  assert.equal(fe.enrolled_at, before.enrolled_at);
  assert.ok(fe.history.some((h) => h.event === 'primary_moved'));
  assert.equal(svc.career(store.Users.byId(1)).preferences.preferred_track, 'backend-developer');
  // A paused roadmap cannot be Primary.
  await act(1, 'frontend-web-developer', 'pause');
  assert.equal((await act(1, 'frontend-web-developer', 'primary')).status, 409);
});

test('6. pause and resume: pausing Primary promotes another, history is kept, slots free up', async () => {
  for (const t of ['frontend-web-developer', 'backend-developer', 'data-engineer']) await enroll(1, t);
  let l = (await act(1, 'frontend-web-developer', 'pause')).body;
  assert.equal(l.enrollments.find((e) => e.track === 'frontend-web-developer').status, 'paused');
  assert.equal(primaries(l).length, 1);
  assert.notEqual(l.primary.track, 'frontend-web-developer');
  assert.equal(l.active_count, 2);
  assert.equal((await enroll(1, 'cybersecurity-analyst')).status, 200, 'a paused roadmap frees a slot');
  assert.equal((await act(1, 'frontend-web-developer', 'resume')).status, 409, 'resume respects the limit');
  await act(1, 'cybersecurity-analyst', 'archive');
  l = (await act(1, 'frontend-web-developer', 'resume')).body;
  const fe = l.enrollments.find((e) => e.track === 'frontend-web-developer');
  assert.equal(fe.status, 'active'); assert.equal(fe.primary, false);
  assert.deepEqual(fe.history.map((h) => h.event).slice(0, 3), ['enrolled', 'made_primary', 'paused']);
  // Archived roadmaps keep their record and history; re-enrolling revives the same record.
  const arch = l.enrollments.find((e) => e.track === 'cybersecurity-analyst');
  assert.equal(arch.status, 'archived');
  await act(1, 'data-engineer', 'archive');
  const back = (await enroll(1, 'cybersecurity-analyst')).body.enrollments.find((e) => e.track === 'cybersecurity-analyst');
  assert.equal(back.id, arch.id);
  assert.ok(back.history.some((h) => h.event === 'archived') && back.history.some((h) => h.event === 'reactivated'));
});

test('7. a shared skill reassessment updates the shared profile and every roadmap that uses it', async () => {
  await enroll(1, 'frontend-web-developer'); await enroll(1, 'full-stack-web-developer');
  await take(1, 'common');
  const beforeRec = (await call('GET', '/api/career/me/skills', 1)).body.skills.find((s) => s.skill_id === 'fe.js');
  assert.equal(beforeRec, undefined, 'fe.js not assessed yet');
  await take(1, 'skill:fe.js');
  const rec = (await call('GET', '/api/career/me/skills', 1)).body.skills.find((s) => s.skill_id === 'fe.js');
  for (const k of ['student_id', 'skill_id', 'skill_version', 'proficiency', 'evidence_type', 'assessment_version', 'last_assessed', 'coverage', 'verification']) assert.ok(k in rec, `record has ${k}`);
  assert.equal(rec.student_id, 1);
  assert.equal(rec.proficiency.score, 100);
  assert.ok(rec.assessment_version.attempt_id && rec.assessment_version.questions.length);
  assert.ok(rec.coverage.answered >= 1);
  const l = await list(1);
  for (const t of ['frontend-web-developer', 'full-stack-web-developer']) {
    const fsRep = (await call('GET', '/api/career/me?track=' + t, 1)).body;
    const js = fsRep.readiness.skills.find((s) => s.skill === 'fe.js');
    assert.equal(js.score, 100, `${t} sees the shared fe.js result`);
    assert.ok(l.enrollments.find((e) => e.track === t).progress.updated_at);
  }
  // A skill shared by name is still never assumed for an unassessed specialization skill.
  const fsReady = (await call('GET', '/api/career/me?track=full-stack-web-developer', 1)).body.readiness.skills;
  assert.equal(fsReady.find((s) => s.skill === 'be.sql').score, null);
});

test('7b. reuse rules: depth, definition version, evidence and recency gate cross-roadmap reuse', () => {
  const nowMs = Date.parse('2026-06-01T00:00:00Z'), band = () => 'Strong';
  const entry = { score: 90, evidence: 'sufficient', answered: 4, at: '2026-05-01T00:00:00Z', max_difficulty: 2, skill_version: 1, by_category: { theory: { answered: 4 } } };
  const rec = (e, o = {}) => R.skillRecord(1, 'cs.git_tools', e, { validDays: 365, nowMs, band, ...o });
  assert.deepEqual(R.reusable(rec(entry), { depth: 2, skillVersion: 1 }), { ok: true, reason: 'verified' });
  assert.equal(R.reusable(rec(entry), { depth: 3, skillVersion: 1 }).reason, 'not_deep_enough', 'a beginner-depth result does not satisfy an advanced roadmap');
  assert.equal(R.reusable(rec(entry), { depth: 2, skillVersion: 2 }).reason, 'definition_changed');
  assert.equal(R.reusable(rec({ ...entry, evidence: 'insufficient' }), { depth: 1 }).reason, 'insufficient_evidence');
  assert.equal(R.reusable(rec({ ...entry, at: '2024-01-01T00:00:00Z' }), { depth: 1 }).reason, 'expired');
  assert.equal(R.reusable(null, { depth: 1 }).reason, 'not_assessed');
});

test('8. changing career track keeps the old roadmap, its attempts and its projects', async () => {
  await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'frontend-web-developer' });
  await take(1, 'common');
  await call('POST', '/api/career/me/projects', 1, { track: 'frontend-web-developer', stage: 5, link: 'https://github.com/example/fe' });
  const attempts = svc.career(store.Users.byId(1)).attempts.length;
  const r = await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'backend-developer' });
  assert.equal(r.status, 200);
  const l = await list(1);
  assert.equal(l.primary.track, 'backend-developer');
  const fe = l.enrollments.find((e) => e.track === 'frontend-web-developer');
  assert.equal(fe.status, 'active'); assert.equal(fe.primary, false);
  assert.ok(fe.progress.completed_projects.includes(5));
  assert.equal(svc.career(store.Users.byId(1)).attempts.length, attempts);
  // Switching back resumes the same record rather than creating a duplicate.
  await call('PUT', '/api/career/me/preferences', 1, { preferred_track: 'frontend-web-developer' });
  const l2 = await list(1);
  assert.equal(l2.enrollments.filter((e) => e.track === 'frontend-web-developer').length, 1);
  assert.equal(l2.primary.track, 'frontend-web-developer');
});

test('9. a student with no active roadmap gets an empty dashboard and a working report', async () => {
  const empty = await list(2);
  assert.deepEqual(empty.enrollments, []); assert.equal(empty.primary, null); assert.equal(empty.active_count, 0);
  assert.equal((await call('GET', '/api/career/me', 2)).status, 200);
  await enroll(2, 'software-qa-test-automation');
  await act(2, 'software-qa-test-automation', 'pause');
  const paused = await list(2);
  assert.equal(paused.primary, null, 'no active roadmap means no Primary');
  assert.equal(paused.enrollments[0].status, 'paused');
  const rep = await call('GET', '/api/career/me', 2);
  assert.equal(rep.status, 200);
  assert.equal(rep.body.roadmaps.primary, null);
  // Resuming the only roadmap makes it Primary again.
  assert.equal((await act(2, 'software-qa-test-automation', 'resume')).body.primary.track, 'software-qa-test-automation');
  // Students from before multi-roadmap support are migrated lazily from their preference.
  store.allData().users.push({ id: 9, role: 'free', profile: { career: { preferences: { preferred_track: 'data-engineer' }, attempts: [], projects: {} } } });
  assert.equal((await list(9)).primary.track, 'data-engineer');
});

test('10. concurrent requests cannot create duplicates, exceed the limit or produce two Primaries', async () => {
  const same = await Promise.all(Array.from({ length: 10 }, () => enroll(1, 'frontend-web-developer', true)));
  assert.equal(same.filter((r) => r.status === 200).length, 1);
  assert.ok(same.filter((r) => r.status !== 200).every((r) => r.status === 409));
  let l = await list(1);
  assert.equal(l.enrollments.filter((e) => e.track === 'frontend-web-developer').length, 1);
  const tracks = ['backend-developer', 'data-engineer', 'cybersecurity-analyst', 'cloud-devops-engineer', 'mobile-app-developer'];
  const many = await Promise.all(tracks.map((t) => enroll(1, t, true)));
  assert.equal(many.filter((r) => r.status === 200).length, 2, 'only two more fit under the limit of 3');
  l = await list(1);
  assert.equal(l.active_count, 3);
  assert.equal(primaries(l).length, 1);
  const actives = l.enrollments.map((e) => e.track);
  const flips = await Promise.all([...actives, ...actives, ...actives].map((t) => act(1, t, 'primary')));
  assert.ok(flips.every((r) => r.status === 200));
  l = await list(1);
  assert.equal(primaries(l).length, 1);
  const mixed = await Promise.all(actives.flatMap((t) => [act(1, t, 'pause'), act(1, t, 'resume'), act(1, t, 'primary')]));
  assert.ok(mixed.every((r) => r.status === 200 || r.status === 409));
  l = await list(1);
  const stored = svc.career(store.Users.byId(1)).enrollments;
  assert.equal(R.invariantError(stored, 3), null, 'stored state satisfies every invariant');
  assert.equal(primaries(l).length, l.active_count ? 1 : 0);
});
