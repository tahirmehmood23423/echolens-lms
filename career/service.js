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

const BANKS = {
  common: { title: 'Common Computer Science Assessment', questions: require('./banks/common') },
  frontend: { title: 'Frontend skills', questions: require('./banks/frontend') },
  backend: { title: 'Backend skills', questions: require('./banks/backend') },
  aiml: { title: 'AI & Machine Learning skills', questions: require('./banks/aiml') },
};
const LEARNER_ROLES = ['free', 'student'];
const MAX_HISTORY = 60;
const QUESTION_STATUSES = ['draft', 'reviewed', 'published', 'retired'];
const TRACK_STATUSES = ['draft', 'published'];

function createCareerService(store, { now = () => new Date() } = {}) {
  const data = () => store.allData();
  const settings = () => { const d = data(); if (!d.settings) d.settings = {}; return d.settings; };
  const save = () => store.persist();
  const iso = () => now().toISOString();

  /* ----------------------------- configuration ----------------------------- */
  function config() {
    const o = settings().career_config || {};
    const c = { ...E.DEFAULT_CONFIG, ...o, skill_thresholds: { ...E.DEFAULT_CONFIG.skill_thresholds, ...(o.skill_thresholds || {}) } };
    c.enabled = { common: true, ...(o.enabled || {}) };
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
    for (const [k, lo, hi] of [['min_evidence_items', 1, 10], ['track_items_per_skill', 2, 8], ['skill_reassess_items', 2, 10], ['retake_cooldown_hours', 0, 720]]) {
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

  /* -------------------------------- questions -------------------------------- */
  const qstate = () => { const s = settings(); if (!s.career_questions) s.career_questions = { status: {}, edits: {}, custom: [], history: {} }; return s.career_questions; };
  function bankOf(id) { for (const [b, v] of Object.entries(BANKS)) if (v.questions.some((q) => q.id === id)) return b; return (qstate().custom.find((q) => q.id === id) || {}).bank || null; }
  /** The effective current version of every question in a bank. */
  function questions(bank) {
    const st = qstate();
    const base = (BANKS[bank]?.questions || []).map((q) => ({ ...q, ...(st.edits[q.id] || {}) }));
    const custom = st.custom.filter((q) => q.bank === bank);
    return [...base, ...custom].map((q) => ({ ...q, bank, status: st.status[q.id]?.status || q.status, reviewed_by: st.status[q.id]?.by || null, reviewed_at: st.status[q.id]?.at || null }));
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
    const type = ['single', 'multi', 'output', 'debug', 'scenario'].includes(b.type) ? b.type : 'single';
    const skills = [].concat(b.skills || []).map(String).filter((s) => skill(s));
    if (!skills.length) return { error: 'Map the question to at least one known skill.' };
    const prompt = String(b.prompt || '').trim().slice(0, 2000), explanation = String(b.explanation || '').trim().slice(0, 2000);
    if (prompt.length < 8) return { error: 'Write the question statement.' };
    if (!explanation) return { error: 'Every question needs an explanation of the correct answer.' };
    const difficulty = [1, 2, 3].includes(Number(b.difficulty)) ? Number(b.difficulty) : 1;
    const q = { type, skills, difficulty, prompt, explanation, code: String(b.code || '').slice(0, 4000) || null, practical: !!b.practical,
      points: difficulty, time_sec: Math.max(20, Math.min(600, Number(b.time_sec) || ({ 1: 45, 2: 75, 3: 105 })[difficulty])) };
    if (type === 'output') {
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
      return { key, title: BANKS.common.title, banks: ['common'], plan: { ...cfg.common_form }, enabled: cfg.enabled.common !== false };
    }
    if (String(key).startsWith('skill:')) {
      const id = key.slice(6); if (!skill(id)) return null;
      const banks = Object.keys(BANKS).filter((b) => BANKS[b].questions.some((q) => q.skills[0] === id) || qstate().custom.some((q) => q.bank === b && q.skills[0] === id));
      return { key, title: `${skill(id).name} reassessment`, banks, plan: { [id]: cfg.skill_reassess_items }, enabled: true, skill: id };
    }
    const t = track(key); if (!t) return null;
    const banks = t.assessment.banks || [];
    const plan = {};
    for (const s of t.skills) if (banks.some((b) => questions(b).some((q) => q.skills[0] === s.skill))) plan[s.skill] = cfg.track_items_per_skill;
    return { key, title: `${t.title} skill assessment`, banks, plan, enabled: !!banks.length && cfg.enabled[key] !== false && t.status === 'published', track: t.slug };
  }
  /** Coverage: does every planned skill have enough PUBLISHED questions? */
  function coverage(def) {
    const pool = def.banks.flatMap(published);
    const skills = Object.entries(def.plan).map(([id, want]) => {
      const have = pool.filter((q) => q.skills[0] === id);
      return { skill: id, name: skill(id)?.name || id, want, published: have.length, alternate_forms: have.length >= want * 2, ok: have.length >= want, difficulties: [...new Set(have.map((q) => q.difficulty))].sort() };
    });
    return { skills, ok: skills.length > 0 && skills.every((s) => s.ok), practical: pool.some((q) => q.practical && def.plan[q.skills[0]]) };
  }
  function availability(key) {
    const def = assessmentDef(key); if (!def) return { key, available: false, reason: 'Unknown assessment.' };
    if (!def.banks.length) return { key, title: def.title, available: false, reason: 'This track\'s assessment is coming soon.' };
    if (!def.enabled) return { key, title: def.title, available: false, reason: 'This assessment is not enabled yet.' };
    const cov = coverage(def);
    if (!cov.ok) return { key, title: def.title, available: false, reason: 'Questions for this assessment are still being reviewed.', coverage: cov };
    const items = Object.values(def.plan).reduce((a, b) => a + b, 0);
    return { key, title: def.title, available: true, items, coverage: cov };
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
    const form = E.assembleForm({ pool, plan: def.plan, seen: seenIds(fresh, def), seed });
    const byId = new Map(pool.map((q) => [q.id, q]));
    const snapshot = form.items.map((i) => ({ ...byId.get(i.id), order: i.order }));
    const limitSec = Math.ceil(snapshot.reduce((a, q) => a + q.time_sec, 0) / 60) * 60;
    const active = {
      id: 'ca_' + crypto.randomBytes(8).toString('hex'), assessment: key, title: def.title, track: def.track || null, skill: def.skill || null,
      started_at: t.toISOString(), expires_at: new Date(t.getTime() + limitSec * 1000).toISOString(), limit_sec: limitSec,
      config_version: cfg.version, questions: snapshot, answers: {}, saved_at: null,
    };
    writeCareer(user, { ...fresh, active });
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
      questions: a.questions.map((q) => ({ ...E.publicQuestion(q, q.order), skill: skill(q.skills[0])?.name || q.skills[0] })) };
  }
  function cleanAnswers(a, answers) {
    const out = {}, ids = new Set(a.questions.map((q) => q.id));
    for (const [k, v] of Object.entries(answers || {})) {
      if (!ids.has(k)) continue;
      out[k] = Array.isArray(v) ? v.slice(0, 8).map((x) => String(x).slice(0, 4)) : String(v ?? '').slice(0, 200);
    }
    return out;
  }
  /** Autosave, so an interrupted assessment resumes where it stopped. */
  function saveAnswers(user, id, answers) {
    const c = career(user);
    if (!c.active || c.active.id !== id) return { error: 'Assessment not found or already submitted.', status: 404 };
    if (Date.parse(c.active.expires_at) + config().time_grace_sec * 1000 < now().getTime()) return { error: 'Time is up for this assessment. Submit to see your results.', status: 409 };
    writeCareer(user, { ...c, active: { ...c.active, answers: { ...c.active.answers, ...cleanAnswers(c.active, answers) }, saved_at: iso() } });
    return { ok: true };
  }
  function finalize(user, id, answers, { expired = false } = {}) {
    const c = career(user), a = c.active;
    const cfg = config();
    const late = Date.parse(a.expires_at) + cfg.time_grace_sec * 1000 < now().getTime();
    // After the deadline only the answers autosaved in time count.
    const final = late || expired ? a.answers : { ...a.answers, ...cleanAnswers(a, answers) };
    const result = E.scoreAttempt(a.questions, final, cfg);
    const record = {
      id: a.id, assessment: a.assessment, title: a.title, track: a.track, skill: a.skill, status: 'submitted',
      started_at: a.started_at, submitted_at: iso(), late: late || expired, config_version: a.config_version, result,
    };
    writeCareer(user, { ...c, active: null, attempts: [...c.attempts, record] });
    return record;
  }
  /** Submit - idempotent: re-sending the same attempt id returns the stored result. */
  function submitAttempt(user, id, answers) {
    if (!isLearner(user)) return { error: 'Assessments are for learner accounts.', status: 403 };
    const c = career(user);
    const done = c.attempts.find((x) => x.id === id);
    if (done) return { attempt: done, existing: true };
    if (!c.active || c.active.id !== id) return { error: 'Assessment not found.', status: 404 };
    return { attempt: finalize(user, id, answers) };
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
      const q = questionVersion(r.id, r.v);
      return { id: r.id, correct: r.correct, answered: r.answered, earned: r.earned, points: r.points, skill: skill(r.skills[0])?.name,
        prompt: q?.prompt, code: q?.code, options: q?.options || [], key: q?.answer || [], explanation: q?.explanation || null };
    });
  }
  function questionVersion(id, v) {
    const cur = questionById(id); if (cur && cur.version === v) return cur;
    return (qstate().history[id] || []).find((h) => h.version === v) || cur;
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
    const chosen = track(slug || c.preferences?.preferred_track || '') || null;
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
    }
    const submitted = c.attempts.filter((a) => a.status === 'submitted');
    const last = (key) => submitted.filter((a) => a.assessment === key).pop() || null;
    return {
      disclaimer: 'Scores guide your learning and placement on EchoLens. They are provisional estimates, not an employment qualification or a psychometrically validated certification.',
      preferences: c.preferences, track: chosen ? publicTrack(chosen) : null,
      common: { ...common, categories: common.categories.map((x) => ({ ...x, name: skill(x.skill)?.name, status: E.skillStatus(profile[x.skill], false, cfg) })), last_attempt: last('common') ? summary(last('common')) : null },
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
  function summary(a) { return { id: a.id, assessment: a.assessment, title: a.title, submitted_at: a.submitted_at, raw_score: a.result.raw_score, practical_score: a.result.practical_score, answered: a.result.answered, total: a.result.total, late: a.late }; }
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
    return { title: def.title, shortfall: form.shortfall, coverage: coverage(def), questions: form.items.map((i) => ({ ...byId.get(i.id), options: E.publicQuestion(byId.get(i.id), i.order).options })) };
  }

  return {
    BANKS, LANGS, PREF_FIELDS, config, updateConfig, questions, published, questionById, setQuestionStatus, editQuestion, addQuestion,
    track, tracks, updateTrack, publicTrack, assessmentDef, coverage, availability, career, savePreferences, startAttempt, resumeAttempt, saveAnswers,
    submitAttempt, abandonAttempt, attemptReview, resources, contentGaps, report, history, setProject, analytics, preview, isLearner,
  };
}

module.exports = { createCareerService };
