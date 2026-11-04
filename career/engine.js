'use strict';
/**
 * Career assessment engine - pure, deterministic functions with no storage
 * access, so every rule can be unit-tested and every result explained.
 *
 * HYBRID ASSESSMENT. Every question is one of three evaluation categories:
 *   theory     conceptual knowledge (MCQ, multiple-select, code tracing, explanations)
 *   practical  hands-on implementation (debugging, fixing code/SQL/config, data tasks)
 *   scenario   applied problem-solving on real-world situations
 * Scores are kept per category, per skill, and per skill-and-category, and
 * an assessment's overall score is a configurable weighted mix of the three.
 *
 * GRADING. 'auto' items are graded by exact rules. 'review' items (written
 * explanations and practical submissions the server cannot run safely) wait
 * for a staff reviewer with a rubric; until reviewed they are PENDING and are
 * left out of every score rather than guessed. No LLM grade is ever used
 * here - AI can only suggest rubric scores to a human reviewer (service.js).
 *
 *   assembleForm   randomised form: per skill one theory, practical, scenario
 *   scoreAttempt   grade responses; summarise() rebuilds totals after review
 *   skillProfile   CURRENT assessed proficiency, from attempt history
 *   commonScore    weighted common-CS score
 *   categoryScores weighted theory / practical / scenario scores for skills
 *   trackReadiness overall score + level for a track, with caps and reasons
 *   skillGaps      prioritised gaps, each diagnosed by category
 *   recommendation concrete next steps that name the kind of weakness
 *   roadmap        six-stage personalised roadmap with a starting stage
 */

const CATEGORIES = ['theory', 'practical', 'scenario'];
const CATEGORY_LABEL = { theory: 'theoretical understanding', practical: 'practical implementation', scenario: 'real-world application' };
const CATEGORY_NAME = { theory: 'Theory', practical: 'Practical', scenario: 'Scenario' };

const DEFAULT_CONFIG = {
  version: 1,
  common_weights: { 'cs.programming': 30, 'cs.logic': 25, 'cs.computing': 15, 'cs.dsa_basics': 15, 'cs.git_tools': 10, 'cs.debugging': 5 },
  common_form: { 'cs.programming': 5, 'cs.logic': 4, 'cs.computing': 4, 'cs.dsa_basics': 4, 'cs.git_tools': 4, 'cs.debugging': 4 },
  // Every common and track assessment delivers at least this many MCQs.
  min_form_items: 25,
  // Default theory / practical / scenario weights; tracks may set their own
  // (tracks.js category_weights) and admins can override any of them.
  category_weights: { default: { theory: 40, practical: 35, scenario: 25 }, common: { theory: 50, practical: 30, scenario: 20 } },
  track_items_per_skill: 3,
  skill_reassess_items: 6,
  review_items_per_form: 0,
  bands: [
    { min: 0, level: 'Foundation' }, { min: 25, level: 'Beginner' }, { min: 50, level: 'Intermediate' },
    { min: 70, level: 'Proficient' }, { min: 85, level: 'Advanced' },
  ],
  skill_thresholds: { strong: 70, developing: 50 },
  min_evidence_items: 3,
  min_category_items: 2,
  min_confidence: 0.6,
  retake_cooldown_hours: 24,
  time_grace_sec: 120,
  recent_attempts_excluded: 2,
};

/* ------------------------------ seeded randomness ------------------------------ */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(list, rand) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const catOf = (q) => q.category || 'theory';

/* ---------------------------------- forms ---------------------------------- */
/**
 * Pick `plan[skill]` AUTO-graded questions per skill: one practical and one
 * scenario first (when the pool has an unseen one), then theory, so each
 * skill gets evidence in every category. Unseen questions are preferred over ones the
 * student met recently, and difficulty is spread from basic to advanced in
 * every category. Assessments are multiple-choice only.
 */
