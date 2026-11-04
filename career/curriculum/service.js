'use strict';
/**
 * Comprehensive subtrack assessments and job-role readiness.
 *
 * Storage (no schema migration; same JSON documents as the rest of career/):
 *   settings.career_st_config      assessment rules (configurable, versioned)
 *   settings.career_stq            question review state: status, edits (new versions), custom items, history
 *   settings.career_st_assess      which subtrack assessments an admin has PUBLISHED
 *   settings.career_curriculum     admin overrides: role requirements, subtrack prerequisites, structure status
 *   users[].profile.career.st      a student's attempts, active attempt and per-subtrack results
 *
 * Rules that protect students and the meaning of a result:
 *   - Questions are used only after an admin publishes the subtrack's
 *     assessment, and publishing is refused unless the reviewed bank can
 *     cover the blueprint (difficulty mix, scenario share, every competency).
 *   - A pass needs the overall threshold AND every critical competency AND
 *     no unassessed competency. A high score with a critical gap is
 *     "Further evidence required", never a pass.
 *   - Results are keyed by canonical subtrack id, so passing SQL Fundamentals
 *     once counts in every track and role that uses it, while still valid.
 *   - Earlier attempts are never overwritten; retakes prefer unseen questions.
 *   - Nothing here is described as a qualification: the label is
 *     "EchoLens Assessed Knowledge Readiness".
 */
const crypto = require('crypto');
const C = require('./index');
const { validateQuestion, validateBank } = require('./qdsl');
const { BANKS: BUILT_IN, APPROVED } = require('./questions');
const { verifyCode } = require('./verify');

const READINESS_LABEL = 'EchoLens Assessed Knowledge Readiness';
const DIFF_KEYS = ['easy', 'medium', 'hard', 'advanced'];
const DEFAULTS = {
  version: 1,
  items: 30, minutes: 40,
  mix: { easy: 20, medium: 35, hard: 35, advanced: 10 },   // percent of a form
  scenario_share: 70,                                      // percent of a form from workplace scenarios
  weights: { easy: 1, medium: 1, hard: 1, advanced: 1 },   // per-question weight in the overall score
  pass_overall: 80, critical_min: 70, critical_min_items: 2,
  unrestricted_bank: 90,                                   // reviewed items before unrestricted fresh retakes
  retake_hours: 24, limited_retake_days: 7,
  evidence_valid_days: 730,
  role_items: 60, role_minutes: 80,
};
const STATUS_TEXT = {
  not_attempted: 'Not attempted', learning_recommended: 'Learning recommended',
  further_evidence_required: 'Further evidence required', passed: 'Passed', expired: 'Passed earlier (expired)',
};

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function shuffle(list, rand) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** Integer difficulty quota for n items from a percentage mix (largest remainder). */
function quota(n, mix) {
  const raw = DIFF_KEYS.map((k) => [k, (n * (mix[k] || 0)) / 100]);
  const out = Object.fromEntries(raw.map(([k, v]) => [k, Math.floor(v)]));
  let left = n - Object.values(out).reduce((a, b) => a + b, 0);
  for (const [k] of raw.sort((x, y) => (y[1] % 1) - (x[1] % 1))) { if (left <= 0) break; out[k]++; left--; }
  return out;
}

