'use strict';
/**
 * Career service - the glue between the pure engine and EchoLens storage.
 *
 * Storage (no schema migration needed; works in the JSON, legacy JSONB and
 * normalized Prisma stores alike):
 *   settings.career_config     admin overrides of engine config (versioned)
 *   settings.career_questions  question status, edited versions, admin-added
 *                              questions, and every superseded version
 *   settings.career_tracks     admin edits to track text / skill weights
 *   users[].profile.career     { preferences, attempts[], active, projects }
 *
 * Students' attempts are immutable once submitted: each stores the graded
 * responses and the config version it was scored under, so later edits to
 * questions or weights never rewrite a past result.
 */
const crypto = require('crypto');
const E = require('./engine');
const { SKILLS, skill } = require('./skills');
const { TRACKS, STAGE_NAMES, track: baseTrack } = require('./tracks');
const R = require('./roadmaps');
const D = require('./discovery');
const { createCurriculumService } = require('./curriculum/service');

const { BANKS } = require('./banks');
const REVIEWER_ROLES = ['admin', 'instructor'];
const LEARNER_ROLES = ['free', 'student'];
// Attempts are append-only; UI history is paginated instead of deleting evidence.
const MAX_HISTORY = Infinity;
const QUESTION_STATUSES = ['draft', 'reviewed', 'published', 'retired'];
const TRACK_STATUSES = ['draft', 'published'];