function assembleForm({ pool, plan, seen = new Set(), seed = 1 }) {
  const rand = rng(seed);
  const items = [], used = new Set(), shortfall = {};
  // Multiple-choice only: every delivered question has options and an answer key.
  // Typed answers and staff-reviewed submissions are never put on a form.
  const auto = pool.filter((q) => q.grading !== 'review' && Array.isArray(q.options) && q.options.length >= 2);
  let skillNo = 0;
  const fresh = (list) => [list.filter((c) => !seen.has(c.id)), list.filter((c) => seen.has(c.id))];
  for (const [skill, spec] of Object.entries(plan)) {
    // A plan entry is a count, or { n, depth } when the track needs evidence at a
    // minimum difficulty (assessment depth) for this skill.
    const want = typeof spec === 'object' ? spec.n : spec, depth = typeof spec === 'object' ? spec.depth || 0 : 0;
    const candidates = shuffle(auto.filter((q) => q.skills[0] === skill && !used.has(q.id)), rand);
    const picked = [];
    const take = (q) => { if (q && picked.length < want && !picked.includes(q)) picked.push(q); };
    // Category preference uses UNSEEN items only: on a retake, repeating the
    // same practical task would inflate the score. If every item of a category
    // was seen recently, the earlier evidence for it stays in the profile.
    // Rotate the preferred difficulty across skills so each category on the
    // form runs from basic to advanced (skill 1: practical easy / scenario
    // medium, skill 2: practical medium / scenario hard, ...).
    const rot = skillNo++;
    for (const [k, cat] of ['practical', 'scenario'].entries()) {
      const want = ((rot + k) % 3) + 1, unseen = candidates.filter((c) => catOf(c) === cat && !seen.has(c.id));
      const q = unseen.find((c) => c.difficulty === want) || unseen[0];
      if (q && !picked.some((p) => catOf(p) === cat)) take(q);
    }
    // Fill the remaining slots with theory first, spreading difficulty, so that
    // spare practical and scenario items stay unseen for the next retake.
    // Extra practical/scenario items are used only when theory runs out.
    const theoryFirst = (list) => [...list.filter((c) => catOf(c) === 'theory'), ...list.filter((c) => catOf(c) !== 'theory')];
    for (const group of fresh(candidates)) {
      const g = theoryFirst(group);
      // Theory difficulty also rotates by skill, so short forms (3 per skill) still span basic to advanced.
      const order = [0, 1, 2].map((k) => ((rot + 2 + k) % 3) + 1);
      for (const d of order) take(g.find((c) => c.difficulty === d && catOf(c) === 'theory' && !picked.includes(c)));
      // A second pass over practical and scenario by difficulty before any repeats of a level.
      for (const d of [1, 2, 3]) for (const cat of ['practical', 'scenario']) if (!picked.some((p) => catOf(p) === cat && p.difficulty === d)) take(g.find((c) => c.difficulty === d && catOf(c) === cat && !picked.includes(c)));
      for (const q of g) take(q);
    }
    if (depth && picked.length && !picked.some((q) => q.difficulty >= depth)) {
      const deep = [...fresh(candidates.filter((c) => c.difficulty >= depth && !picked.includes(c)))].flat()[0];
      const i = picked.map((q) => catOf(q)).lastIndexOf('theory');
      if (deep) picked[i >= 0 ? i : picked.length - 1] = deep;
    }
    if (picked.length < want) shortfall[skill] = want - picked.length;
    picked.forEach((q) => { used.add(q.id); items.push(q); });
  }
  return {
    items: shuffle(items, rand).map((q) => ({ id: q.id, version: q.version, order: q.options.length ? shuffle(q.options.map((o) => o.id), rand) : [] })),
    shortfall,
  };
}

