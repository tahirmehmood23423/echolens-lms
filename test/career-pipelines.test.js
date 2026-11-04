'use strict';
/**
 * Every assessment pipeline, end to end, for all 12 career tracks plus the
 * common CS assessment: delivery, scoring, staff review, classification,
 * gap analysis, reassessment and roadmap - for a strong and a weak student.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const dbPath = path.join(os.tmpdir(), 'echolens-pipelines-' + crypto.randomUUID() + '.json');
require('dotenv').config = () => ({ parsed: {} });
process.env.DATABASE_URL = ''; process.env.DB_PATH = dbPath;
const store = require('../store');
const { createCareerService } = require('../career/service');
const { TRACKS } = require('../career/tracks');
const E = require('../career/engine');

let svc, uid = 100;
const learner = () => { const u = { id: ++uid, role: 'free', name: 'Learner ' + uid, email: `l${uid}@example.com`, profile: {} }; store.allData().users.push(u); return u; };
const reviewer = { id: 1, role: 'instructor' };
before(() => {
  store.allData().users = [{ id: 1, role: 'instructor', profile: {} }];
  store.allData().settings.career_questions = undefined; store.allData().settings.career_config = undefined;
  svc = createCareerService(store);
  svc.updateConfig({ retake_cooldown_hours: 0 }, 1);
});
after(() => { if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath); });

const answerFor = (q, right) => (q.grading === 'review' ? 'My worked answer.' : right ? (q.type === 'multi' ? q.answer : q.answer[0]) : (q.type === 'output' ? 'wrong' : q.options.find((o) => !q.answer.includes(o.id)).id));
function take(u, key, right) {
  const s = svc.startAttempt(u, key); assert.ok(s.attempt, `${key}: ${s.error}`);
  const a = s.attempt, full = a.questions.map((q) => svc.questionById(q.id));
  assert.ok(!JSON.stringify(a).includes('"answer":['), `${key}: no answer keys delivered`);
  const done = svc.submitAttempt(u, a.id, Object.fromEntries(full.map((q) => [q.id, answerFor(q, right)]))).attempt;
  // Staff review every written/practical submission: full marks for the strong student, zero for the weak one.
  for (const item of svc.reviewQueue().filter((x) => x.attempt_id === done.id)) {
    const out = svc.submitReview(reviewer, u.id, done.id, item.question_id, { criteria: item.rubric.map((c) => ({ points: right ? c.points : 0 })), comment: right ? 'Complete and correct answer.' : 'This does not address the rubric.' });
    assert.ok(!out.error, out.error);
  }
  return { delivered: a, done: svc.career(u).attempts.find((x) => x.id === done.id) };
}

for (const t of [{ slug: 'common', title: 'Common CS' }, ...TRACKS]) {
  test(`pipeline: ${t.title}`, () => {
    // ---- strong student ----
    const strong = learner();
    if (t.slug !== 'common') svc.savePreferences(strong, { preferred_track: t.slug });
    if (t.slug !== 'common') take(strong, 'common', true); // shared CS skills such as programming come from here
    const { delivered, done } = take(strong, t.slug, true);
    for (const c of E.CATEGORIES) assert.ok(delivered.questions.some((q) => q.category === c), `${t.slug}: ${c} questions delivered`);
    assert.ok(delivered.questions.length >= 25 && delivered.questions.every((q) => q.options.length && q.grading !== 'review'), `${t.slug}: 25+ MCQs only`);
    assert.equal(done.result.pending, 0, 'all reviews applied');
    assert.equal(done.result.raw_score, 100, `${t.slug}: all-correct scores 100`);
    for (const c of E.CATEGORIES) assert.equal(done.result.categories[c].score, 100, `${t.slug}: ${c} 100`);
    const rs = svc.report(strong, t.slug === 'common' ? undefined : t.slug);
    if (t.slug === 'common') {
      assert.equal(rs.common.score, 100); assert.equal(rs.common.overall, 100);
    } else {
      const measured = rs.readiness.skills.filter((s) => s.evidence === 'sufficient');
      assert.ok(measured.length > 0);
      for (const s of measured) assert.equal(s.status, 'Strong', `${t.slug}: ${s.skill} strong`);
      assert.ok(!rs.gaps.some((g) => g.evidence === 'sufficient' && g.status !== 'Developing'), `${t.slug}: no real gaps for a perfect student`);
      if (rs.readiness.level !== 'Insufficient Evidence') assert.ok(['Advanced', 'Proficient'].includes(rs.readiness.level), `${t.slug}: level ${rs.readiness.level}`);
      assert.ok(rs.roadmap.stages.slice(0, 4).every((st) => st.skills.every((k) => k.satisfied || k.status === 'Not Yet Assessed' || k.status === 'Needs Further Assessment')));
    }

    // ---- retake: unseen practical and scenario items for every skill ----
    const seen = new Set(done.result.responses.map((r) => r.id));
    const retake = svc.startAttempt(strong, t.slug, { mode: 'full' }).attempt;
    const skillsInForm = [...new Set(retake.questions.map((q) => svc.questionById(q.id).skills[0]))];
    for (const sk of skillsInForm) for (const c of ['practical', 'scenario']) {
      const pool = svc.questions(svc.assessmentDef(t.slug).banks.find((b) => svc.questions(b).some((q) => q.skills[0] === sk))).filter((q) => q.skills[0] === sk && q.category === c && q.grading !== 'review');
      if (pool.some((q) => !seen.has(q.id))) assert.ok(retake.questions.some((q) => q.category === c && svc.questionById(q.id).skills[0] === sk && !seen.has(q.id)), `${t.slug} retake: unseen ${c} for ${sk}`);
    }
    svc.abandonAttempt(strong, retake.id);

    // ---- weak student ----
    const weak = learner();
    if (t.slug !== 'common') svc.savePreferences(weak, { preferred_track: t.slug });
    const w = take(weak, t.slug, false).done;
    assert.equal(w.result.raw_score, 0);
    const rw = svc.report(weak, t.slug === 'common' ? undefined : t.slug);
    if (t.slug === 'common') {
      assert.equal(rw.common.score, 0);
    } else {
      assert.ok(rw.gaps.length > 0, `${t.slug}: weak student has gaps`);
      assert.ok(['Foundation', 'Beginner', 'Insufficient Evidence'].includes(rw.readiness.level), `${t.slug}: weak level ${rw.readiness.level}`);
      for (const g of rw.gaps.filter((x) => x.score != null)) {
        assert.ok(g.recommendation && g.recommendation.length > 40, `${t.slug}: concrete recommendation for ${g.skill}`);
        assert.equal(g.reassess_available, true, `${t.slug}: reassessment for ${g.skill}`);
        for (const m of g.resources) assert.match(m.url, /^\/open#course\/[^/]+\/lesson\/\d+$/, 'real module link');
      }
      assert.equal(rw.roadmap.starting_stage, 1);
      const fb = rw.readiness.category_feedback;
      assert.ok(fb.rows.every((r) => r.level === 'weak' || r.level === 'none'), `${t.slug}: every category flagged weak`);
      // One skill reassessment per pipeline proves the loop closes.
      const g = rw.gaps.find((x) => x.score != null);
      const re = take(weak, 'skill:' + g.skill, true).done;
      assert.equal(re.result.skills[g.skill].evidence, 'sufficient');
      const after = svc.report(weak, t.slug).readiness.skills.find((s) => s.skill === g.skill);
      assert.equal(after.status, 'Strong', `${t.slug}: ${g.skill} strong after reassessment`);
      assert.equal(svc.history(weak).attempts.length, 2, 'history kept');
    }
  });
}
