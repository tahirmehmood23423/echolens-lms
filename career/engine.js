'use strict';
/**
 * Career assessment engine - pure, deterministic functions with no storage
 * access, so every rule can be unit-tested and every result explained.
 *
 *   assembleForm   pick a randomised form from published questions
 *   scoreAttempt   grade responses server-side and summarise per skill
 *   skillProfile   the CURRENT assessed proficiency, from attempt history
 *   commonScore    weighted common-CS score (configurable weights)
 *   trackReadiness readiness + level for a track, with caps and reasons
 *   skillGaps      prioritised gaps with concrete recommendations
 *   roadmap        six-stage personalised roadmap with a starting stage
 *
 * Scoring is rule-based: objective questions are graded by exact rules, and
 * no LLM is involved. Unanswered questions are excluded rather than counted
 * as zero, and a skill without enough answered questions is reported as
 * "insufficient evidence" instead of a low score.
 */

const DEFAULT_CONFIG = {
  version: 1,
  common_weights: { 'cs.programming': 30, 'cs.logic': 25, 'cs.computing': 15, 'cs.dsa_basics': 15, 'cs.git_tools': 10, 'cs.debugging': 5 },
  common_form: { 'cs.programming': 5, 'cs.logic': 4, 'cs.computing': 3, 'cs.dsa_basics': 3, 'cs.git_tools': 3, 'cs.debugging': 3 },
  track_items_per_skill: 3,
  skill_reassess_items: 4,
  bands: [
    { min: 0, level: 'Foundation' }, { min: 25, level: 'Beginner' }, { min: 50, level: 'Intermediate' },
    { min: 70, level: 'Proficient' }, { min: 85, level: 'Advanced' },
  ],
  skill_thresholds: { strong: 70, developing: 50 },
  min_evidence_items: 3,
  min_confidence: 0.6,
  retake_cooldown_hours: 24,
  time_grace_sec: 120,
  recent_attempts_excluded: 2,
};

/* ------------------------------ seeded randomness ------------------------------ */
// mulberry32: small, fast and reproducible, so a stored seed recreates a form.
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(list, rand) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/* ---------------------------------- forms ---------------------------------- */
/**
 * Pick `plan[skill]` questions per skill from `pool` (published questions).
 * Questions the student saw recently go last, so a retake gets an alternate
 * form wherever the bank allows. Within a skill the pick spreads difficulty,
 * and the form keeps at least one practical task when the pool has one.
 * Returns { items: [{id, version, order}], shortfall: {skill: missing} }.
 */
function assembleForm({ pool, plan, seen = new Set(), seed = 1 }) {
  const rand = rng(seed);
  const items = [], used = new Set(), shortfall = {};
  for (const [skill, want] of Object.entries(plan)) {
    const candidates = shuffle(pool.filter((q) => q.skills[0] === skill && !used.has(q.id)), rand);
    const picked = [];
    // Unseen questions first, spreading difficulty within them; seen ones only
    // when the pool has nothing new left for this skill.
    for (const group of [candidates.filter((c) => !seen.has(c.id)), candidates.filter((c) => seen.has(c.id))]) {
      for (const d of [1, 2, 3]) { const q = group.find((c) => c.difficulty === d && !picked.includes(c)); if (q && picked.length < want) picked.push(q); }
      for (const q of group) { if (picked.length >= want) break; if (!picked.includes(q)) picked.push(q); }
    }
    if (picked.length < want) shortfall[skill] = want - picked.length;
    picked.forEach((q) => { used.add(q.id); items.push(q); });
  }
  if (!items.some((q) => q.practical)) {
    const practical = shuffle(pool.filter((q) => q.practical && !used.has(q.id) && plan[q.skills[0]]), rand)
      .sort((a, b) => Number(seen.has(a.id)) - Number(seen.has(b.id)))[0];
    if (practical) { const i = items.findIndex((q) => q.skills[0] === practical.skills[0] && !q.practical); if (i >= 0) items[i] = practical; }
  }
  return {
    items: shuffle(items, rand).map((q) => ({ id: q.id, version: q.version, order: q.options.length ? shuffle(q.options.map((o) => o.id), rand) : [] })),
    shortfall,
  };
}