/** What a student sees: no answer key, no explanation, no model answer. Rubric criteria are shown for reviewed items. */
function publicQuestion(q, order) {
  const byId = new Map(q.options.map((o) => [o.id, o]));
  return {
    id: q.id, type: q.type, prompt: q.prompt, code: q.code, points: q.points, time_sec: q.time_sec,
    category: catOf(q), practical: catOf(q) === 'practical', grading: q.grading || 'auto', multi: q.type === 'multi', run_lang: q.grading === 'review' ? q.run_lang || null : null,
    rubric: q.grading === 'review' ? (q.rubric || []).map((r) => ({ criterion: r.criterion, points: r.points })) : undefined,
    options: (order && order.length ? order : q.options.map((o) => o.id)).map((id) => byId.get(id)).filter(Boolean).map((o) => ({ id: o.id, text: o.text })),
  };
}

/* --------------------------------- grading --------------------------------- */
const normalizeTyped = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/^["']|["']$/g, '');
const isBlank = (a) => a == null || (Array.isArray(a) ? a.length === 0 : String(a).trim() === '');

/** Grade one response. Multiple-select: (right picks - wrong picks) / key size, never below 0. Reviewed items stay pending. */
function gradeResponse(q, answer) {
  if (isBlank(answer)) return { answered: false, earned: 0, correct: false };
  if (q.grading === 'review') return { answered: true, earned: null, correct: null, pending: true };
  if (q.type === 'output') {
    const ok = q.answer.map(normalizeTyped).includes(normalizeTyped(answer));
    return { answered: true, earned: ok ? q.points : 0, correct: ok };
  }
  const picks = [...new Set([].concat(answer).map(String))].filter((p) => q.options.some((o) => o.id === p));
  if (!picks.length) return { answered: false, earned: 0, correct: false };
  if (q.type === 'multi') {
    const right = picks.filter((p) => q.answer.includes(p)).length, wrong = picks.length - right;
    const frac = Math.max(0, (right - wrong) / q.answer.length);
    return { answered: true, earned: +(q.points * frac).toFixed(3), correct: frac === 1 };
  }
  const ok = picks.length === 1 && q.answer.includes(picks[0]);
  return { answered: true, earned: ok ? q.points : 0, correct: ok };
}

const pct = (earned, possible) => (possible ? Math.round((earned / possible) * 100) : null);
const blankTally = () => ({ answered: 0, possible: 0, earned: 0 });
const finishTally = (t) => ({ ...t, score: pct(t.earned, t.possible) });

/**
 * Totals from graded responses. A response counts only when it is answered
 * and not pending review. Run again after a reviewer scores an item.
 */
function summarize(responses, config = DEFAULT_CONFIG) {
  const skills = {}, categories = Object.fromEntries(CATEGORIES.map((c) => [c, blankTally()]));
  for (const r of responses) {
    const cat = r.category || 'theory';
    for (const s of r.skills) {
      const e = skills[s] || (skills[s] = { presented: 0, answered: 0, pending: 0, possible: 0, earned: 0, by_category: Object.fromEntries(CATEGORIES.map((c) => [c, blankTally()])) });
      e.presented++;
      if (!r.answered) continue;
      if (r.pending) { e.pending++; continue; }
      e.answered++; e.possible += r.points; e.earned += r.earned;
      e.max_difficulty = Math.max(e.max_difficulty || 0, r.d || 1);
      (e.evidence_types = e.evidence_types || {})[r.grading === 'review' ? 'staff_reviewed' : 'auto_graded'] = true;
      (e.questions = e.questions || []).push(r.id + '@v' + (r.v || 1));
      const bc = e.by_category[cat]; bc.answered++; bc.possible += r.points; bc.earned += r.earned;
    }
    if (r.answered && !r.pending) { const t = categories[cat]; t.answered++; t.possible += r.points; t.earned += r.earned; }
  }
  for (const e of Object.values(skills)) {
    e.score = pct(e.earned, e.possible);
    e.evidence = e.answered >= config.min_evidence_items ? 'sufficient' : 'insufficient';
    e.by_category = Object.fromEntries(Object.entries(e.by_category).map(([c, t]) => [c, finishTally(t)]));
    e.practical_score = e.by_category.practical.score;
    e.max_difficulty = e.max_difficulty || 0;
    e.evidence_types = Object.keys(e.evidence_types || {});
  }
  const done = responses.filter((r) => r.answered && !r.pending);
  const cats = Object.fromEntries(Object.entries(categories).map(([c, t]) => [c, finishTally(t)]));
  return {
    responses, skills, categories: cats,
    answered: responses.filter((r) => r.answered).length, total: responses.length,
    pending: responses.filter((r) => r.pending).length,
    raw_score: pct(done.reduce((a, r) => a + r.earned, 0), done.reduce((a, r) => a + r.points, 0)),
    practical_score: cats.practical.score,
  };
}

/** Grade an attempt. `questions` are the exact versions served; the result is self-contained. */
function scoreAttempt(questions, answers, config = DEFAULT_CONFIG) {
  const responses = questions.map((q) => {
    const g = gradeResponse(q, answers[q.id]);
    const r = { id: q.id, v: q.version, d: q.difficulty || 1, type: q.type, grading: q.grading || 'auto', category: catOf(q), answered: g.answered, earned: g.earned, points: q.points, correct: g.correct, practical: catOf(q) === 'practical', skills: q.skills };
    if (g.pending) { r.pending = true; r.answer = String(answers[q.id]).slice(0, 6000); }
    return r;
  });
  return summarize(responses, config);
}

/** Weighted overall from category scores: renormalised over the categories that have evidence. */
function weightedOverall(categoryScores, weights) {
  let w = 0, acc = 0;
  for (const c of CATEGORIES) { const s = categoryScores[c]; if (s && s.score != null && s.sufficient !== false) { w += weights[c] || 0; acc += (weights[c] || 0) * s.score; } }
  return w ? Math.round(acc / w) : null;
}
function weightsFor(key, config = DEFAULT_CONFIG, trackDefault) {
  const cw = config.category_weights || {};
  return { ...(cw.default || DEFAULT_CONFIG.category_weights.default), ...(trackDefault || {}), ...(cw[key] || {}) };
}

/* ------------------------------ current profile ------------------------------ */
/**
 * Current assessed proficiency per skill: the most recent attempt that gave
 * SUFFICIENT evidence for the skill (else the latest thin record, marked).
 * Each category keeps its own latest evidence, so a short reassessment of
 * practical work updates the practical picture without erasing the rest.
 */
function skillProfile(attempts) {
  const profile = {};
  const done = attempts.filter((a) => a.status === 'submitted' && a.result).sort((a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)));
  for (const a of done) {
    for (const [skill, e] of Object.entries(a.result.skills)) {
      const prev = profile[skill];
      const cats = { ...(prev?.by_category || {}) };
      for (const c of CATEGORIES) { const t = e.by_category?.[c]; if (t && t.answered) cats[c] = { score: t.score, answered: t.answered, at: a.submitted_at }; }
      if (e.score == null) { if (prev) prev.by_category = cats; else if (Object.keys(cats).length) profile[skill] = { score: null, evidence: 'none', answered: 0, by_category: cats }; continue; }
      if (e.evidence === 'sufficient' || !prev || prev.evidence !== 'sufficient') {
        profile[skill] = { score: e.score, evidence: e.evidence, answered: e.answered, attempt_id: a.id, at: a.submitted_at, assessment: a.assessment, by_category: cats,
          max_difficulty: e.max_difficulty || 0, evidence_types: e.evidence_types || [], questions: e.questions || [], config_version: a.config_version || null, skill_version: a.skill_versions?.[skill] || 1 };
      } else prev.by_category = cats;
    }
  }
  for (const e of Object.values(profile)) e.practical_score = e.by_category?.practical?.score ?? null;
  return profile;
}

