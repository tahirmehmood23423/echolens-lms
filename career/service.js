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

const { BANKS } = require('./banks');
const REVIEWER_ROLES = ['admin', 'instructor'];
const LEARNER_ROLES = ['free', 'student'];
const MAX_HISTORY = 60;
const QUESTION_STATUSES = ['draft', 'reviewed', 'published', 'retired'];
const TRACK_STATUSES = ['draft', 'published'];

function createCareerService(store, { now = () => new Date(), aiSuggest = null, notify = null, appUrl = '' } = {}) {
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
    for (const [k, lo, hi] of [['min_evidence_items', 1, 10], ['min_category_items', 1, 10], ['track_items_per_skill', 2, 8], ['skill_reassess_items', 2, 10], ['review_items_per_form', 0, 4], ['retake_cooldown_hours', 0, 720]]) {
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
      return { key, title: BANKS.common.title, banks: ['common'], plan: { ...cfg.common_form }, enabled: cfg.enabled.common !== false, reviewItems: cfg.review_items_per_form, weights: categoryWeights('common') };
    }
    if (String(key).startsWith('skill:')) {
      const id = key.slice(6); if (!skill(id)) return null;
      const banks = Object.keys(BANKS).filter((b) => BANKS[b].questions.some((q) => q.skills[0] === id) || qstate().custom.some((q) => q.bank === b && q.skills[0] === id));
      // Short and mostly auto-graded. One staff-reviewed item (where the skill
      // has one) lets a student prove practical or written ability that repeat
      // questions could not fairly show again.
      return { key, title: `${skill(id).name} reassessment`, banks, plan: { [id]: cfg.skill_reassess_items }, enabled: true, skill: id, reviewItems: 1, weights: categoryWeights('default') };
    }
    const t = track(key); if (!t) return null;
    const banks = t.assessment.banks || [];
    const plan = {};
    for (const s of t.skills) if (banks.some((b) => questions(b).some((q) => q.skills[0] === s.skill && q.grading !== 'review'))) plan[s.skill] = cfg.track_items_per_skill;
    return { key, title: `${t.title} skill assessment`, banks, plan, enabled: !!banks.length && cfg.enabled[key] !== false && t.status === 'published', track: t.slug, reviewItems: cfg.review_items_per_form, weights: categoryWeights(key) };
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
    return { preferences: c.preferences || null, attempts: c.attempts || [], active: c.active || null, projects: c.projects || {} };
  }
  function writeCareer(user, next) {
    const attempts = next.attempts.slice(-MAX_HISTORY);
    user.profile = { ...(user.profile || {}), career: { ...next, attempts } };
    save();
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
    writeCareer(user, { ...c, preferences: { ...(c.preferences || {}), ...prefs, track_history: [...((c.preferences || {}).track_history || []), ...((c.preferences?.preferred_track || null) !== preferred && preferred ? [{ track: preferred, at: iso() }] : [])].slice(-20) } });
    return { preferences: career(user).preferences };
  }

  function seenIds(c, def) {
    const recent = c.attempts.filter((a) => a.assessment === def.key || (def.skill && a.result?.skills?.[def.skill])).slice(-config().recent_attempts_excluded);
    return new Set(recent.flatMap((a) => (a.result?.responses || []).map((r) => r.id)));
  }

  function startAttempt(user, key) {
    if (!isLearner(user)) return { error: 'Assessments are for learner accounts. Admins can preview forms from the admin panel.', status: 403 };
    const def = assessmentDef(key); const av = availability(key);
    if (!def || !av.available) return { error: av.reason || 'This assessment is not available.', status: 409 };
    const c = career(user), cfg = config(), t = now();
    if (c.active) {
      const live = Date.parse(c.active.expires_at) + cfg.time_grace_sec * 1000 > t.getTime();
      if (c.active.assessment === key && live) return { attempt: deliver(c.active), resumed: true };
      if (live) return { error: 'You have another assessment in progress. Finish or abandon it first.', status: 409, active: c.active.assessment };
      finalize(user, c.active.id, {}, { expired: true });
    }
    const fresh = career(user);
    if (!def.skill && cfg.retake_cooldown_hours) {
      const last = fresh.attempts.filter((a) => a.assessment === key && a.status === 'submitted').pop();
      if (last && t.getTime() - Date.parse(last.submitted_at) < cfg.retake_cooldown_hours * 3600e3) {
        const at = new Date(Date.parse(last.submitted_at) + cfg.retake_cooldown_hours * 3600e3).toISOString();
        return { error: `You can retake this assessment after ${at.slice(0, 16).replace('T', ' ')} UTC. Meanwhile, work on the recommended modules or take a short skill reassessment.`, status: 429, retry_at: at };
      }
    }
    const pool = def.banks.flatMap(published);
    const seed = crypto.randomInt(1, 2 ** 31);
    const form = E.assembleForm({ pool, plan: def.plan, seen: seenIds(fresh, def), seed, reviewItems: def.reviewItems || 0 });
    const byId = new Map(pool.map((q) => [q.id, q]));
    const snapshot = form.items.map((i) => ({ ...byId.get(i.id), order: i.order }));
    const limitSec = Math.ceil(snapshot.reduce((a, q) => a + q.time_sec, 0) / 60) * 60;
    const active = {
      id: 'ca_' + crypto.randomBytes(8).toString('hex'), assessment: key, title: def.title, track: def.track || null, skill: def.skill || null,
      started_at: t.toISOString(), expires_at: new Date(t.getTime() + limitSec * 1000).toISOString(), limit_sec: limitSec,
      config_version: cfg.version, weights: def.weights, questions: snapshot, answers: {}, saved_at: null,
    };
    // Starting a track's test from "Test Your Skills" picks that career track, unless the student already chose one.
    const prefs = fresh.preferences || {};
    const preferences = def.track && !prefs.preferred_track
      ? { ...prefs, preferred_track: def.track, track_history: [...(prefs.track_history || []), { track: def.track, at: iso() }].slice(-20), updated_at: iso() }
      : fresh.preferences;
    writeCareer(user, { ...fresh, preferences, active });
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
    return { id: a.id, assessment: a.assessment, title: a.title, started_at: a.started_at, expires_at: a.expires_at, limit_sec: a.limit_sec, answers: a.answers || {},
      weights: a.weights || null,
      questions: a.questions.map((q) => ({ ...E.publicQuestion(q, q.order), skill: skill(q.skills[0])?.name || q.skills[0] })) };
  }
  function cleanAnswers(a, answers) {
    const out = {}, byId = new Map(a.questions.map((q) => [q.id, q]));
    for (const [k, v] of Object.entries(answers || {})) {
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
    if (Date.parse(c.active.expires_at) + config().time_grace_sec * 1000 < now().getTime()) return { error: 'Time is up for this assessment. Submit to see your results.', status: 409 };
    writeCareer(user, { ...c, active: { ...c.active, answers: { ...c.active.answers, ...cleanAnswers(c.active, answers) }, runs: { ...(c.active.runs || {}), ...cleanRuns(c.active, runs) }, pastes: mergeMax(c.active.pastes, cleanPastes(c.active, pastes)), saved_at: iso() } });
    return { ok: true };
  }
  const mergeMax = (a = {}, b = {}) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = Math.max(o[k] || 0, v); return o; };
  function finalize(user, id, answers, { expired = false, runs = {}, pastes = {} } = {}) {
    const c = career(user), a = c.active;
    const cfg = config();
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
    };
    writeCareer(user, { ...c, active: null, attempts: [...c.attempts, record] });
    return record;
  }
  /** Submit - idempotent: re-sending the same attempt id returns the stored result. */
  function submitAttempt(user, id, answers, runs, pastes) {
    if (!isLearner(user)) return { error: 'Assessments are for learner accounts.', status: 403 };
    const c = career(user);
    const done = c.attempts.find((x) => x.id === id);
    if (done) return { attempt: done, existing: true };
    if (!c.active || c.active.id !== id) return { error: 'Assessment not found.', status: 404 };
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
        prompt: q?.prompt, code: q?.code, options: q?.options || [], key: q?.answer || [],
        // Reviewed items: the student's own answer, the rubric, and - only once a human has reviewed it - the outcome and the reference answer.
        answer: reviewed ? r.answer || '' : undefined, run_output: reviewed ? r.run_output || null : undefined, rubric: reviewed ? q?.rubric || [] : undefined,
        review: reviewed && r.review ? { criteria: r.review.criteria, comment: r.review.comment, reviewed_at: r.review.at, reviewer_role: r.review.role } : null,
        explanation: reviewed ? (r.review ? q?.model_answer || q?.explanation : null) : q?.explanation || null };
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
      const problems = (lvl.problems || []).filter((p) => p.required !== false);
      const passMark = (p) => Number(p.pass_mark ?? def.pass_mark ?? 60);
      const completed = !!problems.length && problems.every((p) => subs.some((s) => s.track_key === r.track && s.level === r.level && s.pid === p.pid && s.score != null && s.score >= passMark(p)));
      return { track_key: r.track, level: r.level, title: lvl.title, course: entry.title, course_code: entry.code, tasks: problems.length, completed,
        url: `/open#course/${encodeURIComponent(r.track)}/lesson/${r.level}` };
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

  /* --------------------------------- reports --------------------------------- */
  function report(user, slug) {
    const c = career(user), cfg = config();
    const profile = E.skillProfile(c.attempts);
    // The track asked for, else the preferred one, else the track of the latest track assessment taken.
    const lastTrackAttempt = c.attempts.filter((a) => a.status === 'submitted' && a.track).pop();
    const chosen = track(slug || c.preferences?.preferred_track || lastTrackAttempt?.track || '') || null;
    const common = E.commonScore(profile, cfg);
    const resolve = (id) => resources(id, user.id);
    let readiness = null, gaps = [], plan = null;
    if (chosen) {
      readiness = E.trackReadiness(chosen, profile, cfg);
      readiness.skills = readiness.skills.map((s) => ({ ...s, name: skill(s.skill)?.name }));
      gaps = E.skillGaps(chosen, profile, resolve, cfg).map((g) => ({ ...g, name: skill(g.skill)?.name, recommendation: E.recommendation(g, skill(g.skill)?.name || g.skill), reassess_available: availability('skill:' + g.skill).available }));
      plan = E.roadmap(chosen, profile, resolve, { stageNames: STAGE_NAMES, projects: c.projects[chosen.slug] || {} }, cfg);
      plan.stages.forEach((st) => st.skills.forEach((s) => { s.name = skill(s.skill)?.name; }));
      readiness.explanation = readiness.explanation.map((line) => line.replace(/\b([a-z]+\.[a-z_]+)\b/g, (m) => skill(m)?.name || m));
      readiness.category_feedback = categoryFeedback(readiness.evaluation, readiness.weakest_category, cfg);
    }
    const submitted = c.attempts.filter((a) => a.status === 'submitted');
    const last = (key) => submitted.filter((a) => a.assessment === key).pop() || null;
    const pending = submitted.reduce((n, a) => n + (a.result.pending || 0), 0);
    return {
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
      theory: { strong: 'You understand the underlying concepts well.', mid: 'Your conceptual understanding is developing - some ideas are not yet secure.', weak: 'Conceptual understanding is the main gap: revisit the lessons and make sure you can explain each idea in your own words.', none: 'Conceptual understanding has not been assessed yet.' },
      practical: { strong: 'You can turn concepts into working code, queries or configurations.', mid: 'Your hands-on skills are developing - practise writing and debugging code yourself.', weak: 'Practical implementation is the main gap: you need much more hands-on coding and debugging practice.', none: 'Practical skills have not been shown yet - take an assessment with practical tasks.' },
      scenario: { strong: 'You apply your knowledge well to real-world problems.', mid: 'Applying skills to real situations is developing - work through projects and case studies.', weak: 'Real-world application is the main gap: practise deciding and justifying what to do in realistic situations, for example through the stage projects.', none: 'Real-world problem-solving has not been assessed yet.' },
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
    const form = E.assembleForm({ pool, plan: def.plan, seed: crypto.randomInt(1, 2 ** 31), reviewItems: def.reviewItems || 0 });
    const byId = new Map(pool.map((q) => [q.id, q]));
    return { title: def.title, weights: def.weights, shortfall: form.shortfall, coverage: coverage(def), questions: form.items.map((i) => ({ ...byId.get(i.id), options: E.publicQuestion(byId.get(i.id), i.order).options })) };
  }

  return {
    BANKS, LANGS, PREF_FIELDS, REVIEWER_ROLES, config, updateConfig, categoryWeights, reviewQueue, suggestReview, submitReview, isReviewer, questions, published, questionById, setQuestionStatus, editQuestion, addQuestion,
    track, tracks, updateTrack, publicTrack, assessmentDef, coverage, availability, career, savePreferences, startAttempt, resumeAttempt, saveAnswers,
    submitAttempt, abandonAttempt, attemptReview, resources, contentGaps, report, history, setProject, analytics, preview, isLearner,
  };
}

module.exports = { createCareerService };
