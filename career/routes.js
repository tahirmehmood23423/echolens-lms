'use strict';
/**
 * Career assessment HTTP API. Mounted from server.js with the app's own
 * auth middleware; tests mount it on a bare express app with stubs.
 *
 * Public:   GET  /api/career/tracks, /api/career/tracks/:slug
 * Learner:  /api/career/me/...  (preferences, report, history, attempts)
 * Admin:    /api/admin/career/... (config, questions, tracks, analytics)
 *
 * Answer keys never leave the server before submission, scoring happens
 * only on the server, and every admin change is audit-logged by the service.
 */
const express = require('express');
const { createCareerService } = require('./service');
const { SKILLS } = require('./skills');

function register(app, { store, authRequired, adminRequired, rateLimit, aiSuggest = null, notify = null, appUrl = '' }) {
  const svc = createCareerService(store, { aiSuggest, notify, appUrl });
  const r = express.Router();
  const me = (req) => store.Users.byId(req.user.id);
  const send = (res, out, ok = (o) => o) => (out && out.error ? res.status(out.status || 400).json({ error: out.error, ...(out.retry_at ? { retry_at: out.retry_at } : {}), ...(out.active ? { active: out.active } : {}), ...(out.reuse ? { reuse: true } : {}) }) : res.json(ok(out)));
  const limitStart = rateLimit ? rateLimit('career-start', { max: 20, windowMs: 60 * 60 * 1000, message: 'Too many assessments started from this network. Please try again later.' }) : (q, s, n) => n();
  const limitSave = rateLimit ? rateLimit('career-save', { max: 600, windowMs: 60 * 60 * 1000, message: 'Too many saves. Please slow down.' }) : (q, s, n) => n();

  /* ------------------------------- public ------------------------------- */
  r.get('/career/tracks', (req, res) => res.json({ tracks: svc.tracks().map(svc.publicTrack), skills: SKILLS.map((s) => ({ id: s.id, name: s.name, group: s.group })) }));
  r.get('/career/tracks/:slug', (req, res) => {
    const t = svc.track(req.params.slug);
    if (!t || t.status !== 'published') return res.status(404).json({ error: 'Career track not found.' });
    res.json({ track: svc.publicTrack(t) });
  });
  r.get('/career/options', (req, res) => res.json({ preferences: svc.PREF_FIELDS, languages: svc.LANGS, tracks: svc.tracks().map((t) => ({ slug: t.slug, title: t.title })) }));

  /* ------------------------------- learner ------------------------------- */
  r.get('/career/me', authRequired, (req, res) => {
    const u = me(req); if (!u) return res.status(404).json({ error: 'Account not found.' });
    res.json({ learner: svc.isLearner(u), ...svc.report(u, req.query.track) });
  });
  r.put('/career/me/preferences', authRequired, (req, res) => send(res, svc.savePreferences(me(req), req.body || {})));
  r.get('/career/me/history', authRequired, (req, res) => res.json(svc.history(me(req))));
  r.post('/career/me/projects', authRequired, (req, res) => send(res, svc.setProject(me(req), req.body?.track, req.body?.stage, req.body?.link)));
  r.post('/career/me/attempts', authRequired, limitStart, (req, res) => send(res, svc.startAttempt(me(req), String(req.body?.assessment || ''), { mode: req.body?.mode === 'full' ? 'full' : 'gap' })));
  // Multi-career roadmaps: enroll, switch Primary, pause, resume, archive.
  r.get('/career/me/enrollments', authRequired, (req, res) => res.json(svc.listEnrollments(me(req))));
  r.post('/career/me/enrollments', authRequired, (req, res) => send(res, svc.enrollTrack(me(req), String(req.body?.track || ''), { primary: !!req.body?.primary }), (o) => ({ ...o.roadmaps, recommendation: svc.enrollmentAdvice(me(req), String(req.body?.track || '')) })));
  const act = { primary: svc.makePrimary, pause: svc.pauseTrack, resume: svc.resumeTrack, archive: svc.archiveTrack };
  r.post('/career/me/enrollments/:track/:action', authRequired, (req, res) => {
    const fn = act[req.params.action]; if (!fn) return res.status(404).json({ error: 'Unknown roadmap action.' });
    send(res, fn(me(req), req.params.track), (o) => o.roadmaps);
  });
  r.get('/career/me/skills', authRequired, (req, res) => res.json({ skills: svc.skillRecords(me(req)), common: svc.commonStatus(me(req)) }));
  r.get('/career/me/attempts/active', authRequired, (req, res) => res.json(svc.resumeAttempt(me(req))));
  r.put('/career/me/attempts/:id/answers', authRequired, limitSave, (req, res) => send(res, svc.saveAnswers(me(req), req.params.id, req.body?.answers, req.body?.runs, req.body?.pastes)));
  r.post('/career/me/attempts/:id/submit', authRequired, (req, res) => send(res, svc.submitAttempt(me(req), req.params.id, req.body?.answers, req.body?.runs, req.body?.pastes), (o) => ({ attempt: o.attempt, existing: !!o.existing })));
  r.post('/career/me/attempts/:id/abandon', authRequired, (req, res) => send(res, svc.abandonAttempt(me(req), req.params.id)));
  r.get('/career/me/attempts/:id/review', authRequired, (req, res) => {
    const rows = svc.attemptReview(me(req), req.params.id);
    if (!rows) return res.status(404).json({ error: 'Attempt not found.' });
    res.json({ review: rows });
  });
  r.get('/career/assessments/:key', authRequired, (req, res) => res.json(svc.availability(req.params.key)));

  /* -------------------------------- admin -------------------------------- */
  const admin = [authRequired, adminRequired];
  r.get('/admin/career/overview', admin, (req, res) => {
    const banks = Object.keys(svc.BANKS).map((b) => {
      const qs = svc.questions(b), by = (s) => qs.filter((q) => q.status === s).length;
      return { bank: b, title: svc.BANKS[b].title, total: qs.length, draft: by('draft'), reviewed: by('reviewed'), published: by('published'), retired: by('retired') };
    });
    const assessments = ['common', ...svc.tracks({ includeDraft: true }).map((t) => t.slug)].map((k) => ({ ...svc.availability(k), enabled: svc.config().enabled[k] !== false }));
    const weights = [{ key: 'common', title: 'Common CS assessment' }, ...svc.tracks({ includeDraft: true }).map((t) => ({ key: t.slug, title: t.title }))].map((w) => ({ ...w, weights: svc.categoryWeights(w.key) }));
    res.json({ weights, config: svc.config(), banks, assessments, tracks: svc.tracks({ includeDraft: true }).map((t) => ({ slug: t.slug, title: t.title, status: t.status, banks: t.assessment.banks })) });
  });
  r.put('/admin/career/config', admin, (req, res) => send(res, svc.updateConfig(req.body || {}, req.user.id)));
  r.get('/admin/career/questions', admin, (req, res) => {
    const bank = String(req.query.bank || 'common');
    if (!svc.BANKS[bank]) return res.status(400).json({ error: 'Unknown bank.' });
    res.json({ bank, questions: svc.questions(bank) });
  });
  r.post('/admin/career/questions', admin, (req, res) => send(res, svc.addQuestion(String(req.body?.bank || ''), req.body || {}, req.user.id)));
  r.put('/admin/career/questions/:id', admin, (req, res) => send(res, svc.editQuestion(req.params.id, req.body || {}, req.user.id)));
  r.post('/admin/career/questions/status', admin, (req, res) => send(res, svc.setQuestionStatus(req.body?.ids || [], String(req.body?.status || ''), req.user.id)));
  r.get('/admin/career/preview/:key', admin, (req, res) => send(res, svc.preview(req.params.key)));
  r.put('/admin/career/tracks/:slug', admin, (req, res) => send(res, svc.updateTrack(req.params.slug, req.body || {}, req.user.id)));
  r.get('/admin/career/tracks/:slug', admin, (req, res) => { const t = svc.track(req.params.slug); if (!t) return res.status(404).json({ error: 'Track not found.' }); res.json({ track: { ...svc.publicTrack(t), status: t.status } }); });
  r.get('/admin/career/analytics', admin, (req, res) => res.json(svc.analytics()));

  /* ------------------------- staff review (admin, instructor) ------------------------- */
  const reviewer = [authRequired, (req, res, next) => (svc.REVIEWER_ROLES.includes(req.user.role) ? next() : res.status(403).json({ error: 'Staff reviewers only.' }))];
  r.get('/career/reviews', reviewer, (req, res) => res.json({ reviews: svc.reviewQueue({ status: req.query.status === 'done' ? 'done' : 'pending' }), ai_available: !!aiSuggest }));
  r.post('/career/reviews/:uid/:attempt/:qid/suggest', reviewer, async (req, res, next) => {
    try { send(res, await svc.suggestReview(me(req), Number(req.params.uid), req.params.attempt, req.params.qid)); } catch (e) { next(e); }
  });
  r.post('/career/reviews/:uid/:attempt/:qid', reviewer, (req, res) => send(res, svc.submitReview(me(req), Number(req.params.uid), req.params.attempt, req.params.qid, req.body || {})));

  app.use('/api', r);
  return svc;
}

module.exports = { register };