function skillHistory(attempts, skill) {
  return attempts.filter((a) => a.status === 'submitted' && a.result?.skills?.[skill]?.score != null)
    .sort((a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)))
    .map((a) => { const e = a.result.skills[skill]; return { attempt_id: a.id, at: a.submitted_at, score: e.score, evidence: e.evidence, by_category: Object.fromEntries(CATEGORIES.map((c) => [c, e.by_category?.[c]?.score ?? null])) }; });
}

/* ------------------------------ classification ------------------------------ */
function band(score, config = DEFAULT_CONFIG) {
  if (score == null) return null;
  let level = config.bands[0].level;
  for (const b of config.bands) if (score >= b.min) level = b.level;
  return level;
}

const STATUS = { strong: 'Strong', developing: 'Developing', improve: 'Needs Improvement', critical: 'Critical Prerequisite Gap', none: 'Not Yet Assessed', thin: 'Needs Further Assessment' };
function skillStatus(entry, critical, config = DEFAULT_CONFIG) {
  if (!entry || entry.score == null) return STATUS.none;
  if (entry.evidence !== 'sufficient') return STATUS.thin;
  const t = config.skill_thresholds;
  if (entry.score >= t.strong) return STATUS.strong;
  if (entry.score >= t.developing) return STATUS.developing;
  return critical ? STATUS.critical : STATUS.improve;
}
const demonstrated = (entry, config) => skillStatus(entry, false, config) === STATUS.strong;

