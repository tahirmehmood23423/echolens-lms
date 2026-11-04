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

function register(app, { store, authRequired, adminRequired, rateLimit, aiSuggest = null, notify = null, appUrl = '', optionalUser = null, secret = null }) {
  const svc = createCareerService(store, { aiSuggest, notify, appUrl, secret });
  // Signed-in user if there is one; null for guests (Career Discovery is open to everyone).
  const who = (req) => { try { const u = optionalUser ? optionalUser(req) : null; return u ? store.Users.byId(u.id) : null; } catch { return null; } };
  const r = express.Router();
  // A mutation is not acknowledged until the persistence queue has settled.
  r.use((req, res, next) => {
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) || !store.pendingPersist) return next();
    const json = res.json;
    res.json = function (body) {
      res.json = json;
      Promise.resolve().then(() => store.pendingPersist()).then(() => json.call(res, body)).catch(() => {
        if (!res.headersSent) json.call(res.status(503), { error: 'Your changes could not be saved. Please retry; your previous saved work is safe.' });
      });
      return res;
    };
    next();
  });
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

  /* ---------------------------- career discovery ---------------------------- */
  // Open to guests: welcome, questions, quiz and suggestions. Signing in is
  // needed only to save progress (and a guest result can be claimed after).
  const limitDisc = rateLimit ? rateLimit('career-discovery', { max: 40, windowMs: 60 * 60 * 1000, message: 'Too many quizzes started from this network. Please try again later.' }) : (q, s2, n) => n();
  const limitDiscSubmit = rateLimit ? rateLimit('career-discovery-submit', { max: 80, windowMs: 60 * 60 * 1000, message: 'Too many submissions. Please slow down.' }) : (q, s2, n) => n();
  const discOff = (res) => res.status(404).json({ error: 'Career Discovery is not available right now.' });
  r.get('/career/discovery', (req, res) => {
    const info = svc.discoveryInfo();
    const u = who(req);
    res.json({ ...info, signed_in: !!u, learner: !!u && svc.isLearner(u), state: u ? svc.discoveryState(u) : null });
  });
  r.post('/career/discovery/quiz', limitDisc, (req, res) => send(res, svc.startDiscoveryQuiz(who(req))));
  r.post('/career/discovery/quiz/resume', (req, res) => send(res, svc.resumeDiscoveryQuiz(String(req.body?.token || ''))));
  r.post('/career/discovery/quiz/submit', limitDiscSubmit, (req, res) => {
    if (!svc.discoveryConfig().enabled) return discOff(res);
    send(res, svc.submitDiscoveryQuiz(who(req), String(req.body?.token || ''), req.body?.answers || {}, req.body?.onboarding || null));
  });
  r.post('/career/discovery/recommendations', (req, res) => {
    if (!svc.discoveryConfig().enabled) return discOff(res);
    const u = who(req);
    res.json(svc.discoveryRecommendations(u && svc.isLearner(u) ? u : null, { answers: req.body?.answers, result_token: req.body?.result_token }));
  });
  r.put('/career/me/discovery', authRequired, (req, res) => send(res, svc.saveDiscovery(me(req), req.body || {})));
  r.post('/career/me/discovery/claim', authRequired, (req, res) => send(res, svc.claimDiscovery(me(req), req.body || {})));

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

  /* ------------------ curriculum: subtracks, job roles, comprehensive assessments ------------------ */
  const cur = svc.curriculum;
  r.put('/career/me/target', authRequired, (req, res) => send(res, cur.setTarget(me(req), req.body?.role || null)));
  const nf = (res, what) => res.status(404).json({ error: `${what} not found.` });
  r.get('/career/curriculum/tracks/:slug', (req, res) => { const v = cur.trackView(who(req), req.params.slug); v ? res.json(v) : nf(res, 'Career track'); });
  r.get('/career/curriculum/subtracks/:id', (req, res) => { const v = cur.subtrackView(who(req), req.params.id); v ? res.json(v) : nf(res, 'Subtrack'); });
  r.get('/career/curriculum/roles/:id', (req, res) => { const v = cur.roleView(who(req), req.params.id); v ? res.json(v) : nf(res, 'Job role'); });
  r.post('/career/me/st/subtracks/:id/start', authRequired, limitStart, (req, res) => send(res, cur.startSubtrack(me(req), req.params.id)));
  r.post('/career/me/st/roles/:id/start', authRequired, limitStart, (req, res) => send(res, cur.startRole(me(req), req.params.id)));
  r.get('/career/me/st/active', authRequired, (req, res) => res.json(cur.resume(me(req))));
  r.put('/career/me/st/attempts/:id/answers', authRequired, limitSave, (req, res) => send(res, cur.saveAnswers(me(req), req.params.id, req.body?.answers)));
  r.post('/career/me/st/attempts/:id/submit', authRequired, (req, res) => send(res, cur.submit(me(req), req.params.id, req.body?.answers)));
  r.get('/career/me/st/attempts/:id/review', authRequired, (req, res) => { const rows = cur.attemptReview(me(req), req.params.id); rows ? res.json({ review: rows }) : nf(res, 'Attempt'); });
  r.get('/career/me/st/history', authRequired, (req, res) => res.json({ attempts: cur.history(me(req), req.query.subtrack ? String(req.query.subtrack) : null) }));

  /* -------------------------------- admin -------------------------------- */
  const admin = [authRequired, adminRequired];
  r.get('/admin/career/discovery', admin, (req, res) => res.json({ config: svc.discoveryConfig(), analytics: svc.discoveryAnalytics(), questions: svc.discoveryInfo().questions, tracks: svc.tracks().map((t) => ({ slug: t.slug, title: t.title })) }));
  r.put('/admin/career/discovery', admin, (req, res) => send(res, svc.updateDiscoveryConfig(req.body || {}, req.user.id)));
  r.post('/admin/career/discovery/reset', admin, (req, res) => send(res, svc.resetDiscoveryConfig(req.user.id)));
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
  // Curriculum and question-bank QA.
  r.get('/admin/career/curriculum', admin, (req, res) => res.json({ ...cur.qaDashboard(), config: cur.config() }));
  r.put('/admin/career/curriculum/config', admin, (req, res) => send(res, cur.updateConfig(req.body || {}, req.user.id)));
  r.put('/admin/career/curriculum/structure', admin, (req, res) => send(res, cur.updateStructure(req.body || {}, req.user.id)));
  r.get('/admin/career/curriculum/roles/:id', admin, (req, res) => { const v = cur.roleView(null, req.params.id); v ? res.json({ ...v, mandatory: cur.role(req.params.id).mandatory, optional_ids: cur.role(req.params.id).optional, jd_full: cur.role(req.params.id).jd }) : nf(res, 'Job role'); });
  const known = (req, res, next) => (cur.subtrack(req.params.id) ? next() : nf(res, 'Subtrack'));
  r.get('/admin/career/curriculum/subtracks/:id/questions', admin, known, (req, res) => res.json(cur.adminQuestions(req.params.id, { difficulty: req.query.difficulty || null, status: req.query.status || null })));
  r.put('/admin/career/curriculum/subtracks/:id/questions/:qid', admin, known, (req, res) => send(res, cur.editQuestion(req.params.id, req.params.qid, req.body || {}, req.user.id)));
  r.post('/admin/career/curriculum/subtracks/:id/questions/status', admin, known, (req, res) => send(res, cur.setQuestionStatus(req.params.id, req.body?.ids || [], String(req.body?.status || ''), req.user.id)));
  r.post('/admin/career/curriculum/subtracks/:id/questions/import', admin, known, (req, res) => send(res, cur.importQuestions(req.params.id, req.body?.questions, req.user.id)));
  r.get('/admin/career/curriculum/subtracks/:id/preview', admin, known, (req, res) => res.json(cur.previewForm(req.params.id)));
  r.post('/admin/career/curriculum/subtracks/:id/publish', admin, known, (req, res) => { const out = cur.publishAssessment(req.params.id, req.user.id); out.error ? res.status(out.status).json({ error: out.error, reasons: out.reasons || [] }) : res.json(out); });
  r.post('/admin/career/curriculum/subtracks/:id/unpublish', admin, known, (req, res) => send(res, cur.unpublishAssessment(req.params.id, req.user.id)));

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