function createCurriculumService(core, { extraBanks = {} } = {}) {
  const { settings, save, career, writeCareer, isLearner, iso, now, audit, users } = core;

  /* --------------------------------- config --------------------------------- */
  function config() { const o = settings().career_st_config || {}; return { ...DEFAULTS, ...o, mix: { ...DEFAULTS.mix, ...(o.mix || {}) }, weights: { ...DEFAULTS.weights, ...(o.weights || {}) } }; }
  function updateConfig(patch, actorId) {
    const cur = config(), next = { ...cur, ...patch, mix: { ...cur.mix, ...(patch.mix || {}) }, weights: { ...cur.weights, ...(patch.weights || {}) } };
    const num = (k, lo, hi) => typeof next[k] === 'number' && next[k] >= lo && next[k] <= hi;
    for (const [k, lo, hi] of [['items', 10, 80], ['minutes', 10, 240], ['scenario_share', 0, 100], ['pass_overall', 50, 100], ['critical_min', 30, 100], ['critical_min_items', 1, 5], ['unrestricted_bank', 30, 500], ['retake_hours', 0, 720], ['limited_retake_days', 0, 60], ['evidence_valid_days', 30, 3650], ['role_items', 20, 150], ['role_minutes', 20, 300]]) if (!num(k, lo, hi)) return { error: `${k} must be between ${lo} and ${hi}.`, status: 400 };
    if (DIFF_KEYS.reduce((a, k) => a + Number(next.mix[k] || 0), 0) !== 100) return { error: 'The difficulty mix must add up to 100%.', status: 400 };
    if (DIFF_KEYS.some((k) => !(next.weights[k] > 0 && next.weights[k] <= 5))) return { error: 'Difficulty weights must be between 0 and 5.', status: 400 };
    next.version = cur.version + 1; next.updated_at = iso(); next.updated_by = actorId || null;
    settings().career_st_config = next; save();
    audit(actorId, 'career_st_config_update', 'career_st_config', next.version, { keys: Object.keys(patch) });
    return { config: next };
  }

  /* ------------------------------- structure ------------------------------- */
  const ov = () => { const s = settings(); if (!s.career_curriculum) s.career_curriculum = { roles: {}, subtracks: {} }; return s.career_curriculum; };
  function subtrack(id) { const s = C.subtrack(id); if (!s) return null; const o = ov().subtracks[id] || {}; return { ...s, prereq: o.prereq || s.prereq, structure_status: o.structure_status || s.structure_status }; }
  function role(id) { const r = C.role(id); if (!r) return null; const o = ov().roles[id] || {}; return { ...r, mandatory: o.mandatory || r.mandatory, optional: o.optional || r.optional, status: o.status || r.status, jd: o.jd_status ? { ...r.jd, status: o.jd_status, reviewed_by: o.jd_reviewed_by, reviewed_at: o.jd_reviewed_at } : r.jd }; }
  const allRoles = () => C.ROLES.map((r) => role(r.id));
  function prereqClosure(id, seen = new Set()) { for (const p of subtrack(id)?.prereq || []) if (!seen.has(p)) { seen.add(p); prereqClosure(p, seen); } return seen; }
  function prereqOrder(ids) { const set = new Set(ids), out = [], done = new Set(); const visit = (x) => { if (done.has(x) || !set.has(x)) return; done.add(x); for (const p of subtrack(x)?.prereq || []) visit(p); out.push(x); }; ids.forEach(visit); return out; }
  function rolePath(r) {
    const listed = new Set([...r.mandatory, ...r.optional]), pre = new Set();
    for (const id of r.mandatory) for (const p of prereqClosure(id)) if (!listed.has(p)) pre.add(p);
    return { required: prereqOrder([...pre, ...r.mandatory]), prerequisites_added: [...pre], optional: prereqOrder(r.optional) };
  }
  /** Admin edits to structure, validated (known ids, no cycles) before saving. */
  function updateStructure(patch, actorId) {
    const o = JSON.parse(JSON.stringify(ov()));
    if (patch.role) {
      const r = C.role(patch.role.id); if (!r) return { error: 'Unknown role.', status: 404 };
      const cur = o.roles[r.id] || {};
      for (const k of ['mandatory', 'optional']) if (patch.role[k] !== undefined) {
        if (!Array.isArray(patch.role[k]) || patch.role[k].some((id) => !C.subtrack(id))) return { error: `${k} must list known subtrack ids.`, status: 400 };
        cur[k] = [...new Set(patch.role[k])];
      }
      if (patch.role.status) { if (!['draft', 'reviewed', 'published'].includes(patch.role.status)) return { error: 'Unknown status.', status: 400 }; cur.status = patch.role.status; }
      if (patch.role.jd_status) { if (!['search_summary_unverified', 'jd_verification_required', 'jd_reviewed'].includes(patch.role.jd_status)) return { error: 'Unknown JD status.', status: 400 }; cur.jd_status = patch.role.jd_status; cur.jd_reviewed_by = actorId; cur.jd_reviewed_at = iso(); }
      const m = cur.mandatory || r.mandatory, op = cur.optional || r.optional;
      if (m.some((x) => op.includes(x))) return { error: 'A subtrack cannot be both mandatory and optional.', status: 400 };
      o.roles[r.id] = cur;
    }
    if (patch.subtrack) {
      const s = C.subtrack(patch.subtrack.id); if (!s) return { error: 'Unknown subtrack.', status: 404 };
      const cur = o.subtracks[s.id] || {};
      if (patch.subtrack.prereq !== undefined) {
        if (!Array.isArray(patch.subtrack.prereq) || patch.subtrack.prereq.some((id) => !C.subtrack(id) || id === s.id)) return { error: 'Prerequisites must be other known subtracks.', status: 400 };
        cur.prereq = [...new Set(patch.subtrack.prereq)];
      }
      if (patch.subtrack.structure_status) { if (!['draft', 'reviewed', 'published'].includes(patch.subtrack.structure_status)) return { error: 'Unknown status.', status: 400 }; cur.structure_status = patch.subtrack.structure_status; }
      o.subtracks[s.id] = cur;
      // cycle check over the merged graph
      const pre = (id) => (o.subtracks[id]?.prereq || C.subtrack(id).prereq);
      const colour = new Map(); let cycle = null;
      const dfs = (id, path) => { colour.set(id, 1); for (const p of pre(id)) { if (colour.get(p) === 1) cycle = cycle || [...path, id, p]; else if (!colour.get(p)) dfs(p, [...path, id]); } colour.set(id, 2); };
      for (const x of C.SUBTRACKS) if (!colour.get(x.id)) dfs(x.id, []);
      if (cycle) return { error: `That change creates a prerequisite cycle: ${cycle.join(' -> ')}`, status: 400 };
    }
    settings().career_curriculum = o; save();
    audit(actorId, 'career_curriculum_update', 'career_curriculum', patch.role?.id || patch.subtrack?.id || '', {});
    return { ok: true };
  }

  /* -------------------------------- questions -------------------------------- */
  const qs = () => { const s = settings(); if (!s.career_stq) s.career_stq = { status: {}, edits: {}, custom: [], history: {}, verify: {} }; return s.career_stq; };
  const banks = () => ({ ...BUILT_IN, ...extraBanks });
  /** Effective current version of every question for a subtrack (built-in + admin-added), with validation. */
  function questions(subtrackId) {
    const st = qs(), s = subtrack(subtrackId);
    const base = (banks()[subtrackId]?.questions || []).map((q) => ({ ...q, ...(st.edits[q.id] || {}) }));
    const custom = st.custom.filter((q) => q.subtrack === subtrackId);
    return [...base, ...custom].map((q) => {
      const edited = !!st.edits[q.id];
      const status = st.status[q.id]?.status || (edited ? 'draft' : q.status || 'draft');
      const v = validateQuestion(q, s), ver = (st.verify || {})[q.id];
      // Admin-added or edited code questions carry the result of executing them.
      if (ver && ver.version === (q.version || 1) && !ver.ok) v.errors.push(ver.problem);
      return { ...q, subtrack: subtrackId, status, errors: v.errors, warnings: v.warnings, review: st.status[q.id] || null };
    });
  }
  const questionById = (subtrackId, id) => questions(subtrackId).find((q) => q.id === id) || null;
  const eligible = (subtrackId, statuses = ['reviewed', 'published']) => questions(subtrackId).filter((q) => statuses.includes(q.status) && !q.errors.length);
  function setQuestionStatus(subtrackId, ids, status, actorId) {
    if (!['draft', 'reviewed', 'published', 'retired'].includes(status)) return { error: 'Unknown status.', status: 400 };
    const st = qs(), all = new Map(questions(subtrackId).map((q) => [q.id, q])); let n = 0; const refused = [];
    for (const id of [].concat(ids)) {
      const q = all.get(id); if (!q) continue;
      if (['reviewed', 'published'].includes(status) && q.errors.length) { refused.push(id); continue; }
      st.status[id] = { status, by: actorId, at: iso() }; n++;
    }
    save(); audit(actorId, 'career_st_question_status', 'career_st_question', String(ids).slice(0, 200), { status, count: n });
    return { updated: n, refused };
  }
  /** An edit is a new version and returns to draft; earlier versions are kept for historical results. */
  function editQuestion(subtrackId, id, patch, actorId) {
    const cur = questionById(subtrackId, id); if (!cur) return { error: 'Question not found.', status: 404 };
    const fields = ['prompt', 'code', 'options', 'answer', 'explanation', 'why', 'difficulty', 'type', 'scenario', 'comp', 'expect'];
    const next = { ...cur }; for (const f of fields) if (patch[f] !== undefined) next[f] = patch[f];
    next.version = (cur.version || 1) + 1;
    const v = validateQuestion(next, subtrack(subtrackId));
    const st = qs();
    (st.history[id] = st.history[id] || []).push({ ...Object.fromEntries(fields.map((f) => [f, cur[f]])), version: cur.version, superseded_at: iso() });
    const custom = st.custom.find((q) => q.id === id);
    if (custom) Object.assign(custom, Object.fromEntries(fields.map((f) => [f, next[f]])), { version: next.version });
    else st.edits[id] = { ...Object.fromEntries(fields.map((f) => [f, next[f]])), version: next.version };
    st.status[id] = { status: 'draft', by: actorId, at: iso() };
    const vc = verifyCode(next);
    if (vc.ran) { (st.verify = st.verify || {})[id] = { ok: vc.ok, problem: vc.problem || null, version: next.version, at: iso() }; if (!vc.ok) v.errors.push(vc.problem); }
    save(); audit(actorId, 'career_st_question_edit', 'career_st_question', id, { version: next.version });
    return { question: questionById(subtrackId, id), errors: v.errors, warnings: v.warnings };
  }
  /** Import a validated batch as drafts. Invalid items are reported and not imported. */
  function importQuestions(subtrackId, items, actorId) {
    const s = subtrack(subtrackId); if (!s) return { error: 'Unknown subtrack.', status: 404 };
    if (!Array.isArray(items) || !items.length || items.length > 500) return { error: 'Send between 1 and 500 questions.', status: 400 };
    const st = qs(), existing = new Set(questions(subtrackId).map((q) => q.id)), report = [], added = [];
    for (const raw of items) {
      const q = { id: String(raw.id || `${subtrackId}-x-${crypto.randomBytes(3).toString('hex')}`), comp: raw.comp, difficulty: raw.difficulty, type: raw.type, scenario: raw.scenario || null,
        scenario_origin: raw.scenario ? (raw.scenario_origin || 'original') : null, prompt: raw.prompt, code: raw.code || null, options: raw.options, answer: raw.answer,
        explanation: raw.explanation, why: raw.why, expect: raw.expect ?? null, lang: raw.lang || (raw.code ? 'python' : null), version: 1, subtrack: subtrackId, status: 'draft', author: actorId };
      const v = validateQuestion(q, s);
      if (existing.has(q.id)) v.errors.push('a question with this id already exists');
      if (!v.errors.length) { const vc = verifyCode(q); if (vc.ran && !vc.ok) v.errors.push(vc.problem); }
      if (v.errors.length) { report.push({ id: q.id, errors: v.errors }); continue; }
      st.custom.push(q); existing.add(q.id); added.push(q.id);
    }
    save(); audit(actorId, 'career_st_question_import', 'career_st_question', subtrackId, { added: added.length, rejected: report.length });
    return { added, rejected: report };
  }

  /* ------------------------------ coverage & state ------------------------------ */
  const competencies = (s) => s.modules.flatMap((m) => m.objectives.map((o) => ({ ...o, module: m.id, module_title: m.title, rel: o.id.slice(s.id.length + 1) })));
  /** Can the given pool fill the blueprint? Returns reasons when it cannot. */
  function coverage(subtrackId, statuses = ['reviewed', 'published']) {
    const s = subtrack(subtrackId), cfg = config(), pool = eligible(subtrackId, statuses), all = questions(subtrackId);
    const n = cfg.items, q = quota(n, cfg.mix), needScenario = Math.ceil((n * cfg.scenario_share) / 100);
    const byDiff = Object.fromEntries(DIFF_KEYS.map((k) => [k, pool.filter((x) => x.difficulty === k).length]));
    const comps = competencies(s), byComp = Object.fromEntries(comps.map((c) => [c.rel, pool.filter((x) => x.comp === c.rel).length]));
    const reasons = [];
    if (pool.length < n) reasons.push(`Only ${pool.length} usable reviewed questions; a form needs ${n}.`);
    for (const k of DIFF_KEYS) if (byDiff[k] < q[k]) reasons.push(`Needs at least ${q[k]} ${k} questions (has ${byDiff[k]}).`);
    const scen = pool.filter((x) => x.scenario).length;
    if (scen < needScenario) reasons.push(`Needs at least ${needScenario} workplace-scenario questions (has ${scen}).`);
    const under = comps.filter((c) => byComp[c.rel] < (c.critical ? cfg.critical_min_items : 1));
    for (const c of under) reasons.push(`Competency ${c.rel} (${c.text}) has ${byComp[c.rel]} usable questions; needs ${c.critical ? cfg.critical_min_items : 1}${c.critical ? ' because it is critical' : ''}.`);
    return { feasible: !reasons.length, reasons, pool: pool.length, total: all.length, errors: all.filter((x) => x.errors.length).length,
      by_difficulty: byDiff, scenario: scen, by_competency: byComp, under_covered: under.map((c) => c.rel),
      unrestricted: pool.length >= cfg.unrestricted_bank, quota: q, need_scenario: needScenario };
  }
  const assessState = () => { const s = settings(); if (!s.career_st_assess) s.career_st_assess = {}; return s.career_st_assess; };
  /** An admin decision stored in settings wins; otherwise the approval shipped with the bank (questions/index.js). */
  const builtInPub = (id) => (APPROVED[id] && !extraBanks[id] ? { published: true, by: APPROVED[id].by, at: APPROVED[id].at, version: APPROVED[id].version, built_in: true } : null);
  const pubRecord = (id) => assessState()[id] || builtInPub(id);
  /** planned | draft | ready (coverage OK, awaiting admin publish) | published */
  function assessmentStatus(subtrackId) {
    const total = questions(subtrackId).length;
    if (!total) return { state: 'planned', label: 'Assessment in preparation' };
    const pub = pubRecord(subtrackId);
    if (pub?.published) {
      const cov = coverage(subtrackId, ['published']);
      if (!cov.feasible) return { state: 'draft', label: 'Assessment in preparation', reasons: cov.reasons };
      return { state: 'published', label: 'Assessment available', retakes: cov.unrestricted ? 'unrestricted' : 'limited', version: pub.version, published_at: pub.at };
    }
    const cov = coverage(subtrackId);
    return cov.feasible ? { state: 'ready', label: 'Assessment in review' } : { state: 'draft', label: 'Assessment in preparation', reasons: cov.reasons };
  }
  function publishAssessment(subtrackId, actorId) {
    if (!subtrack(subtrackId)) return { error: 'Unknown subtrack.', status: 404 };
    const cov = coverage(subtrackId);
    if (!cov.feasible) return { error: 'This assessment cannot be published yet: ' + cov.reasons.join(' '), status: 409, reasons: cov.reasons };
    const st = qs();
    for (const q of eligible(subtrackId, ['reviewed'])) st.status[q.id] = { status: 'published', by: actorId, at: iso() };
    const cur = pubRecord(subtrackId);
    assessState()[subtrackId] = { published: true, by: actorId, at: iso(), version: (cur?.version || 0) + 1 };
    save(); audit(actorId, 'career_st_assessment_publish', 'career_st_assessment', subtrackId, { version: assessState()[subtrackId].version });
    return { status: assessmentStatus(subtrackId) };
  }
  function unpublishAssessment(subtrackId, actorId) {
    if (!assessState()[subtrackId] && builtInPub(subtrackId)) assessState()[subtrackId] = { ...builtInPub(subtrackId) };
    const cur = assessState()[subtrackId]; if (!cur) return { error: 'Not published.', status: 404 };
    cur.published = false; cur.unpublished_at = iso(); save();
    audit(actorId, 'career_st_assessment_unpublish', 'career_st_assessment', subtrackId, {});
    return { status: assessmentStatus(subtrackId) };
  }

  /* -------------------------------- assembly -------------------------------- */
  /**
   * Build one form: critical competencies first (critical_min_items each),
   * then one item for every other competency, then fill the difficulty quota
   * while reaching the scenario share. Unseen questions are always preferred.
   */
  function assemble(pool, { n, mix, scenarioShare, seen = new Set(), seed = 1, comps = [], criticalMin = 2, perGroup = null }) {
    const rand = rng(seed), q = quota(n, mix), needScen = Math.ceil((n * scenarioShare) / 100);
    const items = shuffle(pool, rand).sort((a, b) => (seen.has(a.id) - seen.has(b.id)));
    const picked = [], used = new Set(), left = { ...q };
    const scenCount = () => picked.filter((x) => x.scenario).length;
    const score = (x) => (seen.has(x.id) ? 10 : 0) + (left[x.difficulty] > 0 ? 0 : 5) + (scenCount() < needScen && !x.scenario ? 1 : 0);
    const take = (x) => { picked.push(x); used.add(x.key || x.id); left[x.difficulty]--; };
    const best = (cands) => cands.filter((x) => !used.has(x.key || x.id)).sort((a, b) => score(a) - score(b))[0];
    for (const c of comps.filter((c) => c.critical)) for (let i = 0; i < criticalMin && picked.length < n; i++) { const x = best(items.filter((y) => y.compKey === c.key)); if (x) take(x); }
    for (const c of comps.filter((c) => !c.critical)) { if (picked.length >= n) break; const x = best(items.filter((y) => y.compKey === c.key)); if (x) take(x); }
    if (perGroup) for (const [g, min] of Object.entries(perGroup)) while (picked.filter((x) => x.group === g).length < min && picked.length < n) { const x = best(items.filter((y) => y.group === g)); if (!x) break; take(x); }
    while (picked.length < n) {
      const needD = DIFF_KEYS.filter((k) => left[k] > 0), wantScen = scenCount() < needScen;
      const x = best(items.filter((y) => (!needD.length || needD.includes(y.difficulty)) && (!wantScen || y.scenario)))
        || best(items.filter((y) => !needD.length || needD.includes(y.difficulty))) || best(items);
      if (!x) break; take(x);
    }
    return shuffle(picked, rand);
  }
  const publicQ = (q, order) => {
    const opts = order.map((i) => ({ id: String(i), text: q.options[i] }));
    return { id: q.id, prompt: q.prompt, code: q.code, lang: q.lang, type: q.type, options: opts, difficulty: q.difficulty, scenario: !!q.scenario };
  };

  /* ------------------------------ student records ------------------------------ */
  const stOf = (user) => career(user).st || { attempts: [], active: null, results: {} };
  function writeSt(user, st) { writeCareer(user, { ...career(user), st: { ...st, attempts: (st.attempts || []).slice(-150) } }); }
  function resultFor(user, subtrackId) {
    const r = stOf(user).results[subtrackId];
    if (!r) return { status: 'not_attempted', label: STATUS_TEXT.not_attempted, attempts: 0 };
    const expired = r.status === 'passed' && r.valid_until && Date.parse(r.valid_until) < now().getTime();
    return { ...r, status: expired ? 'expired' : r.status, label: STATUS_TEXT[expired ? 'expired' : r.status] };
  }

  function canStart(user, key) {
    const cfg = config(), st = stOf(user);
    if (!isLearner(user)) return { error: 'Assessments are for learner accounts.', status: 403 };
    if (st.active && Date.parse(st.active.expires_at) > now().getTime()) return { error: 'Finish or submit your current assessment first.', status: 409, active: { id: st.active.id, key: st.active.key } };
    const last = [...st.attempts].reverse().find((a) => a.key === key);
    if (last) {
      const limited = key.startsWith('subtrack:') && assessmentStatus(key.slice(9)).retakes === 'limited';
      const waitMs = limited ? cfg.limited_retake_days * 86400e3 : cfg.retake_hours * 3600e3;
      const at = Date.parse(last.submitted_at) + waitMs;
      if (at > now().getTime()) return { error: limited ? `This assessment's question bank is still growing, so a fresh retake opens on ${new Date(at).toISOString().slice(0, 10)}.` : `You can retake this assessment after ${new Date(at).toISOString().slice(0, 16).replace('T', ' ')} UTC.`, status: 429, retry_at: new Date(at).toISOString() };
    }
    return null;
  }
  function seenIds(user, ids) { const set = new Set(); for (const a of stOf(user).attempts) for (const it of a.items || []) if (ids.has(it.id)) set.add(it.id); return set; }

  /** Start a subtrack comprehensive assessment. */
  function startSubtrack(user, subtrackId) {
    const s = subtrack(subtrackId); if (!s) return { error: 'Subtrack not found.', status: 404 };
    const status = assessmentStatus(subtrackId);
    if (status.state !== 'published') return { error: 'This assessment is not available yet.', status: 409 };
    const block = canStart(user, 'subtrack:' + subtrackId); if (block) return block;
    const cfg = config(), pool = eligible(subtrackId, ['published']).map((q) => ({ ...q, compKey: q.comp }));
    const comps = competencies(s).map((c) => ({ key: c.rel, critical: c.critical }));
    const form = assemble(pool, { n: cfg.items, mix: cfg.mix, scenarioShare: cfg.scenario_share, seen: seenIds(user, new Set(pool.map((q) => q.id))), seed: crypto.randomInt(1, 2 ** 31), comps, criticalMin: cfg.critical_min_items });
    return begin(user, { key: 'subtrack:' + subtrackId, title: `${s.title}: comprehensive assessment`, minutes: cfg.minutes, form, assessment_version: status.version });
  }
  function begin(user, { key, title, minutes, form, assessment_version }) {
    const rand = rng(crypto.randomInt(1, 2 ** 31));
    const items = form.map((q) => ({ id: q.id, subtrack: q.subtrack, version: q.version || 1, order: shuffle([0, 1, 2, 3], rand) }));
    const st = stOf(user);
    const attempt = { id: 'sta_' + crypto.randomBytes(8).toString('hex'), key, title, items, started_at: iso(), expires_at: new Date(now().getTime() + minutes * 60e3).toISOString(),
      config_version: config().version, assessment_version: assessment_version || null, answers: {} };
    writeSt(user, { ...st, active: attempt });
    return { attempt: publicAttempt(attempt) };
  }
  function publicAttempt(a) {
    return { id: a.id, key: a.key, title: a.title, started_at: a.started_at, expires_at: a.expires_at, answers: a.answers || {},
      questions: a.items.map((it) => { const q = questionAt(it.subtrack, it.id, it.version); return q ? publicQ(q, it.order) : null; }).filter(Boolean) };
  }
  /** The exact question version a student saw (edits keep history). */
  function questionAt(subtrackId, id, version) {
    const cur = questionById(subtrackId, id); if (!cur) return null;
    if ((cur.version || 1) === version) return cur;
    const h = (qs().history[id] || []).find((x) => x.version === version);
    return h ? { ...cur, ...h } : cur;
  }
  function resume(user) { const a = stOf(user).active; return { attempt: a && Date.parse(a.expires_at) + 120e3 > now().getTime() ? publicAttempt(a) : null }; }
  function saveAnswers(user, attemptId, answers) {
    const st = stOf(user), a = st.active; if (!a || a.id !== attemptId) return { error: 'Attempt not found.', status: 404 };
    const ids = new Set(a.items.map((i) => i.id));
    a.answers = Object.fromEntries(Object.entries(answers || {}).filter(([k, v]) => ids.has(k) && ['0', '1', '2', '3'].includes(String(v))).map(([k, v]) => [k, String(v)]));
    writeSt(user, { ...st, active: a });
    return { ok: true };
  }

  /** Grade on the server. Idempotent: re-submitting returns the stored result. */
  function submit(user, attemptId, answers) {
    const st = stOf(user);
    const done = st.attempts.find((x) => x.id === attemptId);
    if (done) return { result: publicResult(done), existing: true };
    const a = st.active; if (!a || a.id !== attemptId) return { error: 'Attempt not found.', status: 404 };
    const late = now().getTime() > Date.parse(a.expires_at) + 120e3;
    const given = late ? (a.answers || {}) : { ...(a.answers || {}), ...Object.fromEntries(Object.entries(answers || {}).map(([k, v]) => [k, String(v)])) };
    const cfg = config(), responses = [];
    for (const it of a.items) {
      const q = questionAt(it.subtrack, it.id, it.version); if (!q) continue;
      const pick = given[it.id], answered = ['0', '1', '2', '3'].includes(pick), correct = answered && Number(pick) === q.answer;
      responses.push({ id: q.id, subtrack: it.subtrack, version: it.version, comp: q.comp, difficulty: q.difficulty, scenario: !!q.scenario, answered, correct, pick: answered ? Number(pick) : null, weight: cfg.weights[q.difficulty] || 1 });
    }
    const result = score(a.key, responses, cfg);
    const attempt = { id: a.id, key: a.key, title: a.title, items: a.items, started_at: a.started_at, submitted_at: iso(), timed_out: late, config_version: a.config_version, assessment_version: a.assessment_version, responses, result };
    const results = { ...st.results };
    if (a.key.startsWith('subtrack:')) {
      const sid = a.key.slice(9), prev = results[sid] || {};
      results[sid] = {
        status: result.outcome, last_score: result.overall, best_score: Math.max(prev.best_score || 0, result.overall), attempts: (prev.attempts || 0) + 1,
        last_attempt_id: a.id, last_at: attempt.submitted_at,
        passed_at: result.outcome === 'passed' ? attempt.submitted_at : (prev.status === 'passed' ? prev.passed_at : null),
        valid_until: result.outcome === 'passed' ? new Date(now().getTime() + cfg.evidence_valid_days * 86400e3).toISOString() : (prev.status === 'passed' ? prev.valid_until : null),
        evidence: Object.fromEntries(Object.entries(result.competencies).map(([k, v]) => [k, { score: v.score, answered: v.answered, at: attempt.submitted_at }])),
        assessment_version: a.assessment_version,
      };
      // A later lower score never erases an earlier valid pass: keep the pass on record.
      if (prev.status === 'passed' && result.outcome !== 'passed' && Date.parse(prev.valid_until) > now().getTime()) results[sid].status = 'passed';
    }
    if (a.key.startsWith('role:')) results['role:' + a.key.slice(5)] = { status: result.outcome, last_score: result.overall, last_attempt_id: a.id, last_at: attempt.submitted_at, passed_at: result.outcome === 'passed' ? attempt.submitted_at : null };
    writeSt(user, { ...st, active: null, attempts: [...st.attempts, attempt], results });
    return { result: publicResult(attempt) };
  }

  /** Overall, competency, module, difficulty and scenario breakdowns, and the outcome. */
  function score(key, responses, cfg) {
    const pct = (e, p) => (p ? Math.round((e / p) * 100) : null);
    const tally = () => ({ items: 0, answered: 0, correct: 0, earned: 0, possible: 0 });
    const add = (t, r) => { t.items++; if (r.answered) t.answered++; if (r.correct) t.correct++; t.possible += r.weight; if (r.correct) t.earned += r.weight; };
    const all = tally(), byDiff = {}, byScen = { scenario: tally(), foundational: tally() }, byComp = {}, byMod = {}, bySub = {};
    for (const r of responses) {
      add(all, r); add(byDiff[r.difficulty] = byDiff[r.difficulty] || tally(), r); add(byScen[r.scenario ? 'scenario' : 'foundational'], r);
      const ck = `${r.subtrack}.${r.comp}`, mk = `${r.subtrack}.${r.comp.split('.')[0]}`;
      add(byComp[ck] = byComp[ck] || tally(), r); add(byMod[mk] = byMod[mk] || tally(), r); add(bySub[r.subtrack] = bySub[r.subtrack] || tally(), r);
    }
    const fin = (t) => ({ ...t, score: pct(t.earned, t.possible) });
    const overall = pct(all.earned, all.possible) ?? 0;
    const competencies = {};
    for (const [ck, t] of Object.entries(byComp)) {
      const c = C.competency(ck); competencies[ck] = { ...fin(t), text: c?.competency.text, critical: !!c?.competency.critical, module: c?.module, subtrack: c?.subtrack };
    }
    // Which competencies the blueprint expected (subtrack: all of its competencies; role: those delivered).
    const expected = key.startsWith('subtrack:') ? subtrack(key.slice(9)).modules.flatMap((m) => m.objectives.map((o) => o.id)) : Object.keys(competencies);
    const unassessed = expected.filter((id) => !competencies[id] || competencies[id].answered === 0);
    const criticalGaps = Object.entries(competencies).filter(([, v]) => v.critical && (v.answered < Math.min(cfg.critical_min_items, v.items) || (v.score ?? 0) < cfg.critical_min)).map(([k]) => k);
    const outcome = overall < cfg.pass_overall ? 'learning_recommended' : (criticalGaps.length || unassessed.filter((id) => C.competency(id)?.competency.critical || key.startsWith('subtrack:')).length ? 'further_evidence_required' : 'passed');
    const ranked = Object.entries(competencies).filter(([, v]) => v.answered).sort((a, b) => (b[1].score - a[1].score));
    return {
      overall, outcome, outcome_label: STATUS_TEXT[outcome], pass_mark: cfg.pass_overall, critical_min: cfg.critical_min,
      answered: all.answered, total: all.items, correct: all.correct,
      by_difficulty: Object.fromEntries(DIFF_KEYS.filter((k) => byDiff[k]).map((k) => [k, fin(byDiff[k])])),
      by_scenario: { scenario: fin(byScen.scenario), foundational: fin(byScen.foundational) },
      competencies, modules: Object.fromEntries(Object.entries(byMod).map(([k, t]) => [k, fin(t)])), subtracks: Object.fromEntries(Object.entries(bySub).map(([k, t]) => [k, fin(t)])),
      critical_gaps: criticalGaps, unassessed,
      strongest: ranked.slice(0, 3).map(([k]) => k), weakest: ranked.slice(-3).reverse().filter(([, v]) => v.score < 100).map(([k]) => k),
    };
  }
  /** What students see after submitting. Learning areas name real planned modules; lessons are marked as in preparation. */
  function publicResult(a) {
    const r = a.result, cfg = config();
    const weakComps = Object.entries(r.competencies).filter(([, v]) => (v.score ?? 0) < cfg.critical_min || r.critical_gaps.includes(v)).map(([k]) => k);
    const weakMods = [...new Set([...weakComps, ...r.critical_gaps, ...r.unassessed].map((k) => C.competency(k)?.module).filter(Boolean))];
    const describe = (k) => { const c = C.competency(k); const s = c && subtrack(c.subtrack); const m = s && s.modules.find((x) => x.id === c.module); return c ? { id: k, text: c.competency.text, critical: c.competency.critical, module: m?.title, subtrack: s?.title, ...(r.competencies[k] ? { score: r.competencies[k].score, answered: r.competencies[k].answered, items: r.competencies[k].items } : { score: null, answered: 0, items: 0 }) } : null; };
    return {
      id: a.id, key: a.key, title: a.title, submitted_at: a.submitted_at, timed_out: a.timed_out, label: READINESS_LABEL,
      overall: r.overall, outcome: r.outcome, outcome_label: r.outcome_label, pass_mark: r.pass_mark, critical_min: r.critical_min,
      answered: r.answered, total: r.total, correct: r.correct,
      by_difficulty: r.by_difficulty, by_scenario: r.by_scenario,
      competencies: Object.keys(r.competencies).map(describe).filter(Boolean),
      strongest: r.strongest.map(describe).filter(Boolean), weakest: r.weakest.map(describe).filter(Boolean),
      critical_gaps: r.critical_gaps.map(describe).filter(Boolean), unassessed: r.unassessed.map(describe).filter(Boolean),
      learning_areas: weakMods.map((mid) => { const s = C.SUBTRACKS.find((x) => x.modules.some((m) => m.id === mid)), m = s.modules.find((x) => x.id === mid); return { module: m.title, subtrack: s.title, objectives: m.objectives.map((o) => o.text), content: 'Learning content in preparation' }; }),
      note: 'This shows the knowledge measured by this quiz. It is not proof of professional coding ability or job readiness.',
    };
  }
  /**
   * Per-question review after submitting. The answer key is NOT revealed: the
   * same reviewed bank serves future retakes, so students see which items
   * they got right, the competency each one measured, and the explanation
   * only for items they answered correctly.
   */
  function attemptReview(user, attemptId) {
    const a = stOf(user).attempts.find((x) => x.id === attemptId); if (!a) return null;
    return a.responses.map((r) => { const q = questionAt(r.subtrack, r.id, r.version); if (!q) return null; const c = C.competency(`${r.subtrack}.${r.comp}`);
      return { id: q.id, prompt: q.prompt, code: q.code, correct: r.correct, answered: r.answered, difficulty: q.difficulty, scenario: !!q.scenario, competency: c?.competency.text || r.comp, explanation: r.correct ? q.explanation : null }; }).filter(Boolean);
  }
  function history(user, subtrackId) { return stOf(user).attempts.filter((a) => !subtrackId || a.key === 'subtrack:' + subtrackId || a.key === subtrackId).map(publicResult).reverse(); }

  /* --------------------------------- roles --------------------------------- */
  function roleAssessmentStatus(r) {
    const path = rolePath(r), missing = path.required.filter((id) => assessmentStatus(id).state !== 'published');
    return missing.length ? { state: 'blueprint', label: 'Final assessment blueprint ready; opens when every required subtrack assessment is published', missing } : { state: 'published', label: 'Final assessment available' };
  }
  function roleReadiness(user, r) {
    const path = rolePath(r);
    const sub = path.required.map((id) => ({ id, ...resultFor(user, id) }));
    const passed = sub.filter((x) => x.status === 'passed').length;
    const final = stOf(user).results['role:' + r.id] || null;
    const ready = passed === sub.length && final?.status === 'passed';
    return { label: READINESS_LABEL, ready, required: sub.length, passed, final_assessment: final, final_status: roleAssessmentStatus(r),
      text: ready ? `${READINESS_LABEL}: all assessed requirements met` : `${passed} of ${sub.length} required subtracks passed${final?.status === 'passed' ? '' : '; role final assessment not passed yet'}` };
  }
  /** 60-question cumulative assessment drawn from every required subtrack's published bank. */
  function startRole(user, roleId) {
    const r = role(roleId); if (!r) return { error: 'Job role not found.', status: 404 };
    const st = roleAssessmentStatus(r); if (st.state !== 'published') return { error: 'This role final assessment opens when every required subtrack assessment is published.', status: 409, missing: st.missing };
    const block = canStart(user, 'role:' + roleId); if (block) return block;
    const cfg = config(), path = rolePath(r);
    const pool = path.required.flatMap((id) => eligible(id, ['published']).map((q) => ({ ...q, subtrack: id, key: `${id}:${q.id}`, compKey: `${id}.${q.comp}`, group: id })));
    const comps = path.required.flatMap((id) => competencies(subtrack(id)).filter((c) => c.critical).map((c) => ({ key: `${id}.${c.rel}`, critical: true })));
    const perGroup = Object.fromEntries(path.required.map((id) => [id, 2]));
    const form = assemble(pool, { n: cfg.role_items, mix: cfg.mix, scenarioShare: cfg.scenario_share, seen: seenIds(user, new Set(pool.map((q) => q.id))), seed: crypto.randomInt(1, 2 ** 31), comps, criticalMin: 1, perGroup });
    return begin(user, { key: 'role:' + roleId, title: `${r.title}: final assessment`, minutes: cfg.role_minutes, form, assessment_version: 1 });
  }

  /* ------------------------------- public views ------------------------------- */
  function subtrackSummary(user, id) {
    const s = subtrack(id), a = assessmentStatus(id);
    return { id, title: s.title, level: s.level, depth: s.depth, hours: s.hours, kind: s.kind, modules: s.modules.length, prereq: s.prereq,
      assessment: { state: a.state, label: a.label, retakes: a.retakes || null }, student: user ? resultFor(user, id) : null };
  }
  function trackView(user, slug) {
    const t = C.TRACKS[slug]; if (!t) return null;
    const roles = allRoles().filter((r) => r.track === slug);
    return {
      track: slug,
      order: t.order.map((e) => ({ title: e.title, subtracks: e.subtracks.map((id) => subtrackSummary(user, id)) })),
      variants: (t.variants || []).filter((id) => !t.order.some((e) => e.subtracks.includes(id))).map((id) => subtrackSummary(user, id)),
      roles: roles.map((r) => { const p = rolePath(r); return { id: r.id, title: r.title, description: r.description, required: p.required.length, optional: p.optional.length, jd_status: r.jd.status, readiness: user ? roleReadiness(user, r) : null }; }),
      label: READINESS_LABEL,
    };
  }
  function subtrackView(user, id) {
    const s = subtrack(id); if (!s) return null;
    const cfg = config(), a = assessmentStatus(id), u = C.usage(id);
    return {
      id, title: s.title, description: s.description, level: s.level, depth: s.depth, hours: s.hours, kind: s.kind, structure_status: s.structure_status,
      prereq: s.prereq.map((p) => ({ id: p, title: subtrack(p)?.title, student: user ? resultFor(user, p) : null })),
      modules: s.modules.map((m) => ({ id: m.id, title: m.title, objectives: m.objectives.map((o) => ({ id: o.id, text: o.text, critical: o.critical })), content: 'Learning content in preparation' })),
      tracks: u.tracks, roles: u.roles.map((x) => ({ ...x, title: C.role(x.id)?.title })),
      assessment: { ...a, items: cfg.items, minutes: cfg.minutes, pass_mark: cfg.pass_overall, critical_min: cfg.critical_min, mix: cfg.mix, scenario_share: cfg.scenario_share },
      student: user ? { ...resultFor(user, id), attempts_list: history(user, id).slice(0, 10) } : null,
      label: READINESS_LABEL,
    };
  }
  function roleView(user, id) {
    const r = role(id); if (!r) return null;
    const p = rolePath(r);
    return {
      id: r.id, title: r.title, track: r.track, description: r.description, responsibilities: r.responsibilities,
      required: p.required.map((x) => ({ ...subtrackSummary(user, x), prerequisite_added: p.prerequisites_added.includes(x) })),
      optional: p.optional.map((x) => subtrackSummary(user, x)),
      jd: { status: r.jd.status, observed: r.jd.observed, references: r.jd.references.map((x) => ({ title: x.title, employer: x.employer, location: x.location, accessed: x.accessed, verified: x.verified })) },
      final_assessment: { ...roleAssessmentStatus(r), items: config().role_items, minutes: config().role_minutes },
      readiness: user ? roleReadiness(user, r) : null, label: READINESS_LABEL,
    };
  }

  /* ---------------------------------- admin ---------------------------------- */
  function itemStats() {
    const stats = {};
    for (const u of users()) for (const a of (career(u).st?.attempts || [])) for (const r of a.responses || []) {
      const s = stats[r.id] = stats[r.id] || { answered: 0, correct: 0 }; if (r.answered) { s.answered++; if (r.correct) s.correct++; }
    }
    for (const s of Object.values(stats)) s.p_correct = s.answered ? +(s.correct / s.answered).toFixed(2) : null;
    return stats;
  }
  function qaDashboard() {
    const rows = C.SUBTRACKS.map((s0) => {
      const s = subtrack(s0.id), all = questions(s.id), cov = all.length ? coverage(s.id) : null, a = assessmentStatus(s.id);
      return { id: s.id, title: s.title, level: s.level, structure_status: s.structure_status, competencies: competencies(s).length,
        questions: all.length, reviewed: all.filter((q) => q.status === 'reviewed').length, published: all.filter((q) => q.status === 'published').length, errors: all.filter((q) => q.errors.length).length,
        warnings: all.filter((q) => q.warnings.length).length, assessment: a.state, coverage_ok: !!cov?.feasible, unrestricted: !!cov?.unrestricted, under_covered: cov ? cov.under_covered.length : competencies(s).length };
    });
    const roles = allRoles().map((r) => { const p = rolePath(r), missing = p.required.filter((id) => assessmentStatus(id).state !== 'published'); return { id: r.id, title: r.title, track: r.track, required: p.required.length, missing: missing.length, jd_status: r.jd.status, status: r.status }; });
    const v = C.validate();
    return {
      totals: {
        planned_subtracks: rows.length, finalized_blueprints: rows.filter((r) => ['reviewed', 'published'].includes(r.structure_status)).length,
        banks_started: rows.filter((r) => r.questions).length, banks_complete: rows.filter((r) => r.coverage_ok).length, banks_unrestricted: rows.filter((r) => r.unrestricted).length,
        published_assessments: rows.filter((r) => r.assessment === 'published').length, questions: rows.reduce((a, r) => a + r.questions, 0),
        roles: roles.length, roles_complete: roles.filter((r) => !r.missing).length, roles_jd_unverified: roles.filter((r) => r.jd_status !== 'jd_reviewed').length,
      },
      subtracks: rows, roles, catalog_errors: v.errors, catalog_warnings: v.warnings,
    };
  }
  function adminQuestions(subtrackId, { difficulty, status } = {}) {
    const stats = itemStats(), cov = coverage(subtrackId), bank = validateBank(questions(subtrackId), subtrack(subtrackId));
    return {
      subtrack: subtrackView(null, subtrackId), coverage: cov, status: assessmentStatus(subtrackId), bank_warnings: bank.warnings, bank_errors: bank.errors,
      questions: questions(subtrackId).filter((q) => (!difficulty || q.difficulty === difficulty) && (!status || q.status === status))
        .map((q) => ({ ...q, stats: stats[q.id] || null, flag: stats[q.id] && stats[q.id].answered >= 10 && (stats[q.id].p_correct < 0.2 || stats[q.id].p_correct > 0.95) ? 'review: unusually hard or easy' : null })),
    };
  }
  function previewForm(subtrackId) {
    const s = subtrack(subtrackId); if (!s) return null;
    const cfg = config(), pool = eligible(subtrackId).map((q) => ({ ...q, compKey: q.comp }));
    const form = assemble(pool, { n: cfg.items, mix: cfg.mix, scenarioShare: cfg.scenario_share, seed: crypto.randomInt(1, 2 ** 31), comps: competencies(s).map((c) => ({ key: c.rel, critical: c.critical })), criticalMin: cfg.critical_min_items });
    const by = (f) => form.reduce((m, q) => (m[f(q)] = (m[f(q)] || 0) + 1, m), {});
    return { questions: form, by_difficulty: by((q) => q.difficulty), scenario: form.filter((q) => q.scenario).length, competencies: by((q) => q.comp) };
  }

  return {
    READINESS_LABEL, config, updateConfig, subtrack, role, allRoles, rolePath, updateStructure,
    questions, questionById, setQuestionStatus, editQuestion, importQuestions, coverage, assessmentStatus, publishAssessment, unpublishAssessment,
    startSubtrack, startRole, resume, saveAnswers, submit, attemptReview, history, resultFor,
    trackView, subtrackView, roleView, roleReadiness, qaDashboard, adminQuestions, previewForm, itemStats, quota,
  };
}

module.exports = { createCurriculumService, quota, DEFAULTS, READINESS_LABEL };