/**
 * Theory / practical / scenario scores over a set of weighted skills: for
 * each category, the skill-weighted mean of the skills' category scores.
 * A category needs at least `min_category_items` answered items in total to
 * count towards the overall score.
 */
function categoryScores(skillEntries, profile, config = DEFAULT_CONFIG) {
  const out = {};
  for (const c of CATEGORIES) {
    let w = 0, acc = 0, items = 0, skills = 0;
    for (const { skill, weight } of skillEntries) {
      const t = profile[skill]?.by_category?.[c];
      if (t && t.score != null && t.answered) { w += weight; acc += weight * t.score; items += t.answered; skills++; }
    }
    out[c] = { score: w ? Math.round(acc / w) : null, items, skills, sufficient: items >= config.min_category_items };
  }
  return out;
}

/** Common CS score: configured category weights over CS skills with sufficient evidence, plus the theory/practical/scenario split. */
function commonScore(profile, config = DEFAULT_CONFIG) {
  const w = config.common_weights, total = Object.values(w).reduce((a, b) => a + b, 0);
  let wsum = 0, acc = 0;
  const categories = Object.entries(w).map(([skill, weight]) => {
    const e = profile[skill], ok = e && e.evidence === 'sufficient' && e.score != null;
    if (ok) { wsum += weight; acc += weight * e.score; }
    return { skill, weight, score: e ? e.score : null, evidence: e ? e.evidence : 'none', by_category: e?.by_category || {} };
  });
  const split = categoryScores(Object.entries(w).map(([skill, weight]) => ({ skill, weight })), profile, config);
  const weights = weightsFor('common', config);
  return {
    score: wsum ? Math.round(acc / wsum) : null, coverage: total ? +(wsum / total).toFixed(2) : 0, categories,
    evaluation: Object.fromEntries(CATEGORIES.map((c) => [c, { ...split[c], weight: weights[c] }])),
    overall: weightedOverall(split, weights),
  };
}

/**
 * Track readiness. Overall = theory/practical/scenario category scores mixed
 * by the track's configured weights. The level comes from the score band,
 * then rules cap it, each recorded in `explanation`:
 *   - coverage below min_confidence          -> "Insufficient Evidence"
 *   - a critical skill with a gap            -> at most band 2
 *   - a critical skill not yet demonstrated  -> at most band 3
 *   - no practical evidence at all           -> at most band 3 (knowledge alone never proves readiness)
 */