function createCareerService(store, { now = () => new Date(), aiSuggest = null, notify = null, appUrl = '', secret = null, curriculumOptions = {} } = {}) {
  // Signs Career Discovery quiz forms and results, so guests can take the quiz without an account.
  const SIGNING_KEY = secret || crypto.randomBytes(32).toString('hex');
  const choiceId = (nonce, qid, id) => crypto.createHmac('sha256', SIGNING_KEY).update(`${nonce}:${qid}:${id}`).digest('hex').slice(0, 24);
  const publicQuestion = (q, order, nonce) => { const out = E.publicQuestion(q, order); out.options = out.options.map((o) => ({ ...o, id: choiceId(nonce, q.id, o.id) })); return out; };
  const decodeChoice = (q, nonce, value) => {
    if (!q.options.length) return value;
    const one = (v) => q.options.find((o) => choiceId(nonce, q.id, o.id) === String(v))?.id || '';
    return Array.isArray(value) ? value.map(one).filter(Boolean) : one(value);
  };

  const data = () => store.allData();
  const settings = () => { const d = data(); if (!d.settings) d.settings = {}; return d.settings; };
  const save = () => store.persist();
  const iso = () => now().toISOString();

  /* ----------------------------- configuration ----------------------------- */
  function config() {
    const o = settings().career_config || {};
    const c = { ...E.DEFAULT_CONFIG, ...o, skill_thresholds: { ...E.DEFAULT_CONFIG.skill_thresholds, ...(o.skill_thresholds || {}) } };
    c.enabled = { common: true, ...(o.enabled || {}) };
    c.category_weights = { ...E.DEFAULT_CONFIG.category_weights, ...(o.category_weights || {}) };
    c.max_active_roadmaps = o.max_active_roadmaps ?? 3;
    c.common_valid_days = o.common_valid_days ?? 365;
    c.skill_valid_days = o.skill_valid_days ?? 365;
    return c;
  }
  /** Validate and apply an admin config change. Returns { config } or { error }. */
  function updateConfig(patch, actorId) {
    const cur = settings().career_config || {}, next = { ...cur };
    if (patch.common_weights) {
      const w = {};
      for (const k of Object.keys(E.DEFAULT_CONFIG.common_weights)) {
        const v = Number(patch.common_weights[k]);
        if (!Number.isFinite(v) || v < 0 || v > 100) return { error: `Weight for ${k} must be 0-100.` };
        w[k] = v;
      }
      if (Object.values(w).reduce((a, b) => a + b, 0) <= 0) return { error: 'At least one category needs a weight above 0.' };
      next.common_weights = w;
    }
    if (patch.bands) {
      const b = patch.bands.map((x) => ({ min: Number(x.min), level: String(x.level || '').slice(0, 40) }));
      if (!b.length || b[0].min !== 0 || b.some((x, i) => !x.level || !Number.isFinite(x.min) || (i && x.min <= b[i - 1].min) || x.min > 100)) return { error: 'Bands must start at 0, rise strictly and stay within 0-100, each with a level name.' };
      next.bands = b;
    }
    if (patch.skill_thresholds) {
      const s = Number(patch.skill_thresholds.strong), d = Number(patch.skill_thresholds.developing);
      if (!(d > 0 && s > d && s <= 100)) return { error: 'Thresholds must satisfy 0 < developing < strong <= 100.' };
      next.skill_thresholds = { strong: s, developing: d };
    }
    if (patch.category_weights) {
      const cw = { ...(cur.category_weights || {}) };
      for (const [key, w] of Object.entries(patch.category_weights)) {
        if (key !== 'default' && key !== 'common' && !baseTrack(key)) return { error: `Unknown assessment ${key}.` };
        const vals = {};
        for (const c of E.CATEGORIES) { const v = Number(w?.[c]); if (!Number.isFinite(v) || v < 0 || v > 100) return { error: `${c} weight for ${key} must be 0-100.` }; vals[c] = v; }
        if (Object.values(vals).reduce((a, b) => a + b, 0) <= 0) return { error: `At least one category weight for ${key} must be above 0.` };
        cw[key] = vals;
      }
      next.category_weights = cw;
    }
    for (const [k, lo, hi] of [['min_evidence_items', 1, 10], ['min_category_items', 1, 10], ['track_items_per_skill', 2, 8], ['skill_reassess_items', 2, 10], ['min_form_items', 10, 60], ['retake_cooldown_hours', 0, 720], ['max_active_roadmaps', 1, 12], ['common_valid_days', 30, 1095], ['skill_valid_days', 30, 1095]]) {
      if (patch[k] !== undefined) { const v = Math.round(Number(patch[k])); if (!(v >= lo && v <= hi)) return { error: `${k} must be ${lo}-${hi}.` }; next[k] = v; }
    }
    if (patch.min_confidence !== undefined) { const v = Number(patch.min_confidence); if (!(v > 0 && v <= 1)) return { error: 'min_confidence must be between 0 and 1.' }; next.min_confidence = v; }
    if (patch.enabled) next.enabled = Object.fromEntries(Object.entries(patch.enabled).map(([k, v]) => [String(k).slice(0, 80), !!v]));
    next.version = (cur.version || 1) + 1; next.updated_at = iso(); next.updated_by = actorId || null;
    settings().career_config = next;
    audit(actorId, 'career_config_update', 'career_config', next.version, { keys: Object.keys(patch) });
    save();
    return { config: config() };
  }

  function audit(actorId, action, type, id, detail) {
    try { store.AuditLog?.record({ actor_id: actorId || null, action, target_type: type, target_id: typeof id === 'number' ? id : null, detail: { ...(detail || {}), ref: String(id) }, deferSave: true }); } catch { /* auditing must not block the change */ }
  }

  /** Theory / practical / scenario weights in force for an assessment key. */
  const categoryWeights = (key) => E.weightsFor(key, config(), baseTrack(key)?.category_weights);

  /* -------------------------------- questions -------------------------------- */
  const qstate = () => { const s = settings(); if (!s.career_questions) s.career_questions = { status: {}, edits: {}, custom: [], history: {} }; return s.career_questions; };
  function bankOf(id) { for (const [b, v] of Object.entries(BANKS)) if (v.questions.some((q) => q.id === id)) return b; return (qstate().custom.find((q) => q.id === id) || {}).bank || null; }
  /** The effective current version of every question in a bank. */
  function questions(bank) {
    const st = qstate();
    const base = (BANKS[bank]?.questions || []).map((q) => ({ ...q, ...(st.edits[q.id] || {}) }));
    const custom = st.custom.filter((q) => q.bank === bank);
    return [...base, ...custom].map((q) => {
      const edited = !!st.edits[q.id];
      // An admin edit is a new, unreviewed version: it stays draft until re-published, whatever the built-in status was.
      const status = st.status[q.id]?.status || (edited ? 'draft' : q.status);
      return { ...q, bank, status, reviewed_by: st.status[q.id]?.by || (!edited && q.review ? q.review.by : null), reviewed_at: st.status[q.id]?.at || (!edited && q.review ? q.review.at : null) };
    });
  }
  const published = (bank) => questions(bank).filter((q) => q.status === 'published');
  function questionById(id) { const b = bankOf(id); return b ? questions(b).find((q) => q.id === id) || null : null; }

  function setQuestionStatus(ids, status, actorId) {
    if (!QUESTION_STATUSES.includes(status)) return { error: 'Unknown status.' };
    const st = qstate(); let n = 0;
    for (const id of [].concat(ids)) { if (!questionById(id)) continue; st.status[id] = { status, by: actorId || null, at: iso() }; n++; }
    audit(actorId, 'career_question_status', 'career_question', String(ids).slice(0, 200), { status, count: n });
    save(); return { updated: n };
  }
  /** Validate a question body from the admin form. */
  function cleanQuestion(b) {
    const type = ['single', 'multi', 'output', 'debug', 'scenario', 'written', 'submission'].includes(b.type) ? b.type : 'single';
    const skills = [].concat(b.skills || []).map(String).filter((s) => skill(s));
    if (!skills.length) return { error: 'Map the question to at least one known skill.' };
    const prompt = String(b.prompt || '').trim().slice(0, 2000), explanation = String(b.explanation || '').trim().slice(0, 2000);
    if (prompt.length < 8) return { error: 'Write the question statement.' };
    if (!explanation) return { error: 'Every question needs an explanation of the correct answer.' };
    const difficulty = [1, 2, 3].includes(Number(b.difficulty)) ? Number(b.difficulty) : 1;
    const review = type === 'written' || type === 'submission';
    const category = type === 'submission' ? 'practical' : E.CATEGORIES.includes(b.category) ? b.category
      : type === 'scenario' ? 'scenario' : type === 'debug' || b.practical ? 'practical' : 'theory';
    const q = { type, skills, difficulty, prompt, explanation, code: String(b.code || '').slice(0, 4000) || null, category, practical: category === 'practical',
      grading: review ? 'review' : 'auto', points: difficulty, time_sec: Math.max(20, Math.min(900, Number(b.time_sec) || (review ? 300 : ({ 1: 45, 2: 75, 3: 105 })[difficulty]))) };
    if (review) {
      const rubric = [].concat(b.rubric || []).map((r) => ({ criterion: String(r?.criterion || '').trim().slice(0, 300), points: Number(r?.points) })).filter((r) => r.criterion);
      if (!rubric.length) return { error: 'A reviewed question needs at least one rubric criterion.' };
      if (rubric.some((r) => !(r.points > 0 && r.points <= 10))) return { error: 'Each rubric criterion needs 1-10 points.' };
      q.rubric = rubric; q.points = rubric.reduce((a, r) => a + r.points, 0);
      q.model_answer = String(b.model_answer || b.explanation || '').slice(0, 4000);
      q.run_lang = type === 'submission' && ['python', 'javascript'].includes(b.run_lang) ? b.run_lang : null;
      q.options = []; q.answer = [];
    } else if (type === 'output') {
      q.options = []; q.answer = [].concat(b.answer || []).map((a) => String(a).trim()).filter(Boolean).slice(0, 10);
      if (!q.answer.length) return { error: 'List at least one accepted answer.' };
    } else {
      // Accept option text or the stored { id, text } objects (an edit that only changes the explanation).
      const opts = [].concat(b.options || []).map((t) => String(t && typeof t === 'object' ? t.text : t).trim()).filter(Boolean).slice(0, 8);
      if (opts.length < 2) return { error: 'Give at least two options.' };
      if (new Set(opts).size !== opts.length) return { error: 'Options must be different from each other.' };
      q.options = opts.map((text, i) => ({ id: 'abcdefgh'[i], text }));
      q.answer = [].concat(b.answer || []).map(String).filter((a) => q.options.some((o) => o.id === a));
      if (!q.answer.length) return { error: 'Mark the correct option(s).' };
      if (type !== 'multi' && q.answer.length !== 1) return { error: 'Single-answer questions need exactly one correct option.' };
      if (type === 'multi' && q.answer.length < 2) q.type = 'single';
    }
    return { question: q };
  }
  /** Edit creates a new version and returns it to draft; the old version is kept. */
  function editQuestion(id, body, actorId) {
    const cur = questionById(id); if (!cur) return { error: 'Question not found.', status: 404 };
    const c = cleanQuestion({ ...cur, ...body }); if (c.error) return c;
    const st = qstate(); (st.history[id] = st.history[id] || []).push({ ...cur, superseded_at: iso() });
    const next = { ...c.question, version: (cur.version || 1) + 1 };
    const custom = st.custom.find((q) => q.id === id);
    if (custom) Object.assign(custom, next); else st.edits[id] = next;
    st.status[id] = { status: 'draft', by: actorId || null, at: iso() };
    audit(actorId, 'career_question_edit', 'career_question', id, { version: next.version });
    save(); return { question: questionById(id) };
  }
  function addQuestion(bank, body, actorId) {
    if (!BANKS[bank]) return { error: 'Unknown question bank.' };
    const c = cleanQuestion(body); if (c.error) return c;
    const st = qstate(), id = `${bank}-x-${crypto.randomBytes(3).toString('hex')}`;
    st.custom.push({ ...c.question, id, bank, version: 1, status: 'draft' });
    st.status[id] = { status: 'draft', by: actorId || null, at: iso() };
    audit(actorId, 'career_question_add', 'career_question', id, { bank });
    save(); return { question: questionById(id) };
  }

  /* --------------------------------- tracks --------------------------------- */
  const tstate = () => { const s = settings(); if (!s.career_tracks) s.career_tracks = {}; return s.career_tracks; };
  function track(slug) {
    const t = baseTrack(slug); if (!t) return null;
    const o = tstate()[slug] || {};
    const skills = t.skills.map((s) => ({ ...s, ...((o.skills || {})[s.skill] || {}) }));
    return { ...t, ...o, skills, stages: t.stages, assessment: t.assessment };
  }
  const tracks = ({ includeDraft = false } = {}) => TRACKS.map((t) => track(t.slug)).filter((t) => includeDraft || t.status === 'published');
  function updateTrack(slug, b, actorId) {
    const t = baseTrack(slug); if (!t) return { error: 'Track not found.', status: 404 };
    const o = { ...(tstate()[slug] || {}) };
    if (b.status !== undefined) { if (!TRACK_STATUSES.includes(b.status)) return { error: 'Status must be draft or published.' }; o.status = b.status; }
    for (const k of ['title', 'summary', 'overview', 'duration', 'practical']) if (b[k] !== undefined) o[k] = String(b[k]).trim().slice(0, k === 'overview' ? 2000 : 300) || t[k];
    for (const k of ['prerequisites', 'tools', 'outcomes']) if (b[k] !== undefined) o[k] = [].concat(b[k]).map((x) => String(x).trim().slice(0, 200)).filter(Boolean).slice(0, 20);
    if (b.skills) {
      o.skills = { ...(o.skills || {}) };
      for (const [id, v] of Object.entries(b.skills)) {
        if (!t.skills.some((s) => s.skill === id)) continue;
        const w = Number(v.weight); if (!(w >= 0 && w <= 10)) return { error: `Weight for ${id} must be 0-10.` };
        o.skills[id] = { weight: w, critical: !!v.critical };
      }
    }
    o.updated_at = iso(); o.updated_by = actorId || null;
    tstate()[slug] = o;
    audit(actorId, 'career_track_update', 'career_track', slug, { keys: Object.keys(b) });
    save(); return { track: track(slug) };
  }

  /* ------------------------------ assessments ------------------------------ */
  /**
   * Assessment keys: 'common', a track slug, or 'skill:<skillId>' for a short
   * skill reassessment. Returns the plan and pool, and whether it can run.
   */
  function assessmentDef(key) {
    const cfg = config();
    if (key === 'common') {
      // Top the common form up to min_form_items, one question per skill in turn.
      const plan = { ...cfg.common_form }, ids = Object.keys(plan);
      for (let i = 0; ids.length && Object.values(plan).reduce((a, b) => a + b, 0) < cfg.min_form_items; i++) plan[ids[i % ids.length]]++;
      return { key, title: BANKS.common.title, banks: ['common'], plan, enabled: cfg.enabled.common !== false, reviewItems: 0, weights: categoryWeights('common') };
    }
    if (String(key).startsWith('skill:')) {
      const id = key.slice(6); if (!skill(id) || skill(id).group === 'Discovery') return null;
      const banks = Object.keys(BANKS).filter((b) => BANKS[b].questions.some((q) => q.skills[0] === id) || qstate().custom.some((q) => q.bank === b && q.skills[0] === id));
      // Short and mostly auto-graded. One staff-reviewed item (where the skill
      // has one) lets a student prove practical or written ability that repeat
      // questions could not fairly show again.
      return { key, title: `${skill(id).name} reassessment`, banks, plan: { [id]: cfg.skill_reassess_items }, enabled: true, skill: id, reviewItems: 0, weights: categoryWeights('default') };
    }
    const t = track(key); if (!t) return null;
    const banks = t.assessment.banks || [];
    const plan = {};
    const assessable = t.skills.filter((s) => banks.some((b) => questions(b).some((q) => q.skills[0] === s.skill && q.grading !== 'review')));
    // Enough questions per skill that the whole test has at least min_form_items MCQs.
    const per = Math.max(cfg.track_items_per_skill, Math.ceil(cfg.min_form_items / Math.max(1, assessable.length)));
    for (const s of assessable) plan[s.skill] = per;
    return { key, title: `${t.title} skill assessment`, banks, plan, enabled: !!banks.length && cfg.enabled[key] !== false && t.status === 'published', track: t.slug, reviewItems: 0, weights: categoryWeights(key) };
  }
  /** Coverage: does every planned skill have enough PUBLISHED questions? */
  function coverage(def) {
    const pool = def.banks.flatMap(published);
    const skills = Object.entries(def.plan).map(([id, want]) => {
      const have = pool.filter((q) => q.skills[0] === id && q.grading !== 'review');
      const cats = Object.fromEntries(E.CATEGORIES.map((c) => [c, have.filter((q) => q.category === c).length]));
      return { skill: id, name: skill(id)?.name || id, want, published: have.length, by_category: cats, alternate_forms: have.length >= want * 2, ok: have.length >= want, difficulties: [...new Set(have.map((q) => q.difficulty))].sort() };
    });
    const inPlan = pool.filter((q) => def.plan[q.skills[0]]);
    const categories = Object.fromEntries(E.CATEGORIES.map((c) => [c, inPlan.filter((q) => q.category === c && q.grading !== 'review').length]));
    // Skills whose practical or scenario pool has fewer than two items: a retake
    // cannot draw a fresh one, so the earlier result simply stands. Admins add here first.
    const thin = skills.flatMap((x) => ['practical', 'scenario'].filter((c) => x.by_category[c] < 2).map((c) => ({ skill: x.skill, name: x.name, category: c, have: x.by_category[c] })));
    return { skills, categories, thin, reviewed: inPlan.filter((q) => q.grading === 'review').length,
      ok: skills.length > 0 && skills.every((s) => s.ok), practical: categories.practical > 0, scenario: categories.scenario > 0 };
  }
  function availability(key) {
    const def = assessmentDef(key); if (!def) return { key, available: false, reason: 'Unknown assessment.' };
    if (!def.banks.length) return { key, title: def.title, available: false, reason: 'This track\'s assessment is coming soon.' };
    if (!def.enabled) return { key, title: def.title, available: false, reason: 'This assessment is not enabled yet.' };
    const cov = coverage(def);
    if (!cov.ok) return { key, title: def.title, available: false, reason: 'Questions for this assessment are still being reviewed.', coverage: cov };
    // A hybrid assessment needs practical and scenario evidence, not only theory (skill reassessments excepted).
    if (!def.skill && (!cov.practical || !cov.scenario)) return { key, title: def.title, available: false, reason: 'Practical and scenario questions for this assessment are still being reviewed.', coverage: cov };
    const items = Object.values(def.plan).reduce((a, b) => a + b, 0) + Math.min(def.reviewItems || 0, cov.reviewed);
    return { key, title: def.title, available: true, items, reviewed_items: Math.min(def.reviewItems || 0, cov.reviewed), weights: def.weights, coverage: cov };
  }

  /* ----------------------------- student records ----------------------------- */
  function career(user) {
    const c = user.profile?.career || {};
    return { preferences: c.preferences || null, attempts: c.attempts || [], active: c.active || null, projects: c.projects || {}, enrollments: c.enrollments || null, discovery: c.discovery || null, st: c.st || null, target_role: c.target_role || null, target_roles: c.target_roles || {}, role_history: c.role_history || [] };
  }
  function writeCareer(user, next) {
    const attempts = next.attempts;
    const previous = user.profile;
    user.profile = { ...(user.profile || {}), career: { ...next, attempts } };
    try { save(); } catch (error) { user.profile = previous; throw error; }
  }
  const isLearner = (user) => LEARNER_ROLES.includes(user?.role);

  const PREF_FIELDS = {
    education_level: ['', 'Matric / O-Level', 'Intermediate / A-Level', 'Undergraduate', 'Graduate', 'Working professional', 'Other'],
    experience: ['', 'None', 'Some (tutorials or a course)', 'Comfortable in one language', 'Built projects', 'Professional'],
    weekly_hours: ['', 'Under 3 hours', '3-6 hours', '6-10 hours', '10+ hours'],
  };
  const LANGS = ['C', 'C++', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Kotlin', 'Dart', 'Go', 'SQL', 'HTML/CSS', 'PHP', 'C#', 'R'];
  /** Onboarding: everything optional, nothing sensitive. */
  function savePreferences(user, b) {
    if (!isLearner(user)) return { error: 'Career onboarding is for learner accounts.', status: 403 };
    const pick = (k) => (PREF_FIELDS[k].includes(b[k]) ? b[k] : '') || null;
    const interests = [].concat(b.interests || []).filter((s) => track(s)).slice(0, 12);
    const preferred = track(b.preferred_track) ? b.preferred_track : (interests[0] || null);
    const prefs = {
      education_level: pick('education_level'), experience: pick('experience'), weekly_hours: pick('weekly_hours'),
      languages: [].concat(b.languages || []).filter((l) => LANGS.includes(l)).slice(0, 14),
      interests, preferred_track: preferred,
      goals: String(b.goals || '').trim().slice(0, 500) || null,
      updated_at: iso(),
    };
    const c = career(user);
    writeCareer(user, { ...c, preferences: { ...(c.preferences || {}), ...prefs, preferred_track: c.preferences?.preferred_track || null } });
    // The preferred track IS the Primary roadmap: enrol in it (or make it Primary) through the enrollment rules.
    let roadmap_error = null;
    if (preferred) {
      const e = enrollmentFor(user, preferred);
      const out = !e ? enrollTrack(user, preferred, { primary: true }) : e.status === 'active' ? makePrimary(user, preferred) : resumeTrack(user, preferred, { primary: true });
      if (out.error) roadmap_error = out.error;
    }
    return { preferences: career(user).preferences, roadmap_error };
  }

  function seenIds(c, def) {
    const recent = c.attempts.filter((a) => a.assessment === def.key || (def.skill && a.result?.skills?.[def.skill])).slice(-config().recent_attempts_excluded);
    return new Set(recent.flatMap((a) => (a.result?.responses || []).map((r) => r.id)));
  }

  function startAttempt(user, key, { mode = 'gap' } = {}) {
    if (!isLearner(user)) return { error: 'Assessments are for learner accounts. Admins can preview forms from the admin panel.', status: 403 };
    const base = assessmentDef(key); const av = availability(key);
    if (!base || !av.available) return { error: av.reason || 'This assessment is not available.', status: 409 };
    // Track tests reuse verified evidence: in 'gap' mode only skills that are not
    // yet verified for THIS roadmap (at its required depth) are asked about.
    let def = base, gapMode = false;
    if (base.track) {
      const plan = trackPlan(user, base.track, mode === 'full' ? 'full' : 'gap');
      if (!Object.keys(plan).length) return { error: 'Every skill this roadmap assesses is already verified from your earlier results, so there is nothing new to test. Choose the full assessment if you want to be re-tested.', status: 409, reuse: true };
      gapMode = mode !== 'full' && Object.keys(plan).length < Object.keys(base.plan).length;
      def = { ...base, plan, title: gapMode ? `${base.title} (skills not yet verified)` : base.title };
    }
    const c = career(user), cfg = config(), t = now();
    if (c.active) {
      const live = Date.parse(c.active.expires_at) + cfg.time_grace_sec * 1000 > t.getTime();
      if (c.active.assessment === key && live) return { attempt: deliver(c.active), resumed: true };
      if (live) return { error: 'You have another assessment in progress. Finish or abandon it first.', status: 409, active: c.active.assessment };
      finalize(user, c.active.id, {}, { expired: true });
    }
    const fresh = career(user);
    if (!def.skill && !gapMode && cfg.retake_cooldown_hours) {
      const last = fresh.attempts.filter((a) => a.assessment === key && a.status === 'submitted').pop();
      if (last && t.getTime() - Date.parse(last.submitted_at) < cfg.retake_cooldown_hours * 3600e3) {
        const at = new Date(Date.parse(last.submitted_at) + cfg.retake_cooldown_hours * 3600e3).toISOString();
        return { error: `You can retake this assessment after ${at.slice(0, 16).replace('T', ' ')} UTC. Meanwhile, work on the recommended modules or take a short skill reassessment.`, status: 429, retry_at: at };
      }
    }
    const pool = def.banks.flatMap(published);
    const seed = crypto.randomInt(1, 2 ** 31);
    const form = E.assembleForm({ pool, plan: def.plan, seen: seenIds(fresh, def), seed });
    const byId = new Map(pool.map((q) => [q.id, q]));
    const snapshot = form.items.map((i) => ({ ...byId.get(i.id), order: i.order }));
    const limitSec = Math.ceil(snapshot.reduce((a, q) => a + q.time_sec, 0) / 60) * 60;
    const active = {
      id: 'ca_' + crypto.randomBytes(8).toString('hex'), assessment: key, title: def.title, track: def.track || null, skill: def.skill || null,
      started_at: t.toISOString(), expires_at: new Date(t.getTime() + limitSec * 1000).toISOString(), limit_sec: limitSec,
      config_version: cfg.version, rules: JSON.parse(JSON.stringify(cfg)), choice_nonce: crypto.randomBytes(16).toString('hex'), weights: def.weights, questions: snapshot, answers: {}, saved_at: null, mode: gapMode ? 'gap' : 'full',
    };
    writeCareer(user, { ...fresh, active });
    // Taking a track's test (for example from "Test Your Skills") enrols the student
    // in that roadmap when they do not follow it yet and have room; the first one becomes Primary.
    if (def.track && !enrollmentFor(user, def.track)) enrollTrack(user, def.track, {});
    return { attempt: deliver(active) };
  }
  /** Resume an interrupted assessment, or close one whose time has run out. */
  function resumeAttempt(user) {
    const c = career(user); if (!c.active) return { attempt: null };
    if (Date.parse(c.active.expires_at) + config().time_grace_sec * 1000 > now().getTime()) return { attempt: deliver(c.active), resumed: true };
    return { attempt: null, finalized: finalize(user, c.active.id, {}, { expired: true }) };
  }
  /** The student-facing form: no keys, no explanations. */
  function deliver(a) {
    if (!a.choice_nonce) { a.choice_nonce = crypto.randomBytes(16).toString('hex'); save(); }
    const encoded = Object.fromEntries(Object.entries(a.answers || {}).map(([id, answer]) => { const q = a.questions.find((q) => q.id === id); const enc = (v) => choiceId(a.choice_nonce, id, v); return [id, q?.options.length ? (Array.isArray(answer) ? answer.map(enc) : enc(answer)) : answer]; }));
    return { id: a.id, assessment: a.assessment, title: a.title, started_at: a.started_at, expires_at: a.expires_at, limit_sec: a.limit_sec, answers: encoded,
      weights: a.weights || null,
      questions: a.questions.map((q) => ({ ...publicQuestion(q, q.order, a.choice_nonce), skill: skill(q.skills[0])?.name || q.skills[0] })) };
  }
  function cleanAnswers(a, answers) {
    const out = {}, byId = new Map(a.questions.map((q) => [q.id, q]));
    for (const [k, incoming] of Object.entries(answers || {})) {
      const v = a.choice_nonce && byId.has(k) ? decodeChoice(byId.get(k), a.choice_nonce, incoming) : incoming;
      const q = byId.get(k); if (!q) continue;
      out[k] = Array.isArray(v) ? v.slice(0, 8).map((x) => String(x).slice(0, 4)) : String(v ?? '').slice(0, q.grading === 'review' ? 6000 : 200);
    }
    return out;
  }
  /** Browser-compiler output for runnable submissions: kept as unverified evidence for the reviewer. */
  function cleanRuns(a, runs) {
    const out = {}, byId = new Map(a.questions.map((q) => [q.id, q]));
    for (const [k, v] of Object.entries(runs || {})) { const q = byId.get(k); if (q && q.run_lang) out[k] = String(v ?? '').slice(0, 4000); }
    return out;
  }
  /** Autosave, so an interrupted assessment resumes where it stopped. */
  function cleanPastes(a, pastes) {
    const out = {}, ids = new Set(a.questions.map((q) => q.id));
    for (const [k, v] of Object.entries(pastes || {})) if (ids.has(k)) out[k] = Math.max(0, Math.min(999, Math.round(Number(v) || 0)));
    return out;
  }
  function saveAnswers(user, id, answers, runs, pastes) {
    const c = career(user);
    if (!c.active || c.active.id !== id) return { error: 'Assessment not found or already submitted.', status: 404 };
    if (!c.active.choice_nonce) { deliver(c.active); return { error: 'This assessment was updated securely. Reload to resume; your saved answers are preserved.', status: 409 }; }
    if (Date.parse(c.active.expires_at) + config().time_grace_sec * 1000 < now().getTime()) return { error: 'Time is up for this assessment. Submit to see your results.', status: 409 };
    writeCareer(user, { ...c, active: { ...c.active, answers: { ...c.active.answers, ...cleanAnswers(c.active, answers) }, runs: { ...(c.active.runs || {}), ...cleanRuns(c.active, runs) }, pastes: mergeMax(c.active.pastes, cleanPastes(c.active, pastes)), saved_at: iso() } });
    return { ok: true };
  }
  const mergeMax = (a = {}, b = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = Math.max(o[k] || 0, v); return o; };
  function finalize(user, id, answers, { expired = false, runs = {}, pastes = {} } = {}) {
    const c = career(user), a = c.active;
    const cfg = a.rules || config();
    const late = Date.parse(a.expires_at) + cfg.time_grace_sec * 1000 < now().getTime();
    // After the deadline only the answers autosaved in time count.
    const final = late || expired ? a.answers : { ...a.answers, ...cleanAnswers(a, answers) };
    const result = E.scoreAttempt(a.questions, final, cfg);
    const ran = late || expired ? (a.runs || {}) : { ...(a.runs || {}), ...cleanRuns(a, runs) };
    for (const r of result.responses) if (r.grading === 'review' && ran[r.id] && r.answered) r.run_output = ran[r.id];
    // Blocked paste attempts: an integrity signal for reviewers, never a score change on its own.
    const pasted = mergeMax(a.pastes, cleanPastes(a, pastes));
    for (const r of result.responses) if (pasted[r.id]) r.paste_attempts = pasted[r.id];
    const record = {
      id: a.id, assessment: a.assessment, title: a.title, track: a.track, skill: a.skill, status: 'submitted',
      started_at: a.started_at, submitted_at: iso(), late: late || expired, config_version: a.config_version, weights: a.weights || null, result,
      mode: a.mode || 'full', skill_versions: Object.fromEntries(Object.keys(result.skills).map((id) => [id, skill(id)?.version || 1])),
    };
    writeCareer(user, { ...c, active: null, attempts: [...c.attempts, record] });
    refreshEnrollments(user); // new evidence can change every roadmap's recommendations
    return record;
  }
  /** Submit - idempotent: re-sending the same attempt id returns the stored result. */
  function submitAttempt(user, id, answers, runs, pastes) {
    if (!isLearner(user)) return { error: 'Assessments are for learner accounts.', status: 403 };
    const c = career(user);
    const done = c.attempts.find((x) => x.id === id);
    if (done) return { attempt: done, existing: true };
    if (!c.active || c.active.id !== id) return { error: 'Assessment not found.', status: 404 };
    if (!c.active.choice_nonce) { deliver(c.active); return { error: 'This assessment was updated securely. Reload to resume; your saved answers are preserved.', status: 409 }; }
    return { attempt: finalize(user, id, answers, { runs, pastes }) };
  }
  function abandonAttempt(user, id) {
    const c = career(user);
    if (!c.active || c.active.id !== id) return { error: 'Assessment not found.', status: 404 };
    writeCareer(user, { ...c, active: { ...c.active, expires_at: new Date(0).toISOString() } });
    return { attempt: finalize(user, id, {}, { expired: true }) };
  }
  /** Review after submission: the student's answers next to the key and explanations. */
  function attemptReview(user, id) {
    const a = career(user).attempts.find((x) => x.id === id); if (!a) return null;
    return a.result.responses.map((r) => {
      const q = questionVersion(r.id, r.v), reviewed = r.grading === 'review';
      return { id: r.id, type: r.type, category: r.category, grading: r.grading, correct: r.correct, answered: r.answered, pending: !!r.pending, earned: r.earned, points: r.points, skill: skill(r.skills[0])?.name,
        prompt: q?.prompt, code: q?.code,
        // Reviewed items: the student's own answer, the rubric, and - only once a human has reviewed it - the outcome and the reference answer.
        answer: reviewed ? r.answer || '' : undefined, run_output: reviewed ? r.run_output || null : undefined, rubric: reviewed ? q?.rubric || [] : undefined,
        review: reviewed && r.review ? { criteria: r.review.criteria, comment: r.review.comment, reviewed_at: r.review.at, reviewer_role: r.review.role } : null,
        explanation: null };
    });
  }
  function questionVersion(id, v) {
    const cur = questionById(id); if (cur && cur.version === v) return cur;
    return (qstate().history[id] || []).find((h) => h.version === v) || cur;
  }

  /* ------------------------------ staff review ------------------------------ */
  /**
   * Written explanations and practical submissions are scored by a person
   * against the question's rubric. An optional AI suggestion can be requested
   * and is shown to the reviewer as UNVERIFIED; it never changes a score. The
   * attempt's totals are rebuilt (engine.summarize) once a review is saved.
   */
  const isReviewer = (u) => REVIEWER_ROLES.includes(u?.role);
  function findResponse(uid, attemptId, qid) {
    const u = store.Users.byId(uid); if (!u) return null;
    const c = career(u), a = c.attempts.find((x) => x.id === attemptId); if (!a) return null;
    const r = a.result.responses.find((x) => x.id === qid && x.grading === 'review'); if (!r) return null;
    return { u, c, a, r };
  }
  function reviewQueue({ status = 'pending' } = {}) {
    const out = [];
    for (const u of data().users) {
      if (!u.profile?.career) continue;
      for (const a of career(u).attempts) for (const r of a.result.responses) {
        if (r.grading !== 'review' || !r.answered) continue;
        if (status === 'pending' ? !r.pending : r.pending) continue;
        const q = questionVersion(r.id, r.v);
        out.push({ user_id: u.id, student: u.name || 'Learner #' + u.id, reg_no: u.reg_no || null, attempt_id: a.id, assessment: a.title, submitted_at: a.submitted_at,
          question_id: r.id, type: r.type, category: r.category, skill: skill(r.skills[0])?.name, prompt: q?.prompt, code: q?.code, rubric: q?.rubric || [], model_answer: q?.model_answer || null,
          answer: r.answer || '', paste_attempts: r.paste_attempts || 0, run_output: r.run_output || null, run_lang: q?.run_lang || null, points: r.points, ai_suggestion: r.ai_suggestion || null, review: r.review || null });
      }
    }
    return out.sort((x, y) => String(x.submitted_at).localeCompare(String(y.submitted_at)));
  }
  async function suggestReview(reviewer, uid, attemptId, qid) {
    if (!isReviewer(reviewer)) return { error: 'Only staff reviewers can request suggestions.', status: 403 };
    if (!aiSuggest) return { error: 'AI suggestions are not configured on this server. Review using the rubric.', status: 503 };
    const f = findResponse(uid, attemptId, qid); if (!f) return { error: 'Response not found.', status: 404 };
    const q = questionVersion(f.r.id, f.r.v);
    let s;
    try { s = await aiSuggest(reviewer.id, { prompt: q.prompt, rubric: q.rubric, model_answer: q.model_answer, answer: f.r.answer, kind: f.r.type }); }
    catch (e) { return { error: 'AI suggestion failed: ' + e.message, status: 502 }; }
    f.r.ai_suggestion = { ...s, verified: false, requested_by: reviewer.id, at: iso() };
    writeCareer(f.u, { ...f.c });
    return { suggestion: f.r.ai_suggestion };
  }
  /** Save a human review: points per rubric criterion (each within its maximum) and a comment for the student. */
  function submitReview(reviewer, uid, attemptId, qid, body) {
    if (!isReviewer(reviewer)) return { error: 'Only staff reviewers can score answers.', status: 403 };
    const f = findResponse(uid, attemptId, qid); if (!f) return { error: 'Response not found.', status: 404 };
    const q = questionVersion(f.r.id, f.r.v), rubric = q?.rubric || [];
    const given = [].concat(body?.criteria || []);
    if (given.length !== rubric.length) return { error: 'Score every rubric criterion.' };
    const criteria = rubric.map((c, i) => {
      const pts = Number(given[i]?.points);
      return { criterion: c.criterion, max: c.points, points: pts, note: String(given[i]?.note || '').slice(0, 300) };
    });
    if (criteria.some((c) => !Number.isFinite(c.points) || c.points < 0 || c.points > c.max)) return { error: 'Each criterion score must be between 0 and its maximum.' };
    const comment = String(body?.comment || '').trim().slice(0, 2000);
    if (comment.length < 10) return { error: 'Write feedback for the student (at least a sentence).' };
    const awarded = criteria.reduce((a, c) => a + c.points, 0), max = criteria.reduce((a, c) => a + c.max, 0);
    const prior = f.r.review ? { ...f.r.review } : null;
    f.r.earned = +(f.r.points * (max ? awarded / max : 0)).toFixed(3);
    f.r.correct = max ? awarded / max >= 0.7 : false;
    f.r.pending = false;
    f.r.review = { criteria, comment, awarded, max, by: reviewer.id, role: reviewer.role, at: iso(),
      ai_assisted: !!(f.r.ai_suggestion && body?.used_ai_suggestion), previous: prior ? { awarded: prior.awarded, at: prior.at, by: prior.by } : null };
    f.a.result = E.summarize(f.a.result.responses, config());
    writeCareer(f.u, { ...f.c });
    refreshEnrollments(f.u);
    audit(reviewer.id, prior ? 'career_review_update' : 'career_review', 'career_attempt', attemptId, { user_id: uid, question: qid, awarded, max, ai_assisted: f.r.review.ai_assisted });
    // Tell the student once the last pending answer in the attempt is reviewed (not once per item).
    if (notify && f.u.email && !prior && !f.a.result.pending) {
      const first = String(f.u.name || '').trim().split(/\s+/)[0] || 'there';
      Promise.resolve().then(() => notify(f.u.email, `Your ${f.a.title} has been reviewed`,
        `Hi ${first},\n\nEchoLens staff have finished reviewing your written and practical answers for "${f.a.title}". Your skill report and roadmap now include them.\n\nSee your results and the reviewer's feedback: ${appUrl}/career#result/${encodeURIComponent(f.a.id)}\n\nThese scores guide your learning; they are not an official qualification.\n\n- EchoLens`))
        .catch(() => { /* a failed email never undoes a saved review */ });
    }
    return { response: { id: f.r.id, earned: f.r.earned, review: f.r.review }, attempt: summary(f.a) };
  }

  /* -------------------------------- resources -------------------------------- */
  const catalogue = () => new Map(store.publicCatalogue().filter((c) => c.track_key).map((c) => [c.track_key, c]));
  /** Validated module references for a skill; anything unresolvable is a content gap, never a link. */
  function resources(skillId, uid) {
    const cat = catalogue(), subs = uid ? data().open_submissions.filter((s) => s.user_id === Number(uid)) : [];
    return (skill(skillId)?.resources || []).map((r) => {
      const def = store.Quests.trackDef(r.track), entry = cat.get(r.track), lvl = def && def.levels.find((l) => l.no === r.level);
      if (!def || !lvl || !entry || entry.available === false) return null;
      const problems = (lvl.problems || []).filter((p) => p.required !== false && p.optional !== true);
      const passMark = (p) => Number(p.pass_mark ?? def.pass_mark ?? 60);
      const completed = !!problems.length && problems.every((p) => subs.some((s) => s.track_key === r.track && s.level === r.level && s.pid === p.pid && s.score != null && s.score >= passMark(p)));
      const video = !!(lvl.resource_url || lvl.video_url || lvl.videos?.length);
      if (!video && !problems.length) return null;
      return { track_key: r.track, level: r.level, title: lvl.title, course: entry.title, course_code: entry.code, tasks: problems.length, completed,
        url: `/open#course/${encodeURIComponent(r.track)}/lesson/${r.level}${video ? '' : '/practice/' + problems[0].pid}` };
    }).filter(Boolean);
  }
  function contentGaps() {
    const out = [];
    for (const s of SKILLS) {
      const declared = s.resources.length, resolved = resources(s.id).length;
      if (!resolved) out.push({ skill: s.id, name: s.name, group: s.group, reason: declared ? 'Mapped modules are no longer available' : 'No EchoLens module teaches this skill yet', tracks: TRACKS.filter((t) => t.skills.some((x) => x.skill === s.id)).map((t) => t.title) });
    }
    return out;
  }

  /* ----------------------------- shared skill profile ----------------------------- */
  /**
   * One record per skill for this student, independent of any roadmap, with
   * proficiency, evidence type, assessment version, last assessed date,
   * coverage and verification status (roadmaps.skillRecord).
   */
  function skillRecords(user, profile = E.skillProfile(career(user).attempts)) {
    const cfg = config(), nowMs = now().getTime(), band = (v) => E.band(v, cfg);
    return Object.entries(profile).filter(([, e]) => e.score != null || e.by_category)
      .map(([id, e]) => ({ ...R.skillRecord(user.id, id, e, { validDays: cfg.skill_valid_days, nowMs, band, skillVersion: skill(id)?.version }), name: skill(id)?.name || id, group: skill(id)?.group || null })).concat(curriculumService.sharedSkills(user));
  }
  /**
   * The shared profile as seen by ONE roadmap: a skill's evidence counts only
   * when it is reusable at this roadmap's required depth and definition
   * version. Otherwise it is marked insufficient ("Needs Further Assessment")
   * for this roadmap, even if it served another roadmap well.
   */
  function trackProfile(user, t, profile = E.skillProfile(career(user).attempts)) {
    const records = new Map(skillRecords(user, profile).map((r) => [r.skill_id, r]));
    const out = { ...profile };
    for (const sk of t.skills) {
      const e = profile[sk.skill]; if (!e) continue;
      const rr = R.reusable(records.get(sk.skill), { depth: sk.depth || 1, skillVersion: skill(sk.skill)?.version || 1 });
      out[sk.skill] = rr.ok ? { ...e, reuse_reason: 'verified' } : { ...e, evidence: e.score == null ? e.evidence : 'insufficient', reuse_reason: rr.reason };
    }
    return out;
  }
  /** Which skills a track test should ask about: in 'gap' mode only those not reusable for this roadmap. */
  function trackPlan(user, slug, mode) {
    const t = track(slug), def = assessmentDef(slug); if (!t || !def) return {};
    const tp = mode === 'gap' ? trackProfile(user, t) : null;
    const todo = t.skills.filter((sk) => def.plan[sk.skill] && !(tp && tp[sk.skill]?.reuse_reason === 'verified'));
    // A gap test still aims for min_form_items MCQs, spread over the skills left
    // to verify (at most 8 per skill, so only a test with very few skills left is shorter).
    const per = Math.min(8, Math.max(...todo.map((sk) => def.plan[sk.skill]), Math.ceil(config().min_form_items / Math.max(1, todo.length))));
    const plan = {};
    for (const sk of todo) plan[sk.skill] = { n: tp ? per : def.plan[sk.skill], depth: sk.depth || 0 };
    return plan;
  }
  /** Is there a recent, valid common CS result? The common test is required only when there is not. */
  function commonStatus(user) {
    const cfg = config(), last = career(user).attempts.filter((a) => a.assessment === 'common' && a.status === 'submitted').pop();
    if (!last) return { valid: false, reason: 'not_taken' };
    const ageDays = (now().getTime() - Date.parse(last.submitted_at)) / 86400e3;
    const enough = Object.values(last.result.skills).some((e) => e.evidence === 'sufficient');
    if (!enough) return { valid: false, reason: 'insufficient', at: last.submitted_at };
    if (ageDays > cfg.common_valid_days) return { valid: false, reason: 'expired', at: last.submitted_at };
    return { valid: true, at: last.submitted_at, valid_until: new Date(Date.parse(last.submitted_at) + cfg.common_valid_days * 86400e3).toISOString() };
  }

  /* ------------------------------- roadmap enrollments ------------------------------- */
  /** The student's enrollments. Students from before multi-roadmap support get their preferred track as Primary. */
  function enrollments(user) {
    const c = career(user);
    if (c.enrollments) return c.enrollments;
    const legacy = c.preferences?.preferred_track && track(c.preferences.preferred_track) ? c.preferences.preferred_track : null;
    if (!legacy || !isLearner(user)) return [];
    const out = R.enroll([], legacy, { max: config().max_active_roadmaps, at: iso(), primary: true, id: 'en_' + crypto.randomBytes(6).toString('hex') });
    writeCareer(user, { ...c, enrollments: out.list });
    return out.list;
  }
  const enrollmentFor = (user, slug) => enrollments(user).find((e) => e.track === slug && e.status !== 'archived') || null;
  /**
   * Run one enrollment change. Everything between reading the list and writing
   * it back is synchronous, so concurrent requests are serialised by the event
   * loop and see each other's results; the change is validated against the
   * invariants (roadmaps.apply) and written all-or-nothing.
   */
  function changeEnrollments(user, op, slug, opts = {}) {
    if (!isLearner(user)) return { error: 'Roadmaps are for learner accounts.', status: 403 };
    if (!track(slug) || (op === 'enroll' && track(slug).status !== 'published')) return { error: 'Career track not found.', status: 404 };
    const c = career(user), before = enrollments(user);
    const out = R[op](before, slug, { max: config().max_active_roadmaps, at: iso(), id: 'en_' + crypto.randomBytes(6).toString('hex'), ...opts });
    if (out.error) return { error: out.error, status: /at most/.test(out.error) ? 409 : /do not follow/.test(out.error) ? 404 : 409 };
    const primary = R.primaryOf(out.list);
    // preferences.preferred_track mirrors the Primary roadmap for older screens.
    const prefs = { ...(career(user).preferences || {}), preferred_track: primary ? primary.track : null };
    if (primary && primary.track !== c.preferences?.preferred_track) prefs.track_history = [...(c.preferences?.track_history || []), { track: primary.track, at: iso() }];
    const targets = { ...c.target_roles };
    const previousRole = curriculumService.allRoles().find(r => r.id === c.target_role);
    if (previousRole) targets[previousRole.track] = previousRole.id;
    writeCareer(user, { ...career(user), preferences: prefs, enrollments: out.list, target_roles: targets, target_role: primary ? targets[primary.track] || null : null });
    refreshEnrollments(user);
    return { roadmaps: listEnrollments(user) };
  }
  const enrollTrack = (user, slug, { primary = false } = {}) => changeEnrollments(user, 'enroll', slug, { primary });
  /**
   * What a newly added roadmap needs: is the common CS test still required,
   * which of its skills reuse verified evidence, and which must be assessed.
   */
  function enrollmentAdvice(user, slug) {
    const t = track(slug); if (!t) return null;
    const tp = trackProfile(user, t), common = commonStatus(user);
    const reused = [], needed = [];
    for (const sk of t.skills) {
      const why = tp[sk.skill]?.reuse_reason || 'not_assessed';
      (why === 'verified' ? reused : needed).push({ skill: sk.skill, name: skill(sk.skill)?.name || sk.skill, reason: why, reason_text: R.REUSE_TEXT[why] });
    }
    return { common_required: !common.valid, common, reused, needed,
      next: !common.valid ? { label: 'Take the common CS test', href: '#assess/common' }
        : needed.length ? { label: `Assess the ${needed.length} skill${needed.length === 1 ? '' : 's'} not yet verified`, href: '#assess/' + slug } : { label: 'Open your roadmap', href: '#roadmap/' + slug } };
  }
  const makePrimary = (user, slug) => changeEnrollments(user, 'setPrimary', slug);
  const pauseTrack = (user, slug) => changeEnrollments(user, 'pause', slug);
  function resumeTrack(user, slug, { primary = false } = {}) {
    const out = changeEnrollments(user, 'resume', slug);
    return out.error || !primary ? out : makePrimary(user, slug);
  }
  const archiveTrack = (user, slug) => changeEnrollments(user, 'archive', slug);

  /**
   * Progress for one enrollment. Completed modules and projects are REAL
   * learning activities (passed course tasks, submitted project links). Skills
   * shown elsewhere can satisfy a stage's prerequisite check, but they never
   * mark a module as completed - there are no exemption rules yet.
   */
  function progressFor(user, slug, profile, common) {
    const t = track(slug), cfg = config();
    const tp = trackProfile(user, t, profile);
    const resolve = (id) => resources(id, user.id);
    const rm = E.roadmap(t, tp, resolve, { stageNames: STAGE_NAMES, projects: career(user).projects[slug] || {} }, cfg);
    const readiness = E.trackReadiness(t, tp, cfg);
    const modules = new Map();
    for (const st of rm.stages) for (const m of st.modules) modules.set(m.track_key + ':' + m.level, m);
    const completedModules = [...modules.values()].filter((m) => m.completed).map((m) => ({ track_key: m.track_key, level: m.level, title: m.title, course: m.course }));
    const projects = career(user).projects[slug] || {};
    const completedProjects = Object.keys(projects).map(Number).sort();
    const total = modules.size + 2; // modules plus the capstone and career-readiness projects
    const done = completedModules.length + completedProjects.filter((n) => n >= 5).length;
    const toAssess = Object.keys(trackPlan(user, slug, 'gap'));
    const pending = career(user).attempts.filter((a) => a.track === slug && a.result?.pending).length;
    const assessment_status = !common.valid ? { state: 'common_required', label: common.reason === 'expired' ? 'Your common CS test result has expired. Please retake it' : 'Take the common CS test first' }
      : pending ? { state: 'pending_review', label: `${pending} assessment${pending === 1 ? '' : 's'} awaiting staff review` }
        : toAssess.length ? { state: 'skills_to_assess', label: `${toAssess.length} skill${toAssess.length === 1 ? '' : 's'} not yet verified for this roadmap`, skills: toAssess }
          : { state: 'up_to_date', label: 'All assessable skills verified' };
    const gaps = E.skillGaps(t, tp, resolve, cfg);
    const firstGap = gaps.find((g) => g.score != null && g.evidence === 'sufficient');
    const next = assessment_status.state === 'common_required' ? { kind: 'assess', label: 'Take the common CS test', href: '#assess/common' }
      : assessment_status.state === 'skills_to_assess' ? { kind: 'assess', label: `Assess ${toAssess.length} remaining skill${toAssess.length === 1 ? '' : 's'}`, href: '#assess/' + slug }
        : firstGap ? (firstGap.resources.find((m) => !m.completed)
          ? { kind: 'learn', label: `${skill(firstGap.skill)?.name}: ${firstGap.resources.find((m) => !m.completed).title}`, href: firstGap.resources.find((m) => !m.completed).url }
          : { kind: 'reassess', label: `Reassess ${skill(firstGap.skill)?.name}`, href: '#assess/skill:' + firstGap.skill })
          : rm.starting_stage ? { kind: 'project', label: `Stage ${rm.starting_stage}: ${rm.stages[rm.starting_stage - 1].projects[0]}`, href: '#roadmap/' + slug }
            : { kind: 'done', label: 'Roadmap complete. Keep your portfolio fresh', href: '#roadmap/' + slug };
    return {
      current_stage: rm.starting_stage, stage_name: rm.starting_stage ? STAGE_NAMES[rm.starting_stage - 1] : 'Complete',
      stages_completed: rm.stages.filter((st) => st.status === 'completed').length,
      completed_modules: completedModules, completed_projects: completedProjects,
      completion_pct: total ? Math.round((done / total) * 100) : 0,
      level: readiness.level, score: readiness.score, assessment_status, next_activity: next, updated_at: iso(),
    };
  }
  /** Recompute progress snapshots for active and paused roadmaps (archived ones keep their last snapshot). */
  function refreshEnrollments(user) {
    const list = enrollments(user); if (!list.length) return;
    const profile = E.skillProfile(career(user).attempts), common = commonStatus(user);
    const same = (a, b) => JSON.stringify({ ...(a || {}), updated_at: 0 }) === JSON.stringify({ ...(b || {}), updated_at: 0 });
    let changed = false;
    const next = list.map((e) => {
      if (e.status === 'archived') return e;
      const progress = progressFor(user, e.track, profile, common);
      if (same(progress, e.progress)) return e;
      changed = true; return { ...e, progress };
    });
    // Only write when something actually changed, so page views do not rewrite the store.
    if (changed) writeCareer(user, { ...career(user), enrollments: next });
  }
  function publicEnrollment(user, e) {
    if (!e) return null;
    const t = track(e.track);
    return { id: e.id, track: e.track, title: t?.title || e.track, status: e.status, primary: !!e.primary, enrolled_at: e.enrolled_at, updated_at: e.updated_at,
      archived_at: e.archived_at || null, progress: e.progress, history: (e.history || []).slice(-10) };
  }
  function listEnrollments(user, { refresh = true } = {}) {
    if (refresh) refreshEnrollments(user);
    const list = enrollments(user).map((e) => publicEnrollment(user, e));
    const order = { active: 0, paused: 1, archived: 2 };
    list.sort((a, b) => (b.primary - a.primary) || (order[a.status] - order[b.status]) || String(a.enrolled_at).localeCompare(String(b.enrolled_at)));
    return { enrollments: list, primary: list.find((e) => e.primary) || null, max_active: config().max_active_roadmaps,
      active_count: list.filter((e) => e.status === 'active').length, common: commonStatus(user) };
  }

  /* ------------------------------- career discovery ------------------------------- */
  /**
   * The first-run journey: welcome, five optional questions, a short
   * beginner-friendly quiz, and transparent track suggestions. The quiz is a
   * screening tool only: its result is stored under career.discovery, never
   * as an assessment attempt, so it does not enter the verified skill profile
   * or count as evidence for any roadmap.
   *
   * Guests can do all of it without an account. The server signs the quiz
   * form and the graded result (HMAC); a guest who later signs in can attach
   * that signed result to their account, and nothing unsigned is trusted.
   */
  const DISCOVERY_PLAN = { 'disc.computing': 2, 'disc.logic': 2, 'disc.variables': 1, 'disc.control': 2, 'disc.algorithms': 1, 'disc.data': 1, 'disc.web': 2, 'disc.software': 1 };
  const DISCOVERY_FORM_TTL = 3 * 3600e3, DISCOVERY_RESULT_TTL = 60 * 86400e3;
  function signToken(payload) {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return body + '.' + crypto.createHmac('sha256', SIGNING_KEY).update('career-discovery:' + body).digest('base64url');
  }
  function readToken(token, kind, ttl) {
    const [body, mac] = String(token || '').split('.');
    if (!body || !mac) return null;
    const want = crypto.createHmac('sha256', SIGNING_KEY).update('career-discovery:' + body).digest();
    const got = Buffer.from(mac, 'base64url');
    if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
    let p; try { p = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
    if (!p || p.k !== kind || typeof p.iat !== 'number' || now().getTime() - p.iat > ttl) return null;
    return p;
  }
  function discoveryConfig() {
    const o = settings().career_discovery_config;
    return o ? { ...D.DEFAULT_CONFIG, ...o, weights: { ...D.DEFAULT_CONFIG.weights, ...(o.weights || {}) } } : { ...D.DEFAULT_CONFIG };
  }
  function updateDiscoveryConfig(patch, actorId) {
    const cur = discoveryConfig(), { version, updated_at, updated_by, ...rest } = { ...cur, ...(patch || {}) };
    const v = D.validateConfig(rest, TRACKS.map((t) => t.slug));
    if (v.error) return { error: v.error, status: 400 };
    const next = { ...v.config, version: (cur.version || 1) + 1, updated_at: iso(), updated_by: actorId || null };
    settings().career_discovery_config = next; save();
    audit(actorId, 'career_discovery_config_update', 'career_discovery_config', next.version, { keys: Object.keys(patch || {}) });
    return { config: next };
  }
  function resetDiscoveryConfig(actorId) {
    const cur = discoveryConfig();
    settings().career_discovery_config = { ...D.DEFAULT_CONFIG, version: (cur.version || 1) + 1, updated_at: iso(), updated_by: actorId || null }; save();
    audit(actorId, 'career_discovery_config_reset', 'career_discovery_config', settings().career_discovery_config.version, {});
    return { config: settings().career_discovery_config };
  }
  const discoveryTracks = () => tracks().filter((t) => t.status === 'published')
    .map((t) => ({ slug: t.slug, title: t.title, overview: t.overview, job_roles: curriculumService.allRoles().filter(r => r.track === t.slug).map(r => ({ id: r.id, title: r.title })),
      duration: t.duration, suitability: t.suitability, first_skills: (t.stages[0]?.skills || []).map((id) => skill(id)?.name).filter(Boolean) }));
  /** Everything the public discovery pages need. */
  function discoveryInfo() {
    const cfg = discoveryConfig();
    return { enabled: cfg.enabled !== false, questions: D.QUESTIONS.map((q) => ({ id: q.id, title: q.title, hint: q.hint, multi: q.multi, options: q.options.map(([id, text]) => ({ id, text })) })),
      tracks: discoveryTracks(), quiz: { items: Object.values(DISCOVERY_PLAN).reduce((a, b) => a + b, 0), minutes: 6, available: quizCoverageOk() } };
  }
  function quizCoverageOk() {
    const pool = published('discovery');
    return Object.entries(DISCOVERY_PLAN).every(([sk, n]) => pool.filter((q) => q.skills[0] === sk && q.options.length).length >= n);
  }
  /** A learner's discovery record, and whether to show the welcome automatically (only to people with no career activity yet). */
  function discoveryState(user) {
    const c = career(user), d = c.discovery;
    const busy = !!(c.preferences || c.attempts.length || (c.enrollments || []).length || c.st?.attempts?.length ||
      user.profile?.free_course_enrollments?.length || (data().enrollments || []).some(e => e.user_id === user.id) ||
      (data().open_submissions || []).some(e => e.user_id === user.id));
    return { enabled: discoveryConfig().enabled !== false, show_welcome: discoveryConfig().enabled !== false && isLearner(user) && !d && !busy,
      discovery: d ? publicDiscovery(d) : null };
  }
  function publicDiscovery(d) {
    return { answers: d.answers || {}, step: d.step || 0, started_at: d.started_at || null, completed_at: d.completed_at || null, dismissed_at: d.dismissed_at || null,
      quiz: d.quiz ? publicQuizResult(d.quiz) : null, chosen_track: d.chosen_track || null, chosen_recommended: d.chosen_recommended ?? null,
      active_quiz: d.active && now().getTime() - Date.parse(d.active.at) < DISCOVERY_FORM_TTL ? { token: d.active.token } : null };
  }
  function writeDiscovery(user, patch) {
    const c = career(user), d = { ...(c.discovery || {}), ...patch, updated_at: iso() };
    if (!d.started_at) d.started_at = iso();
    writeCareer(user, { ...c, discovery: d });
    return d;
  }
  /** Save onboarding answers / progress. Everything is optional. */
  function saveDiscovery(user, b = {}) {
    if (b.expected_user_id != null && String(b.expected_user_id) !== String(user?.id)) return { error: 'Your signed-in account changed. Reload before saving.', status: 409 };
    if (!isLearner(user)) return { error: 'Career Discovery is for learner accounts.', status: 403 };
    if (discoveryConfig().enabled === false) return { error: 'Career Discovery is not available right now.', status: 404 };
    const cur = career(user).discovery || {}, patch = {};
    if (b.answers !== undefined) patch.answers = D.cleanAnswers({ ...(cur.answers || {}), ...(b.answers || {}) });
    if (b.replace_answers) patch.answers = D.cleanAnswers(b.answers || {});
    if (b.step !== undefined) patch.step = Math.max(0, Math.min(10, Math.round(Number(b.step) || 0)));
    if (b.dismissed) patch.dismissed_at = iso();
    if (b.completed) patch.completed_at = iso();
    if (b.chosen_track !== undefined) {
      if (!track(b.chosen_track)) return { error: 'Career track not found.', status: 404 };
      const recs = discoveryRecommendations(user).recommendations.map((r) => r.slug);
      patch.chosen_track = b.chosen_track; patch.chosen_recommended = recs.includes(b.chosen_track); patch.chosen_at = iso();
    }
    writeDiscovery(user, patch);
    return { discovery: publicDiscovery(career(user).discovery) };
  }
  /** Start the discovery quiz. Works for guests (user = null). */
  function startDiscoveryQuiz(user) {
    if (discoveryConfig().enabled === false) return { error: 'Career Discovery is not available right now.', status: 404 };
    if (user && !isLearner(user)) return { error: 'Career Discovery is for learner accounts.', status: 403 };
    const pool = published('discovery').filter((q) => q.options.length);
    if (!quizCoverageOk()) return { error: 'The discovery quiz is not available yet.', status: 409 };
    const seen = new Set(user ? (career(user).discovery?.quiz?.responses || []).map((r) => r.id) : []);
    const form = E.assembleForm({ pool, plan: DISCOVERY_PLAN, seen, seed: crypto.randomInt(1, 2 ** 31) });
    const byId = new Map(pool.map((q) => [q.id, q]));
    const items = form.items.map((it) => [it.id, it.version, it.order]);
    const nonce = crypto.randomBytes(9).toString('base64url');
    const token = signToken({ k: 'dq', items, iat: now().getTime(), n: nonce, u: user ? user.id : null });
    if (user) writeDiscovery(user, { active: { token, at: iso() } });
    return { token, minutes: 6, questions: form.items.map((it) => publicQuestion(byId.get(it.id), it.order, nonce)) };
  }
  /** Rebuild the public questions of a signed form (to resume a quiz). */
  function resumeDiscoveryQuiz(token) {
    const p = readToken(token, 'dq', DISCOVERY_FORM_TTL); if (!p) return { error: 'This quiz has expired. Please start a new one.', status: 410 };
    const qs = p.items.map(([id, , order]) => { const q = questionById(id); return q ? publicQuestion(q, order, p.n) : null; });
    if (qs.some((q) => !q)) return { error: 'This quiz has changed. Please start a new one.', status: 409 };
    return { token, minutes: 6, questions: qs };
  }
  const areaLevel = (score) => (score == null ? 'skipped' : score >= 70 ? 'strong' : score >= 40 ? 'developing' : 'new');
  const AREA_TEXT = { strong: 'You already know a good amount here.', developing: 'You know some of this. A little practice will help.', new: 'New to you, and a great place to start.', skipped: 'You skipped these questions, which is fine.' };
  function publicQuizResult(r) {
    return { id: r.id, at: r.at, score: r.score, answered: r.answered, total: r.total, starting_point: r.starting_point,
      areas: Object.fromEntries(Object.entries(r.areas).map(([k, v]) => [k, { ...v, message: AREA_TEXT[v.level] }])) };
  }
  /** Grade a discovery quiz. Works for guests; a signed-in learner's result is saved (once per form). */
  function submitDiscoveryQuiz(user, token, answers = {}, onboarding = null) {
    const p = readToken(token, 'dq', DISCOVERY_FORM_TTL);
    if (!p) return { error: 'This quiz has expired or is not valid. Please start a new one.', status: 410 };
    if (p.u && (!user || user.id !== p.u)) return { error: 'This quiz belongs to another account.', status: 403 };
    if (user && !isLearner(user)) return { error: 'Career Discovery is for learner accounts.', status: 403 };
    const prev = user ? career(user).discovery?.quiz : null;
    if (prev && prev.id === p.n) return { ...discoveryOutcome(user, null, prev), duplicate: true };
    const responses = [], areas = {};
    for (const [id, version] of p.items) {
      const q = questionById(id);
      if (!q || q.version !== version) return { error: 'A question changed while you were taking the quiz. Please start a new one.', status: 409 };
      const g = E.gradeResponse(q, decodeChoice(q, p.n, answers ? answers[id] : null)), sk = q.skills[0];
      const a = areas[sk] || (areas[sk] = { name: skill(sk)?.name || sk, total: 0, answered: 0, correct: 0, earned: 0, possible: 0 });
      a.total++;
      if (g.answered) { a.answered++; a.possible += q.points; a.earned += g.earned; if (g.correct) a.correct++; }
      responses.push({ id, version, answer: g.answered ? decodeChoice(q, p.n, answers[id]) : null, answered: g.answered, correct: g.correct });
    }
    let earned = 0, possible = 0;
    for (const a of Object.values(areas)) { earned += a.earned; possible += a.possible; a.score = a.possible ? Math.round((a.earned / a.possible) * 100) : null; a.level = areaLevel(a.score); delete a.earned; delete a.possible; }
    const answered = responses.filter((r) => r.answered).length;
    const score = possible ? Math.round((earned / possible) * 100) : null;
    const result = { id: p.n, at: iso(), score, answered, total: responses.length, areas, responses, bank_version: 'discovery-v1' };
    result.starting_point = D.startingPoint(result, D.cleanAnswers(onboarding || career(user || {}).discovery?.answers || {}));
    if (user) {
      const hist = [...(career(user).discovery?.quiz_history || []), ...(prev ? [{ id: prev.id, at: prev.at, score: prev.score }] : [])].slice(-10);
      writeDiscovery(user, { quiz: result, quiz_history: hist, active: null, completed_at: career(user).discovery?.completed_at || iso() });
    }
    return discoveryOutcome(user, onboarding, result);
  }
  /** Graded result + per-question review + recommendations + a signed result a guest can claim later. */
  function discoveryOutcome(user, onboarding, result) {
    const review = result.responses.map((r) => {
      const q = questionById(r.id); if (!q) return null;
      const chosen = q.options.find((o) => o.id === String(r.answer));
      return { id: r.id, prompt: q.prompt, code: q.code, area: skill(q.skills[0])?.name, answered: r.answered, correct: r.correct,
        your_answer: chosen ? chosen.text : null, correct_answer: q.options.filter((o) => q.answer.includes(o.id)).map((o) => o.text).join(', '), explanation: q.explanation };
    }).filter(Boolean);
    const answersForRecs = onboarding ? D.cleanAnswers(onboarding) : D.cleanAnswers(user ? career(user).discovery?.answers || {} : {});
    const recs = D.recommend(answersForRecs, result, discoveryTracks(), discoveryConfig());
    const { responses, ...summary } = result;
    return { result: publicQuizResult(result), review, ...recs,
      result_token: signToken({ k: 'dr', iat: now().getTime(), result: { ...summary, responses: responses.map((r) => [r.id, r.version, r.answered ? 1 : 0, r.correct ? 1 : 0]) } }) };
  }
  /** Recommendations for a learner (stored answers and quiz) or a guest (answers + signed result). */
  function discoveryRecommendations(user, { answers, result_token } = {}) {
    let quiz = null;
    if (user) quiz = career(user).discovery?.quiz || null;
    else if (result_token) { const p = readToken(result_token, 'dr', DISCOVERY_RESULT_TTL); if (p) quiz = p.result; }
    const a = user && answers === undefined ? career(user).discovery?.answers || {} : answers || {};
    const recs = D.recommend(D.cleanAnswers(a), quiz, discoveryTracks(), discoveryConfig());
    return { ...recs, quiz: quiz ? publicQuizResult({ ...quiz, responses: [] }) : null };
  }
  /** After signing in: keep the guest's answers and (verified) quiz result. Never overwrites a newer saved result. */
  function claimDiscovery(user, { answers, result_token, step, expected_user_id } = {}) {
    if (expected_user_id != null && String(expected_user_id) !== String(user?.id)) return { error: 'Your signed-in account changed. Reload before saving.', status: 409 };
    if (!isLearner(user)) return { error: 'Career Discovery is for learner accounts.', status: 403 };
    const cur = career(user).discovery || {}, patch = {};
    if (answers && !Object.keys(cur.answers || {}).length) patch.answers = D.cleanAnswers(answers);
    if (step !== undefined && !cur.step) patch.step = Math.max(0, Math.min(10, Math.round(Number(step) || 0)));
    if (result_token) {
      const p = readToken(result_token, 'dr', DISCOVERY_RESULT_TTL);
      if (!p) return { error: 'That quiz result has expired or is not valid.', status: 400 };
      if (!cur.quiz || Date.parse(cur.quiz.at) < Date.parse(p.result.at)) {
        const r = p.result;
        patch.quiz = { ...r, responses: (r.responses || []).map(([id, version, answered, correct]) => ({ id, version, answered: !!answered, correct: !!correct, answer: null })), claimed: true };
        patch.completed_at = cur.completed_at || iso();
      }
    }
    writeDiscovery(user, patch);
    return { discovery: publicDiscovery(career(user).discovery) };
  }
  /** Admin view: how discovery is used, and how often students choose a track that was not suggested. */
  function discoveryAnalytics() {
    const learners = data().users.filter(isLearner), ds = learners.map((u) => career(u).discovery).filter(Boolean);
    const chosen = ds.filter((d) => d.chosen_track);
    const byTrack = {};
    for (const d of chosen) byTrack[d.chosen_track] = (byTrack[d.chosen_track] || 0) + 1;
    return { started: ds.length, answered_questions: ds.filter((d) => Object.keys(d.answers || {}).length).length, took_quiz: ds.filter((d) => d.quiz).length,
      dismissed: ds.filter((d) => d.dismissed_at && !d.quiz).length, chose_track: chosen.length, chose_unrecommended: chosen.filter((d) => d.chosen_recommended === false).length,
      chosen_tracks: Object.entries(byTrack).map(([slug, n]) => ({ slug, title: track(slug)?.title || slug, learners: n })).sort((a, b) => b.learners - a.learners) };
  }

  /* --------------------------------- reports --------------------------------- */
  function report(user, slug) {
    const c = career(user), cfg = config();
    const profile = E.skillProfile(c.attempts);
    // The track asked for, else the preferred one, else the track of the latest track assessment taken.
    const lastTrackAttempt = c.attempts.filter((a) => a.status === 'submitted' && a.track).pop();
    const primary = R.primaryOf(enrollments(user));
    const chosen = track(slug || primary?.track || c.preferences?.preferred_track || lastTrackAttempt?.track || '') || null;
    const common = E.commonScore(profile, cfg);
    const resolve = (id) => resources(id, user.id);
    let readiness = null, gaps = [], plan = null;
    if (chosen) {
      // Track-specific view of the shared profile: evidence counts only where it may be reused for this roadmap.
      const tp = trackProfile(user, chosen, profile);
      readiness = E.trackReadiness(chosen, tp, cfg);
      readiness.reuse = Object.fromEntries(chosen.skills.map((sk) => [sk.skill, tp[sk.skill]?.reuse_reason || 'not_assessed']));
      readiness.skills = readiness.skills.map((s) => ({ ...s, name: skill(s.skill)?.name }));
      gaps = E.skillGaps(chosen, tp, resolve, cfg).map((g) => ({ ...g, name: skill(g.skill)?.name, recommendation: E.recommendation(g, skill(g.skill)?.name || g.skill), reassess_available: availability('skill:' + g.skill).available }));
      plan = E.roadmap(chosen, tp, resolve, { stageNames: STAGE_NAMES, projects: c.projects[chosen.slug] || {} }, cfg);
      plan.stages.forEach((st) => st.skills.forEach((s) => { s.name = skill(s.skill)?.name; }));
      readiness.explanation = readiness.explanation.map((line) => line.replace(/\b([a-z]+\.[a-z_]+)\b/g, (m) => skill(m)?.name || m));
      readiness.category_feedback = categoryFeedback(readiness.evaluation, readiness.weakest_category, cfg);
    }
    const submitted = c.attempts.filter((a) => a.status === 'submitted');
    const last = (key) => submitted.filter((a) => a.assessment === key).pop() || null;
    const pending = submitted.reduce((n, a) => n + (a.result.pending || 0), 0);
    return {
      curriculum: curriculumService.progress(user, chosen?.slug),
      pending_reviews: pending,
      disclaimer: 'Scores guide your learning and placement on EchoLens. They are provisional estimates, not an employment qualification or a psychometrically validated certification.',
      preferences: c.preferences, track: chosen ? publicTrack(chosen) : null,
      common: { ...common, category_feedback: categoryFeedback(common.evaluation, null, cfg), categories: common.categories.map((x) => ({ ...x, name: skill(x.skill)?.name, status: E.skillStatus(profile[x.skill], false, cfg) })), last_attempt: last('common') ? summary(last('common')) : null },
      readiness, gaps, roadmap: plan,
      track_attempt: chosen && last(chosen.slug) ? summary(last(chosen.slug)) : null,
      strongest: chosen ? readiness.skills.filter((s) => s.status === E.STATUS.strong).sort((a, b) => b.score - a.score).slice(0, 3) : [],
      weakest: gaps.filter((g) => g.score != null).slice(0, 3),
      critical_gaps: gaps.filter((g) => g.status === E.STATUS.critical),
      active: c.active ? { id: c.active.id, assessment: c.active.assessment, title: c.active.title, expires_at: c.active.expires_at } : null,
      assessments: { common: availability('common'), track: chosen ? availability(chosen.slug) : null },
      enrollment: chosen ? publicEnrollment(user, enrollmentFor(user, chosen.slug)) : null,
      roadmaps: listEnrollments(user),
      history_count: submitted.length,
    };
  }
  function summary(a) {
    const cats = a.result.categories || {}, w = a.weights || categoryWeights(a.track || (a.assessment === 'common' ? 'common' : 'default'));
    return { id: a.id, assessment: a.assessment, title: a.title, submitted_at: a.submitted_at, raw_score: a.result.raw_score, practical_score: a.result.practical_score,
      answered: a.result.answered, total: a.result.total, late: a.late, pending: a.result.pending || 0,
      categories: Object.fromEntries(E.CATEGORIES.map((c) => [c, { score: cats[c]?.score ?? null, answered: cats[c]?.answered || 0, weight: w[c] }])),
      overall: E.weightedOverall(Object.fromEntries(E.CATEGORIES.map((c) => [c, { score: cats[c]?.score ?? null, sufficient: (cats[c]?.answered || 0) >= 1 }])), w) };
  }
  /** Plain-language feedback per evaluation category, so students know whether the weakness is theory, coding or real-world application. */
  function categoryFeedback(evaluation, weakest, cfg) {
    const t = cfg.skill_thresholds;
    const TEXT = {
      theory: { strong: 'You understand the underlying concepts well.', mid: 'Your conceptual understanding is developing; some ideas are not yet secure.', weak: 'Conceptual understanding is the main gap: revisit the lessons and make sure you can explain each idea in your own words.', none: 'Conceptual understanding has not been assessed yet.' },
      practical: { strong: 'You can turn concepts into working code, queries or configurations.', mid: 'Your hands-on skills are developing. Practise writing and debugging code yourself.', weak: 'Practical implementation is the main gap: you need much more hands-on coding and debugging practice.', none: 'Practical skills have not been shown yet. Take an assessment with practical tasks.' },
      scenario: { strong: 'You apply your knowledge well to real-world problems.', mid: 'Applying skills to real situations is developing. Work through projects and case studies.', weak: 'Real-world application is the main gap: practise deciding and justifying what to do in realistic situations, for example through the stage projects.', none: 'Real-world problem-solving has not been assessed yet.' },
    };
    const rows = E.CATEGORIES.map((c) => {
      const e = evaluation?.[c] || {};
      const level = e.score == null || !e.sufficient ? 'none' : e.score >= t.strong ? 'strong' : e.score >= t.developing ? 'mid' : 'weak';
      return { category: c, name: E.CATEGORY_NAME[c], label: E.CATEGORY_LABEL[c], score: e.sufficient ? e.score : null, weight: e.weight, items: e.items || 0, level, message: TEXT[c][level] };
    });
    const summaryText = weakest
      ? `Your weakest area is ${weakest.label} (${weakest.score}%), compared with ${E.CATEGORY_LABEL[weakest.strongest]} (${weakest.strongest_score}%). ${TEXT[weakest.category].weak}`
      : rows.every((r) => r.level === 'strong') ? 'You are strong in theory, practical work and real-world application alike.'
        : rows.some((r) => r.level === 'none') ? 'Some evaluation areas have not been assessed yet, so the picture is incomplete.' : 'Your theory, practical and scenario results are at a similar level.';
    return { rows, summary: summaryText };
  }
  function history(user) {
    const c = career(user), sub = c.attempts.filter((a) => a.status === 'submitted');
    const skillsSeen = [...new Set(sub.flatMap((a) => Object.keys(a.result.skills)))];
    return {
      attempts: sub.slice().reverse().map(summary),
      skills: skillsSeen.map((id) => ({ skill: id, name: skill(id)?.name, history: E.skillHistory(sub, id) })).filter((x) => x.history.length),
    };
  }
  function setProject(user, slug, stageNo, link) {
    if (!isLearner(user)) return { error: 'Projects are for learner accounts.', status: 403 };
    const t = track(slug); if (!t) return { error: 'Track not found.', status: 404 };
    const n = Number(stageNo); if (!(n >= 1 && n <= 6)) return { error: 'Unknown stage.' };
    const url = String(link || '').trim();
    if (url && !/^https:\/\/[^\s<>"']{4,400}$/i.test(url)) return { error: 'Give an https:// link to your repository or live project.' };
    const c = career(user); const projects = { ...c.projects, [slug]: { ...(c.projects[slug] || {}) } };
    if (url) projects[slug][n] = { link: url, at: iso(), self_reported: true }; else delete projects[slug][n];
    writeCareer(user, { ...c, projects });
    return { projects: projects[slug] };
  }

  function publicTrack(t) {
    return { slug: t.slug, title: t.title, summary: t.summary, overview: t.overview, prerequisites: t.prerequisites, tools: t.tools, outcomes: t.outcomes,
      job_roles: curriculumService.allRoles().filter(r => r.track === t.slug).map(r => ({ id: r.id, title: r.title })),
      duration: t.duration, suitability: t.suitability, practical: t.practical, status: t.status,
      skills: t.skills.map((s) => ({ ...s, name: skill(s.skill)?.name, group: skill(s.skill)?.group })),
      stages: t.stages.map((st, i) => ({ no: i + 1, name: STAGE_NAMES[i], skills: st.skills.map((id) => ({ skill: id, name: skill(id)?.name })), projects: st.projects, criteria: st.criteria })),
      courses: [...new Set(t.skills.flatMap((s) => resources(s.skill).map((r) => r.course_code + '|' + r.course + '|' + r.track_key)))].map((x) => { const [code, title, key] = x.split('|'); return { code, title, url: `/open#course/${encodeURIComponent(key)}` }; }),
      assessment: availability(t.slug) };
  }

  /* --------------------------------- analytics --------------------------------- */
  function analytics() {
    const users = data().users.filter((u) => u.profile?.career);
    const counts = {}, gaps = {}, started = { total: 0, active: 0 };
    for (const u of users) {
      const c = career(u); if (c.active) started.active++;
      for (const a of c.attempts) { const k = a.assessment; counts[k] = counts[k] || { submitted: 0, late: 0, scores: [] }; counts[k].submitted++; if (a.late) counts[k].late++; if (a.result.raw_score != null) counts[k].scores.push(a.result.raw_score); }
      const profile = E.skillProfile(c.attempts), cfg = config();
      for (const [id, e] of Object.entries(profile)) { const st = E.skillStatus(e, false, cfg); gaps[id] = gaps[id] || { assessed: 0, weak: 0 }; gaps[id].assessed++; if (st === E.STATUS.improve) gaps[id].weak++; }
    }
    return {
      learners_with_career_data: users.length, onboarded: users.filter((u) => u.profile.career.preferences).length, in_progress: started.active,
      preferred_tracks: Object.entries(users.reduce((m, u) => { const p = u.profile.career.preferences?.preferred_track; if (p) m[p] = (m[p] || 0) + 1; return m; }, {})).map(([slug, n]) => ({ slug, title: track(slug)?.title || slug, learners: n })),
      assessments: Object.entries(counts).map(([k, v]) => ({ assessment: k, submitted: v.submitted, late_or_expired: v.late, average: v.scores.length ? Math.round(v.scores.reduce((a, b) => a + b, 0) / v.scores.length) : null })),
      skill_gaps: Object.entries(gaps).map(([id, v]) => ({ skill: id, name: skill(id)?.name, assessed: v.assessed, weak: v.weak, weak_share: +(v.weak / v.assessed).toFixed(2) })).sort((a, b) => b.weak - a.weak),
      // Per-question difficulty from real answers, to spot broken or ambiguous items.
      question_quality: questionStats(users),
      content_gaps: contentGaps(),
      review_backlog: reviewQueue({ status: 'pending' }).length,
    };
  }
  function questionStats(users) {
    const m = {};
    for (const u of users) for (const a of career(u).attempts) for (const r of a.result.responses) { const x = m[r.id] = m[r.id] || { id: r.id, served: 0, answered: 0, correct: 0 }; x.served++; if (r.answered) x.answered++; if (r.correct) x.correct++; }
    return Object.values(m).map((x) => ({ ...x, p_correct: x.answered ? +(x.correct / x.answered).toFixed(2) : null, flag: x.answered >= 10 && (x.correct / x.answered < 0.15 || x.correct / x.answered > 0.97) ? 'review' : null }));
  }

  /** Admin preview: a sample form, including drafts, with keys shown. Nothing is saved. */
  function preview(key, { includeDrafts = true } = {}) {
    const def = assessmentDef(key); if (!def) return { error: 'Unknown assessment.', status: 404 };
    const pool = def.banks.flatMap((b) => questions(b).filter((q) => q.status === 'published' || (includeDrafts && ['draft', 'reviewed'].includes(q.status))));
    const form = E.assembleForm({ pool, plan: def.plan, seed: crypto.randomInt(1, 2 ** 31) });
    const byId = new Map(pool.map((q) => [q.id, q]));
    return { title: def.title, weights: def.weights, shortfall: form.shortfall, coverage: coverage(def), questions: form.items.map((i) => ({ ...byId.get(i.id), options: E.publicQuestion(byId.get(i.id), i.order).options })) };
  }

  // A lean projection of existing records. Never return raw submissions, answers or profile data.
  function workspace(user) {
    if (!isLearner(user)) return { error: 'Choose a learner account.', status: 403 };
    const r = report(user), rm = r.roadmaps, c = career(user), events = [];
    const add = (kind, title, at, href) => { if (at) events.push({ kind, title, at, href }); };
    const courses = (store.OpenQuest?.enrollments(user.id) || []).map(e => {
      const t = store.Quests.trackDef(e.track_key), p = store.OpenQuest.progress(user.id, e.track_key);
      const published = t && t.published !== false;
      const eligible = (t?.levels || []).filter(l => !p.modules || p.modules.find(m => m.levels?.includes(l.no))?.status !== 'locked');
      const unfinished = l => p.requirements.some(q => q.level === l.no && !q.passed);
      const saved = e.last_lesson, last = saved && eligible.find(l => l.no === saved.level && unfinished(l));
      const next = last || eligible.find(unfinished);
      const href = '/open#course/' + encodeURIComponent(e.track_key);
      const task = next?.problems.find(q => p.requirements.some(r => r.level === next.no && r.pid === q.pid && !r.passed));
      const resume = next && task ? href + '/lesson/' + next.no + '/practice/' + (last && saved.pid && next.problems.some(q => q.pid === saved.pid) && p.requirements.some(r => r.level === next.no && r.pid === saved.pid && !r.passed) ? saved.pid : task.pid) : href;
      add('enrollment', 'Enrolled in ' + e.title, e.enrolled_at || e.created_at, href);
      if (p.certificate) add('certificate', p.certificate.title, p.certificate.completion_date, p.certificate.url);
      for (const [key, sub] of Object.entries(p.submissions || {})) if (p.requirements.some(r => r.level + ':' + r.pid === key && r.passed)) add('lesson', e.title + ' · completed lesson ' + key.split(':')[0], sub.submitted_at, href + '/lesson/' + key.split(':')[0] + '/practice/' + key.split(':')[1]);
      return { track_key: e.track_key, title: e.title, completed: e.completed, passed: e.required_passed, total: e.required_total,
        completion: e.required_total ? Math.round(100 * e.required_passed / e.required_total) : null,
        last_opened_at: e.last_opened_at || null, next_lesson: next?.title || null, available: !!published, active: !!e.active, href, resume: published && e.active ? resume : null, certificate: p.certificate };
    }).sort((a,b) => String(b.last_opened_at || '').localeCompare(String(a.last_opened_at || '')));
    // Include closed/expired seats in history without restoring access or enrollment.
    const currentKeys = new Set(courses.map(e => e.track_key));
    for (const seat of user.profile?.free_course_enrollments || []) if (!currentKeys.has(seat.track_key)) {
      const def = store.Quests.trackDef(seat.track_key), href = '/open#course/' + encodeURIComponent(seat.track_key);
      add('enrollment', 'Enrolled in ' + (def?.title || seat.track_key), seat.enrolled_at, href);
      if (seat.removed_at) add('enrollment', 'Enrollment ended: ' + (def?.title || seat.track_key), seat.removed_at, '/open#profile');
      for (const prior of seat.history || []) add('enrollment', 'Earlier enrollment: ' + (def?.title || seat.track_key), prior.enrolled_at, href);
    }
    for (const a of history(user).attempts) add('assessment', a.title + ' · ' + a.raw_score + '%', a.submitted_at, '#result/' + a.id);
    for (const a of c.st?.attempts || []) add('assessment', a.title + ' · ' + a.result.overall + '%', a.submitted_at, '#sres/' + a.id);
    for (const e of c.preferences?.track_history || []) add('career', 'Primary career: ' + (track(e.track)?.title || e.track), e.at, '#path/' + e.track);
    for (const e of enrollments(user).map(e => ({ ...e, title: track(e.track)?.title || e.track }))) {
      add('career', 'Following ' + e.title, e.enrolled_at, '#path/' + e.track);
      for (const event of e.history || []) add('career', e.title + ': ' + (event.event || event.action || event.op || 'roadmap updated'), event.at, '#path/' + e.track);
    }
    const portalCourses = (store.Enrollments?.batchesForStudent(user.id) || []).map(b => {
      const course = store.Courses.byId(b.course_id), progress = store.Quests.progress(user.id, b.id);
      const href = '/dashboard#view=course&batch=' + b.id;
      const next = progress?.levels.find(l => l.unlocked && !l.passed);
      const task = next?.quest.problems.find(p => !(data().quest_submissions || []).some(s => s.user_id === user.id && s.quest_id === next.quest.id && s.pid === p.pid && s.grade >= progress.track.pass_mark));
      return { id: b.id, title: course?.title || b.name, cohort: b.name, in_progress: !!(next && task), next_lesson: next?.quest.title || null, completed: progress?.completed || false, passed: progress?.levels.filter(l => l.passed).length ?? null, total: progress?.levels.length ?? null, href,
        resume: next && task ? '/dashboard#view=task&batch=' + b.id + '&qid=' + next.quest.id + '&pid=' + task.pid : href };
    });
    for (const e of data().enrollments || []) if (e.user_id === user.id) add('enrollment', 'Course enrollment: ' + (store.Batches?.byId(e.batch_id)?.name || 'Course'), e.created_at, '/dashboard#view=course&batch=' + e.batch_id);
    for (const certificate of data().certificates || []) if (certificate.user_id === user.id) add('certificate', certificate.title, certificate.completion_date, '/cert?s=' + encodeURIComponent(certificate.serial));
    for (const e of c.role_history) add('career', e.title ? 'Target role: ' + e.title : 'Target role cleared', e.at, e.id ? '#role/' + e.id : '#me');
    const rewards = store.gamifyFor?.(user) || null;
    for (const e of rewards?.recent_events || []) add('achievement', e.note || e.label || e.reason || e.title || 'Learning reward', e.at || e.created_at, '/open#profile');
    const cur = r.curriculum, next = cur?.next, unfinished = courses.find(e => !e.completed && e.resume) || portalCourses.find(e => !e.completed && e.in_progress) || null;
    let action;
    if (!rm.primary) action = { label: 'Discover Your Career', href: '#discover', reason: 'Choose a direction, or keep exploring your courses below.' };
    else if (!cur.target) action = { label: 'Choose Your Target Job Role', href: '#path/' + rm.primary.track, reason: 'Your role defines the required skill checkpoints.' };
    else if (cur.active || r.active) action = { label: 'Continue Assessment', href: cur.active?.href || '#take', reason: 'Your saved assessment is ready to resume.' };
    else if (!cur.assessed_competencies && !c.attempts.some(a => a.status === 'submitted' && a.result.answered > 0) && next?.available) action = { label: 'Assess Your Current Skills', href: next.href, reason: 'Start with a published knowledge checkpoint. Unassessed skills have no score.' };
    else {
      const gap = r.gaps.find(g => g.evidence === 'sufficient' && g.score != null && g.score < 70 && g.resources?.some(x => !x.completed));
      const resource = gap?.resources.find(x => !x.completed);
      const foundation = cur.subtracks.find(x => x.student.status !== 'passed' && cur.subtracks.some(y => x.prereq.includes(y.id) && y.student.status !== 'passed'));
      const prereq = foundation && cur.subtracks.find(x => foundation.prereq.includes(x.id) && x.student.status !== 'passed' && x.assessment.state === 'published');
      action = resource ? { label: 'Review ' + gap.name, href: resource.url, reason: 'A required skill needs review. This lesson is available now.' }
        : prereq ? { label: 'Start With These Foundations', href: '#sub/' + prereq.id, reason: prereq.title + ' supports your later checkpoints.' }
        : unfinished ? { label: 'Continue Your Lesson', href: unfinished.resume, reason: unfinished.title + (unfinished.next_lesson ? ' · ' + unfinished.next_lesson : '') }
        : next ? { label: next.available ? 'Continue Your Skill Journey' : 'View Preparation Plan', href: next.href, reason: next.available ? next.title : next.title + ': learning content and assessment in preparation.' }
        : { label: 'Review Your Target Role', href: '#role/' + cur.target.id, reason: 'Review your requirements and final checkpoint availability.' };
    }
    const pace = c.discovery?.answers?.commitment || null;
    const nextSub = cur.subtracks.find(s => s.id === cur.next?.id), budget = { '3_5': [3,5], '5_10': [5,10] }[pace];
    const studyPlan = nextSub?.hours && budget ? { title: nextSub.title, min_weeks: Math.max(1, Math.ceil(nextSub.hours / budget[1])), max_weeks: Math.max(1, Math.ceil(nextSub.hours / budget[0])) } : null;
    const latest = events.filter(e => e.kind === 'assessment').sort((a,b) => String(b.at).localeCompare(String(a.at)))[0] || null;
    return { report: r, roadmaps: rm, courses, portal_courses: portalCourses, latest_assessment: latest, rewards, next: action, continue_learning: unfinished || null,
      history: [...new Map(events.map(e => [e.kind + '|' + e.href + '|' + e.at + '|' + e.title, e])).values()].sort((a,b) => String(b.at).localeCompare(String(a.at))).slice(0, 100),
      pace, study_plan: studyPlan, discovery: publicDiscovery(c.discovery || {}) };
  }
  function chooseTarget(user, id) {
    if (!id) return curriculumService.setTarget(user, null);
    const role = curriculumService.allRoles().find(r => r.id === id);
    if (!isLearner(user)) return { error: 'Choose a learner account.', status: 403 };
    if (!role) return { error: 'Job role not found.', status: 404 };
    const existing = enrollmentFor(user, role.track);
    const out = existing?.status === 'active' ? existing.primary ? {} : makePrimary(user, role.track)
      : existing?.status === 'paused' ? resumeTrack(user, role.track, { primary: true }) : enrollTrack(user, role.track, { primary: true });
    if (out.error) return out;
    return curriculumService.setTarget(user, id);
  }

  const curriculumService = createCurriculumService({ settings, save, career, writeCareer, isLearner, iso, now, audit, users: () => data().users || [] }, curriculumOptions);
  return {
    BANKS, LANGS, PREF_FIELDS, REVIEWER_ROLES, config, updateConfig, categoryWeights, reviewQueue, suggestReview, submitReview, isReviewer, questions, published, questionById, setQuestionStatus, editQuestion, addQuestion,
    track, tracks, updateTrack, publicTrack, assessmentDef, coverage, availability, career, savePreferences, startAttempt, resumeAttempt, saveAnswers,
    discoveryInfo, discoveryConfig, updateDiscoveryConfig, resetDiscoveryConfig, discoveryState, saveDiscovery, startDiscoveryQuiz, resumeDiscoveryQuiz, submitDiscoveryQuiz, discoveryRecommendations, claimDiscovery, discoveryAnalytics,
    skillRecords, trackProfile, trackPlan, commonStatus, enrollments, listEnrollments, enrollTrack, enrollmentAdvice, makePrimary, pauseTrack, resumeTrack, archiveTrack, refreshEnrollments,
    submitAttempt, abandonAttempt, attemptReview, resources, contentGaps, report, history, setProject, analytics, preview, isLearner,
    curriculum: curriculumService, workspace, chooseTarget,
  };
}

module.exports = { createCareerService };
