'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../career/engine');
const { skill } = require('../career/skills');
const { TRACKS, track } = require('../career/tracks');
const BANKS = { common: require('../career/banks/common'), frontend: require('../career/banks/frontend'), backend: require('../career/banks/backend'), aiml: require('../career/banks/aiml') };
const C = E.DEFAULT_CONFIG;

test('question banks are well formed: unique ids, valid keys, known skills, explanations', () => {
  const ids = new Set();
  for (const [bank, qs] of Object.entries(BANKS)) {
    for (const q of qs) {
      assert.ok(!ids.has(q.id), `duplicate ${q.id}`); ids.add(q.id);
      assert.ok(q.explanation && q.prompt, q.id);
      for (const s of q.skills) assert.ok(skill(s), `${q.id} unknown skill ${s}`);
      if (q.type === 'output') assert.ok(q.answer.length, q.id);
      else assert.ok(q.answer.every((a) => q.options.some((o) => o.id === a)), `${q.id} key`);
      assert.equal(q.status, 'draft', `${bank} ships as draft`);
    }
  }
});

test('every track and stage references known skills', () => {
  assert.equal(TRACKS.length, 12);
  for (const t of TRACKS) {
    assert.equal(t.stages.length, 6, t.slug);
    for (const s of t.skills) assert.ok(skill(s.skill), `${t.slug} ${s.skill}`);
    for (const st of t.stages) for (const id of st.skills) assert.ok(skill(id), `${t.slug} stage ${id}`);
  }
});

test('form assembly follows the plan, spreads difficulty, prefers unseen questions and hides the key', () => {
  const pool = BANKS.common;
  const form = E.assembleForm({ pool, plan: C.common_form, seed: 7 });
  assert.deepEqual(form.shortfall, {});
  assert.equal(form.items.length, Object.values(C.common_form).reduce((a, b) => a + b, 0));
  const again = E.assembleForm({ pool, plan: C.common_form, seed: 7 });
  assert.deepEqual(again.items, form.items, 'same seed, same form');
  const seen = new Set(form.items.map((i) => i.id));
  const retake = E.assembleForm({ pool, plan: C.common_form, seen, seed: 8 });
  const overlap = retake.items.filter((i) => seen.has(i.id)).length;
  const minOverlap = Object.entries(C.common_form).reduce((a, [s, n]) => a + Math.max(0, 2 * n - pool.filter((q) => q.skills[0] === s).length), 0);
  // The pool forces `minOverlap` repeats; the one-practical-per-form rule may
  // add one more when the bank has a single practical task (common has one).
  assert.ok(overlap <= minOverlap + 1, `retake reused ${overlap}, pool forces ${minOverlap}`);
  const q = pool.find((x) => x.id === form.items.find((i) => pool.find((p) => p.id === i.id).options.length).id);
  const pub = E.publicQuestion(q, form.items.find((i) => i.id === q.id).order);
  assert.equal(pub.answer, undefined); assert.equal(pub.explanation, undefined);
  assert.equal(pub.options.length, q.options.length);
});

test('grading: single, multiple-answer partial credit, typed output normalisation, unanswered', () => {
  const single = BANKS.common.find((q) => q.id === 'cs-pf-03');
  assert.equal(E.gradeResponse(single, single.answer[0]).correct, true);
  assert.equal(E.gradeResponse(single, 'd').earned, 0);
  assert.equal(E.gradeResponse(single, ['a', 'b']).earned, 0, 'two picks on single-answer is wrong');
  const multi = BANKS.common.find((q) => q.id === 'cs-pf-07');
  assert.equal(E.gradeResponse(multi, ['a', 'b', 'c']).earned, multi.points);
  assert.equal(+E.gradeResponse(multi, ['a', 'b']).earned.toFixed(2), +(multi.points * 2 / 3).toFixed(2));
  assert.equal(E.gradeResponse(multi, ['a', 'd']).earned, 0, 'one right one wrong nets zero');
  const typed = BANKS.aiml.find((q) => q.id === 'ml-py-01');
  assert.equal(E.gradeResponse(typed, '  [0, 1,  4, 9] ').correct, true);
  assert.equal(E.gradeResponse(typed, '[0,1,4,9]').correct, true);
  assert.deepEqual(E.gradeResponse(typed, ''), { answered: false, earned: 0, correct: false });
});

const answerAll = (qs, rightFn) => Object.fromEntries(qs.map((q) => [q.id, rightFn(q) ? (q.type === 'output' ? q.answer[0] : q.type === 'multi' ? q.answer : q.answer[0]) : (q.type === 'output' ? 'wrong' : q.options.find((o) => !q.answer.includes(o.id)).id)]));

test('unanswered questions are excluded; thin evidence is insufficient, not zero', () => {
  const qs = BANKS.frontend.filter((q) => q.skills[0] === 'fe.css').slice(0, 3);
  const r = E.scoreAttempt(qs, { [qs[0].id]: qs[0].answer[0] });
  assert.equal(r.skills['fe.css'].answered, 1);
  assert.equal(r.skills['fe.css'].score, 100);
  assert.equal(r.skills['fe.css'].evidence, 'insufficient');
  assert.equal(E.skillStatus(r.skills['fe.css'], true), E.STATUS.thin);
});