function trackReadiness(track, profile, config = DEFAULT_CONFIG) {
  const total = track.skills.reduce((a, s) => a + s.weight, 0);
  let wsum = 0, acc = 0;
  const skills = track.skills.map((s) => {
    const e = profile[s.skill], status = skillStatus(e, s.critical, config);
    if (e && e.evidence === 'sufficient' && e.score != null) { wsum += s.weight; acc += s.weight * e.score; }
    return { ...s, score: e ? e.score : null, practical_score: e ? e.practical_score : null, evidence: e ? e.evidence : 'none', status,
      by_category: Object.fromEntries(CATEGORIES.map((c) => [c, e?.by_category?.[c]?.score ?? null])) };
  });
  const knowledge = wsum ? Math.round(acc / wsum) : null;
  const coverage = total ? +(wsum / total).toFixed(2) : 0;
  const weights = weightsFor(track.slug, config, track.category_weights);
  const cats = categoryScores(track.skills, profile, config);
  const overall = weightedOverall(cats, weights) ?? knowledge;
  const explanation = [];
  const order = config.bands.map((b) => b.level);
  let level = band(overall, config);
  const cap = (max, why) => { if (level && order.indexOf(level) > order.indexOf(max)) { level = max; explanation.push(why); } };
  if (overall != null) {
    const parts = CATEGORIES.filter((c) => cats[c].score != null && cats[c].sufficient).map((c) => `${CATEGORY_NAME[c]} ${cats[c].score}% (weight ${weights[c]})`);
    explanation.push(`Overall score ${overall}% from ${parts.join(', ') || 'the assessed skills'} places you in the ${band(overall, config)} band.`);
    const thin = CATEGORIES.filter((c) => !cats[c].sufficient);
    if (thin.length) explanation.push(`${thin.map((c) => CATEGORY_NAME[c]).join(' and ')} ${thin.length === 1 ? 'has' : 'have'} too little evidence yet, so ${thin.length === 1 ? 'it is' : 'they are'} left out of the overall score.`);
  }
  const gaps = skills.filter((s) => s.critical && s.status === STATUS.critical);
  if (gaps.length) cap(order[1], `Capped at ${order[1]}: critical prerequisite gap in ${gaps.map((s) => s.skill).join(', ')}.`);
  const unproven = skills.filter((s) => s.critical && [STATUS.none, STATUS.thin].includes(s.status));
  if (unproven.length) cap(order[2], `Capped at ${order[2]}: critical skill(s) not yet demonstrated - ${unproven.map((s) => s.skill).join(', ')}.`);
  if (!cats.practical.sufficient) cap(order[2], `Capped at ${order[2]}: practical implementation has not been shown yet. Knowledge questions alone cannot confirm readiness.`);
  if (overall == null || coverage < config.min_confidence) {
    explanation.push(`Only ${Math.round(coverage * 100)}% of this track's skills (by weight) have enough evidence; at least ${Math.round(config.min_confidence * 100)}% is needed for a level.`);
    level = 'Insufficient Evidence';
  }
  return {
    score: overall, knowledge_score: knowledge, coverage, level, provisional: true, explanation, skills,
    evaluation: Object.fromEntries(CATEGORIES.map((c) => [c, { ...cats[c], weight: weights[c] }])), weights,
    practical_score: cats.practical.score, weakest_category: weakestCategory(cats),
    confidence: coverage >= 0.85 ? 'high' : coverage >= config.min_confidence ? 'moderate' : 'low',
  };
}
function weakestCategory(cats) {
  const scored = CATEGORIES.filter((c) => cats[c].score != null && cats[c].sufficient).sort((a, b) => cats[a].score - cats[b].score);
  if (scored.length < 2 || cats[scored[scored.length - 1]].score - cats[scored[0]].score < 10) return null;
  return { category: scored[0], label: CATEGORY_LABEL[scored[0]], score: cats[scored[0]].score, strongest: scored[scored.length - 1], strongest_score: cats[scored[scored.length - 1]].score };
}

/* -------------------------------- skill gaps -------------------------------- */
const SEVERITY = { [STATUS.critical]: 4, [STATUS.improve]: 3, [STATUS.thin]: 2, [STATUS.none]: 2, [STATUS.developing]: 1 };