/** What a student sees: no answer key, no explanation, options in form order. */
function publicQuestion(q, order) {
  const byId = new Map(q.options.map((o) => [o.id, o]));
  return {
    id: q.id, type: q.type, prompt: q.prompt, code: q.code, points: q.points, time_sec: q.time_sec, practical: q.practical,
    multi: q.type === 'multi',
    options: (order && order.length ? order : q.options.map((o) => o.id)).map((id) => byId.get(id)).filter(Boolean).map((o) => ({ id: o.id, text: o.text })),
  };
}

/* --------------------------------- grading --------------------------------- */
const normalizeTyped = (s) => String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/^["']|["']$/g, '');
const isBlank = (a) => a == null || (Array.isArray(a) ? a.length === 0 : String(a).trim() === '');

/** Grade one response. Multiple-answer: (right picks - wrong picks) / key size, never below 0. */
function gradeResponse(q, answer) {
  if (isBlank(answer)) return { answered: false, earned: 0, correct: false };
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

/**
 * Grade an attempt. `questions` are the exact versions served. The result is
 * a self-contained record: later edits to the bank or config cannot change it.
 */
function scoreAttempt(questions, answers, config = DEFAULT_CONFIG) {
  const responses = [], skills = {};
  for (const q of questions) {
    const g = gradeResponse(q, answers[q.id]);
    responses.push({ id: q.id, v: q.version, answered: g.answered, earned: g.earned, points: q.points, correct: g.correct, practical: q.practical, skills: q.skills });
    for (const s of q.skills) {
      const e = skills[s] || (skills[s] = { presented: 0, answered: 0, possible: 0, earned: 0, practical_possible: 0, practical_earned: 0 });
      e.presented++;
      if (!g.answered) continue;
      e.answered++; e.possible += q.points; e.earned += g.earned;
      if (q.practical) { e.practical_possible += q.points; e.practical_earned += g.earned; }
    }
  }
  for (const e of Object.values(skills)) {
    e.score = e.possible ? Math.round((e.earned / e.possible) * 100) : null;
    e.practical_score = e.practical_possible ? Math.round((e.practical_earned / e.practical_possible) * 100) : null;
    e.evidence = e.answered >= config.min_evidence_items ? 'sufficient' : 'insufficient';
  }
  const possible = responses.filter((r) => r.answered).reduce((a, r) => a + r.points, 0);
  const earned = responses.reduce((a, r) => a + r.earned, 0);
  const prac = responses.filter((r) => r.practical && r.answered);
  return {
    responses, skills,
    answered: responses.filter((r) => r.answered).length, total: responses.length,
    raw_score: possible ? Math.round((earned / possible) * 100) : null,
    practical_score: prac.length ? Math.round((prac.reduce((a, r) => a + r.earned, 0) / prac.reduce((a, r) => a + r.points, 0)) * 100) : null,
  };
}

/* ------------------------------ current profile ------------------------------ */
/**
 * Current assessed proficiency per skill: the most recent attempt that gave
 * SUFFICIENT evidence for the skill. If only thin evidence exists, the latest
 * thin record is kept and marked insufficient. History is never altered.
 */
function skillProfile(attempts) {
  const profile = {};
  const done = attempts.filter((a) => a.status === 'submitted' && a.result).sort((a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)));
  for (const a of done) {
    for (const [skill, e] of Object.entries(a.result.skills)) {
      if (e.score == null) continue;
      const prev = profile[skill];
      if (e.evidence === 'sufficient' || !prev || prev.evidence !== 'sufficient') {
        profile[skill] = { score: e.score, practical_score: e.practical_score, evidence: e.evidence, answered: e.answered, attempt_id: a.id, at: a.submitted_at, assessment: a.assessment };
      }
    }
  }
  return profile;
}

/** Skill history for before/after comparisons: every scored record, oldest first. */
function skillHistory(attempts, skill) {
  return attempts.filter((a) => a.status === 'submitted' && a.result?.skills?.[skill]?.score != null)
    .sort((a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)))
    .map((a) => ({ attempt_id: a.id, at: a.submitted_at, score: a.result.skills[skill].score, evidence: a.result.skills[skill].evidence }));
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

/** Common CS score: configured weights over categories with sufficient evidence, renormalised. */
function commonScore(profile, config = DEFAULT_CONFIG) {
  const w = config.common_weights, total = Object.values(w).reduce((a, b) => a + b, 0);
  let wsum = 0, acc = 0;
  const categories = Object.entries(w).map(([skill, weight]) => {
    const e = profile[skill], ok = e && e.evidence === 'sufficient' && e.score != null;
    if (ok) { wsum += weight; acc += weight * e.score; }
    return { skill, weight, score: e ? e.score : null, evidence: e ? e.evidence : 'none' };
  });
  return { score: wsum ? Math.round(acc / wsum) : null, coverage: total ? +(wsum / total).toFixed(2) : 0, categories };
}

/**
 * Track readiness: weighted mean over the track's skills that have sufficient
 * evidence. The level comes from the score band, then rules cap it:
 *   - coverage below min_confidence      -> "Insufficient Evidence"
 *   - any critical skill with a gap      -> at most "Beginner"
 *   - any critical skill not yet assessed -> at most "Intermediate"
 * Every rule that fires is written to `explanation`.
 */
function trackReadiness(track, profile, config = DEFAULT_CONFIG) {
  const total = track.skills.reduce((a, s) => a + s.weight, 0);
  let wsum = 0, acc = 0, pw = 0, pacc = 0;
  const skills = track.skills.map((s) => {
    const e = profile[s.skill], status = skillStatus(e, s.critical, config);
    if (e && e.evidence === 'sufficient' && e.score != null) { wsum += s.weight; acc += s.weight * e.score; }
    if (e && e.practical_score != null) { pw += s.weight; pacc += s.weight * e.practical_score; }
    return { ...s, score: e ? e.score : null, practical_score: e ? e.practical_score : null, evidence: e ? e.evidence : 'none', status };
  });
  const score = wsum ? Math.round(acc / wsum) : null;
  const coverage = total ? +(wsum / total).toFixed(2) : 0;
  const explanation = [];
  let level = band(score, config);
  const order = config.bands.map((b) => b.level);
  const cap = (max, why) => { if (level && order.indexOf(level) > order.indexOf(max)) { level = max; explanation.push(why); } };
  if (score != null) explanation.push(`Knowledge score ${score}% across the ${skills.filter((s) => s.evidence === 'sufficient').length} assessed skills places you in the ${band(score, config)} band.`);
  const gaps = skills.filter((s) => s.critical && s.status === STATUS.critical);
  if (gaps.length) cap(order[1], `Capped at ${order[1]}: critical prerequisite gap in ${gaps.map((s) => s.skill).join(', ')}.`);
  const unproven = skills.filter((s) => s.critical && [STATUS.none, STATUS.thin].includes(s.status));
  if (unproven.length) cap(order[2], `Capped at ${order[2]}: critical skill(s) not yet demonstrated - ${unproven.map((s) => s.skill).join(', ')}.`);
  if (score == null || coverage < config.min_confidence) {
    explanation.push(`Only ${Math.round(coverage * 100)}% of this track's skills (by weight) have enough evidence; at least ${Math.round(config.min_confidence * 100)}% is needed for a level.`);
    level = 'Insufficient Evidence';
  }
  return {
    score, coverage, level, provisional: true, explanation, skills,
    practical_score: pw ? Math.round(pacc / pw) : null,
    confidence: coverage >= 0.85 ? 'high' : coverage >= config.min_confidence ? 'moderate' : 'low',
  };
}

/* -------------------------------- skill gaps -------------------------------- */
const SEVERITY = { [STATUS.critical]: 4, [STATUS.improve]: 3, [STATUS.thin]: 2, [STATUS.none]: 2, [STATUS.developing]: 1 };

/**
 * Every track skill that is not Strong, with what to do about it, ordered by:
 * critical prerequisite first, then gap size, then how early its stage is
 * (later stages depend on it), then weak practical results, then whether
 * EchoLens has a module to recommend. `resolve(skillId)` returns the
 * validated resources for a skill: [{ title, course, tasks, completed, url }].
 */
function skillGaps(track, profile, resolve, config = DEFAULT_CONFIG) {
  const stageOf = (id) => { const i = track.stages.findIndex((st) => st.skills.includes(id)); return i < 0 ? 9 : i + 1; };
  const required = config.skill_thresholds.strong;
  const out = [];
  for (const s of track.skills) {
    const e = profile[s.skill], status = skillStatus(e, s.critical, config);
    if (status === STATUS.strong) continue;
    const resources = resolve(s.skill);
    const gap = e && e.score != null ? Math.max(0, required - e.score) : null;
    out.push({
      skill: s.skill, status, critical: s.critical, stage: stageOf(s.skill),
      score: e ? e.score : null, evidence: e ? e.evidence : 'none', answered: e ? e.answered : 0,
      required, gap, severity: SEVERITY[status] || 0,
      prerequisite_importance: s.critical ? 'critical' : 'standard',
      practical_score: e ? e.practical_score : null,
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

/** One concrete, actionable recommendation for a gap. */
function recommendation(gap, skillName) {
  const mods = gap.resources.filter((r) => !r.completed).slice(0, 3);
  const evidence = gap.status === STATUS.none ? `${skillName} has not been assessed yet`
    : gap.status === STATUS.thin ? `there is not yet enough evidence on ${skillName} (${gap.answered} question${gap.answered === 1 ? '' : 's'} answered)`
      : `your ${skillName} score is ${gap.score}%, below the ${gap.required}% this stage needs`;
  const learn = mods.length
    ? `complete ${mods.map((m) => `"${m.title}" (${m.course})`).join(', ')}${mods.some((m) => m.tasks) ? `, solve ${mods.reduce((a, m) => a + (m.tasks || 0), 0)} practice task${mods.reduce((a, m) => a + (m.tasks || 0), 0) === 1 ? '' : 's'} in ${mods.length === 1 ? 'that module' : 'those modules'}` : ''}`
    : gap.resources.length ? 'review the modules you have already completed for this skill'
      : 'practise with an external resource for now - EchoLens does not yet have a module for this skill';
  const reassess = `then take the short ${gap.reassessment.items}-question ${skillName} reassessment`;
  const first = gap.status === STATUS.none || gap.status === STATUS.thin ? `Take the ${skillName} assessment first, since ${evidence}.` : `Because ${evidence}, ${learn}, ${reassess}.`;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/* --------------------------------- roadmap --------------------------------- */
/**
 * Six-stage roadmap. A stage is complete when every critical skill in it is
 * demonstrated (Strong, sufficient evidence) and every other skill is at
 * least Developing - so demonstrated skills are skipped, but critical ones
 * are never assumed. The first incomplete stage is the starting stage.
 * Capstone and career-readiness stages open once stage 4 is complete and are
 * completed by the student's submitted project links (self-reported).
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
    // A module can teach two skills in the same stage; list it once.
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
  DEFAULT_CONFIG, STATUS, rng, shuffle, assembleForm, publicQuestion, normalizeTyped, gradeResponse, scoreAttempt,
  skillProfile, skillHistory, band, skillStatus, demonstrated, commonScore, trackReadiness, skillGaps, recommendation, roadmap,
};