test('common score uses configured weights and renormalises over assessed categories', () => {
  const profile = { 'cs.programming': { score: 100, evidence: 'sufficient' }, 'cs.logic': { score: 0, evidence: 'sufficient' } };
  const out = E.commonScore(profile);
  assert.equal(out.score, Math.round((30 * 100) / 55));
  assert.equal(out.coverage, +(55 / 100).toFixed(2));
  const custom = E.commonScore(profile, { ...C, common_weights: { 'cs.programming': 50, 'cs.logic': 50 } });
  assert.equal(custom.score, 50);
});

test('score bands and skill status thresholds', () => {
  assert.equal(E.band(0), 'Foundation'); assert.equal(E.band(24), 'Foundation'); assert.equal(E.band(25), 'Beginner');
  assert.equal(E.band(69), 'Intermediate'); assert.equal(E.band(70), 'Proficient'); assert.equal(E.band(85), 'Advanced');
  assert.equal(E.skillStatus({ score: 40, evidence: 'sufficient' }, true), E.STATUS.critical);
  assert.equal(E.skillStatus({ score: 40, evidence: 'sufficient' }, false), E.STATUS.improve);
  assert.equal(E.skillStatus(undefined, true), E.STATUS.none);
});

test('readiness caps the level for critical gaps and unproven critical skills, and explains why', () => {
  const t = track('frontend-web-developer');
  const all = (score) => Object.fromEntries(t.skills.map((s) => [s.skill, { score, evidence: 'sufficient' }]));
  assert.equal(E.trackReadiness(t, all(90)).level, 'Advanced');
  const gap = { ...all(95), 'fe.js': { score: 30, evidence: 'sufficient' } };
  const r = E.trackReadiness(t, gap);
  assert.equal(r.level, 'Beginner'); assert.match(r.explanation.join(' '), /critical prerequisite gap in fe\.js/);
  const unproven = { ...all(95) }; delete unproven['fe.css'];
  assert.equal(E.trackReadiness(t, unproven).level, 'Intermediate');
  assert.equal(E.trackReadiness(t, { 'fe.html': { score: 90, evidence: 'sufficient' } }).level, 'Insufficient Evidence');
});

test('gaps put critical prerequisites first and produce concrete recommendations', () => {
  const t = track('frontend-web-developer');
  const profile = { 'fe.js': { score: 30, evidence: 'sufficient', answered: 3 }, 'fe.react': { score: 20, evidence: 'sufficient', answered: 3 } };
  const resolve = (id) => id === 'fe.js' ? [{ title: 'Closures & Encapsulation', course: 'CS-105', tasks: 2, completed: false }] : [];
  const gaps = E.skillGaps(t, profile, resolve);
  assert.equal(gaps[0].skill, 'fe.js');
  assert.equal(gaps[0].status, E.STATUS.critical);
  const text = E.recommendation(gaps[0], 'JavaScript fundamentals');
  assert.match(text, /30%/); assert.match(text, /Closures & Encapsulation/); assert.match(text, /2 practice tasks/); assert.match(text, /reassessment/);
  const react = gaps.find((g) => g.skill === 'fe.react');
  assert.equal(react.content_gap, true);
  assert.match(E.recommendation(react, 'React'), /does not yet have a module/);
});

test('roadmap skips demonstrated stages, never assumes critical skills, and locks the capstone', () => {
  const t = track('frontend-web-developer');
  const strong = (ids) => Object.fromEntries(ids.map((id) => [id, { score: 90, evidence: 'sufficient' }]));
  const none = E.roadmap(t, {}, () => []);
  assert.equal(none.starting_stage, 1);
  const r = E.roadmap(t, strong(['cs.programming', 'fe.html', 'fe.css']), () => []);
  assert.equal(r.starting_stage, 2); assert.equal(r.stages[0].status, 'completed');
  assert.equal(r.stages[4].status, 'locked');
  const devCritical = { ...strong(['cs.programming', 'fe.html']), 'fe.css': { score: 60, evidence: 'sufficient' } };
  assert.equal(E.roadmap(t, devCritical, () => []).starting_stage, 1, 'critical skill at Developing does not pass');
});

test('skill profile keeps the latest sufficient evidence and never loses history', () => {
  const a1 = { id: 'a1', status: 'submitted', submitted_at: '2026-01-01', result: { skills: { 'fe.js': { score: 40, evidence: 'sufficient', answered: 3 } } } };
  const a2 = { id: 'a2', status: 'submitted', submitted_at: '2026-02-01', result: { skills: { 'fe.js': { score: 100, evidence: 'insufficient', answered: 1 } } } };
  const a3 = { id: 'a3', status: 'submitted', submitted_at: '2026-03-01', result: { skills: { 'fe.js': { score: 80, evidence: 'sufficient', answered: 4 } } } };
  assert.equal(E.skillProfile([a1, a2]).fe_js, undefined);
  assert.equal(E.skillProfile([a1, a2])['fe.js'].score, 40, 'thin evidence does not replace sufficient');
  assert.equal(E.skillProfile([a1, a2, a3])['fe.js'].score, 80);
  assert.deepEqual(E.skillHistory([a1, a2, a3], 'fe.js').map((h) => h.score), [40, 100, 80]);
});