/** Which categories of a skill are weak (< developing) and which are strong. */
function diagnose(entry, config = DEFAULT_CONFIG) {
  const t = config.skill_thresholds, by = entry?.by_category || {};
  const weak = CATEGORIES.filter((c) => by[c]?.score != null && by[c].score < t.developing);
  const strong = CATEGORIES.filter((c) => by[c]?.score != null && by[c].score >= t.strong);
  const untested = CATEGORIES.filter((c) => by[c]?.score == null);
  return { weak_in: weak, strong_in: strong, untested_in: untested, scores: Object.fromEntries(CATEGORIES.map((c) => [c, by[c]?.score ?? null])) };
}

/**
 * Every track skill that is not Strong - and every Strong skill that is
 * still weak in one category - with what to do about it, ordered by:
 * critical prerequisite, severity, gap size, earlier stage, weak practical
 * results, then whether EchoLens has a module for it.
 */
function skillGaps(track, profile, resolve, config = DEFAULT_CONFIG) {
  const stageOf = (id) => { const i = track.stages.findIndex((st) => st.skills.includes(id)); return i < 0 ? 9 : i + 1; };
  const required = config.skill_thresholds.strong;
  const out = [];
  for (const s of track.skills) {
    const e = profile[s.skill];
    let status = skillStatus(e, s.critical, config);
    const d = diagnose(e, config);
    if (status === STATUS.strong && !d.weak_in.length) continue;
    const partial = status === STATUS.strong;
    if (partial) status = STATUS.developing;
    const resources = resolve(s.skill);
    out.push({
      skill: s.skill, status, critical: s.critical, stage: stageOf(s.skill), partial,
      score: e ? e.score : null, evidence: e ? e.evidence : 'none', answered: e ? e.answered : 0,
      required, gap: e && e.score != null ? Math.max(0, required - e.score) : null, severity: (SEVERITY[status] || 0) - (partial ? 0.5 : 0),
      prerequisite_importance: s.critical ? 'critical' : 'standard',
      practical_score: d.scores.practical, ...d,
      resources, content_gap: resources.length === 0,
      reassessment: { skill: s.skill, items: config.skill_reassess_items },
    });
  }
  return out.sort((a, b) =>
    (b.status === STATUS.critical) - (a.status === STATUS.critical)
    || b.severity - a.severity
    || (b.gap ?? -1) - (a.gap ?? -1)
    || a.stage - b.stage
    || ((a.practical_score ?? 101) - (b.practical_score ?? 101))
    || (a.content_gap - b.content_gap));
}

/** Plain-language diagnosis: is the weakness theory, coding ability, or real-world application? */
function diagnosisText(gap, name) {
  const s = gap.scores || {}, f = (c) => `${CATEGORY_NAME[c].toLowerCase()} ${s[c]}%`;
  if (!gap.weak_in?.length) return null;
  const weak = gap.weak_in, strong = gap.strong_in || [];
  if (weak.length === 3) return `Your ${name} results are low in every category (${weak.map(f).join(', ')}), so start from the concepts.`;
  const what = weak.map((c) => CATEGORY_LABEL[c]).join(' and ');
  const but = strong.length ? `You do well on ${strong.map((c) => CATEGORY_LABEL[c]).join(' and ')} (${strong.map(f).join(', ')}), but ` : '';
  return `${but}your weakness in ${name} is ${what} (${weak.map(f).join(', ')}).`;
}
const ACTION = {
  theory: 'revisit the lesson videos and notes, and explain each concept in your own words before practising',
  practical: 'write and debug the code yourself - solve every practice task rather than reading solutions',
  scenario: 'work through the stage project and real-world examples, deciding and justifying each step',
};

/** One concrete, actionable recommendation for a gap. */
function recommendation(gap, skillName) {
  const mods = gap.resources.filter((r) => !r.completed).slice(0, 3);
  const tasks = mods.reduce((a, m) => a + (m.tasks || 0), 0);
  if (gap.status === STATUS.none || gap.status === STATUS.thin) {
    const why = gap.status === STATUS.none ? `${skillName} has not been assessed yet` : `there is not yet enough evidence on ${skillName} (${gap.answered} question${gap.answered === 1 ? '' : 's'} answered)`;
    return `Take the ${skillName} assessment first, since ${why}.`;
  }
  const diag = diagnosisText(gap, skillName);
  const lead = diag || `Your ${skillName} score is ${gap.score}%, below the ${gap.required}% this stage needs.`;
  const focus = (gap.weak_in || []).map((c) => ACTION[c]);
  const learn = mods.length
    ? `Complete ${mods.map((m) => `"${m.title}" (${m.course})`).join(', ')}${tasks ? `, solve the ${tasks} practice task${tasks === 1 ? '' : 's'} in ${mods.length === 1 ? 'that module' : 'those modules'}` : ''}`
    : gap.resources.length ? 'Review the modules you have already completed for this skill'
      : 'Practise with an external resource for now - EchoLens does not yet have a module for this skill';
  return `${lead} ${learn}${focus.length ? '; ' + focus.join('; ') : ''}; then take the short ${gap.reassessment.items}-question ${skillName} reassessment.`;
}

/* --------------------------------- roadmap --------------------------------- */
/**
 * Six-stage roadmap. A stage is complete when every critical skill in it is
 * demonstrated (Strong, sufficient evidence) and every other skill is at
 * least Developing. The first incomplete stage is the starting stage.
 * Capstone and career-readiness stages open once stage 4 is complete and are
 * completed by the student's submitted (self-reported) project links.
 */
function roadmap(track, profile, resolve, { stageNames, projects = {} } = {}, config = DEFAULT_CONFIG) {
  const crit = new Map(track.skills.map((s) => [s.skill, s.critical]));
  let start = null;
  const stages = track.stages.map((st, i) => {
    const skills = st.skills.map((id) => {
      const status = skillStatus(profile[id], crit.get(id), config);
      const ok = crit.get(id) ? status === STATUS.strong : [STATUS.strong, STATUS.developing].includes(status);
      return { skill: id, critical: !!crit.get(id), status, satisfied: ok, score: profile[id]?.score ?? null };
    });
    const seenMod = new Set();
    const modules = st.skills.flatMap((id) => resolve(id).map((r) => ({ ...r, skill: id })))
      .filter((m) => { const k = (m.track_key || m.title) + ':' + (m.level ?? ''); if (seenMod.has(k)) return false; seenMod.add(k); return true; });
    const project = projects[i + 1] || null;
    const complete = skills.length ? skills.every((s) => s.satisfied) : !!project;
    return { no: i + 1, name: (stageNames || [])[i] || `Stage ${i + 1}`, skills, modules, projects: st.projects, criteria: st.criteria, project, complete };
  });
  for (const st of stages) { if (!st.complete) { start = st.no; break; } }
  for (const st of stages) {
    st.status = st.complete ? 'completed' : st.no === start ? 'current' : 'upcoming';
    if (st.no >= 5 && stages.slice(0, 4).some((x) => !x.complete) && !st.complete) st.status = 'locked';
    st.next_actions = st.complete ? [] : st.skills.length
      ? st.skills.filter((s) => !s.satisfied).map((s) => s.status === STATUS.none || s.status === STATUS.thin ? { kind: 'assess', skill: s.skill } : { kind: 'learn', skill: s.skill })
      : [{ kind: 'project' }];
  }
  return { starting_stage: start, complete: start == null, stages };
}

module.exports = {
  CATEGORIES, CATEGORY_LABEL, CATEGORY_NAME, DEFAULT_CONFIG, STATUS, rng, shuffle, assembleForm, publicQuestion, normalizeTyped, gradeResponse,
  summarize, scoreAttempt, weightedOverall, weightsFor, skillProfile, skillHistory, band, skillStatus, demonstrated, categoryScores, commonScore,
  trackReadiness, diagnose, diagnosisText, skillGaps, recommendation, roadmap,
};
