'use strict';
/**
 * Multi-career roadmaps - pure functions, no storage access.
 *
 * ENROLLMENTS. A student can follow several career roadmaps. Each enrollment
 * is one record per track (re-enrolling an archived track revives the same
 * record, so its history is kept):
 *   { id, track, status: 'active'|'paused'|'archived', primary, enrolled_at,
 *     updated_at, history: [{ at, event, ... }], progress: {...snapshot} }
 * Invariants, checked after EVERY change (a change that breaks one is rejected
 * and nothing is written):
 *   1. at most one non-archived enrollment per track (no duplicates)
 *   2. active enrollments <= the configured limit
 *   3. if any enrollment is active, exactly one active enrollment is Primary;
 *      paused and archived enrollments are never Primary
 *
 * SHARED SKILL PROFILE. One record per student per skill, built from every
 * assessment attempt, independent of any roadmap. Evidence is reused by a
 * roadmap only when the skill definition version matches, the evidence is
 * verified and recent, and it was assessed at least as deeply as that
 * roadmap requires. Reuse never makes a student "proficient" in a skill they
 * were not assessed on: skills are distinct IDs, and depth gates reuse.
 */

const STATUSES = ['active', 'paused', 'archived'];

/* -------------------------------- invariants -------------------------------- */
function invariantError(list, max) {
  const live = list.filter((e) => e.status !== 'archived');
  const tracks = live.map((e) => e.track);
  if (new Set(tracks).size !== tracks.length) return 'You already follow this roadmap.';
  const active = list.filter((e) => e.status === 'active');
  if (active.length > max) return `You can follow at most ${max} active roadmaps. Pause or archive one first.`;
  if (list.some((e) => e.primary && e.status !== 'active')) return 'Only an active roadmap can be Primary.';
  const primaries = active.filter((e) => e.primary).length;
  if (active.length && primaries !== 1) return 'Exactly one active roadmap must be Primary.';
  if (list.some((e) => !STATUSES.includes(e.status))) return 'Unknown roadmap status.';
  return null;
}

/**
 * Apply one change to a copy and validate it. Returns { list } or { error }.
 * The caller writes `list` only on success - all-or-nothing, like a
 * transaction - and does so synchronously, so no other request can run
 * between the check and the write.
 */
function apply(list, max, fn) {
  const next = JSON.parse(JSON.stringify(list || []));
  const err = fn(next);
  if (err) return { error: err };
  // If an admin lowered the limit, students already above it may still pause,
  // archive or switch Primary - they just cannot add more active roadmaps.
  const before = (list || []).filter((e) => e.status === 'active').length;
  const broken = invariantError(next, Math.max(max, before));
  return broken ? { error: broken } : { list: next };
}
const ev = (e, at, event, extra) => { e.history = [...(e.history || []), { at, event, ...(extra || {}) }].slice(-50); e.updated_at = at; };
/** If no active roadmap is Primary, promote the most recently updated active one. */
function ensurePrimary(list, at) {
  const active = list.filter((e) => e.status === 'active');
  if (!active.length || active.some((e) => e.primary)) return;
  const pick = active.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0];
  pick.primary = true; ev(pick, at, 'made_primary', { automatic: true });
}

function enroll(list, track, { max, at, primary = false, id }) {
  return apply(list, max, (l) => {
    const live = l.find((e) => e.track === track && e.status !== 'archived');
    if (live) return live.status === 'paused' ? 'You already follow this roadmap (it is paused). Resume it instead.' : 'You already follow this roadmap.';
    let e = l.find((x) => x.track === track && x.status === 'archived');
    if (e) { e.status = 'active'; e.archived_at = null; ev(e, at, 'reactivated'); }
    else { e = { id, track, status: 'active', primary: false, enrolled_at: at, updated_at: at, history: [], progress: null }; ev(e, at, 'enrolled'); l.push(e); }
    const first = !l.some((x) => x !== e && x.status === 'active');
    if (primary || first) { for (const x of l) if (x.primary) { x.primary = false; ev(x, at, 'primary_moved', { to: track }); } e.primary = true; ev(e, at, 'made_primary'); }
    return null;
  });
}
function setPrimary(list, track, { max, at }) {
  return apply(list, max, (l) => {
    const e = l.find((x) => x.track === track && x.status !== 'archived');
    if (!e) return 'You do not follow this roadmap.';
    if (e.status !== 'active') return 'Resume this roadmap before making it Primary.';
    if (e.primary) return null;
    for (const x of l) if (x.primary) { x.primary = false; ev(x, at, 'primary_moved', { to: track }); }
    e.primary = true; ev(e, at, 'made_primary');
    return null;
  });
}
function pause(list, track, { max, at }) {
  return apply(list, max, (l) => {
    const e = l.find((x) => x.track === track && x.status !== 'archived');
    if (!e) return 'You do not follow this roadmap.';
    if (e.status === 'paused') return null;
    e.status = 'paused'; const was = e.primary; e.primary = false; ev(e, at, 'paused');
    if (was) ensurePrimary(l, at);
    return null;
  });
}
function resume(list, track, { max, at }) {
  return apply(list, max, (l) => {
    const e = l.find((x) => x.track === track && x.status !== 'archived');
    if (!e) return 'You do not follow this roadmap.';
    if (e.status === 'active') return null;
    e.status = 'active'; ev(e, at, 'resumed');
    ensurePrimary(l, at);
    return null;
  });
}
function archive(list, track, { max, at }) {
  return apply(list, max, (l) => {
    const e = l.find((x) => x.track === track && x.status !== 'archived');
    if (!e) return 'You do not follow this roadmap.';
    const was = e.primary; e.status = 'archived'; e.primary = false; e.archived_at = at; ev(e, at, 'archived');
    if (was) ensurePrimary(l, at);
    return null;
  });
}
const primaryOf = (list) => (list || []).find((e) => e.primary && e.status === 'active') || null;

/* ---------------------------- shared skill profile ---------------------------- */
/**
 * Verification status of a skill record:
 *   verified     sufficient evidence, all of it scored, within the validity window
 *   provisional  some evidence, but too little (or still awaiting staff review)
 *   expired      was sufficient, but older than the validity window
 *   unverified   no scored evidence
 */
function verification(entry, { validDays, nowMs }) {
  if (!entry || entry.score == null) return 'unverified';
  if (entry.evidence !== 'sufficient') return 'provisional';
  if (validDays && nowMs - Date.parse(entry.at) > validDays * 86400e3) return 'expired';
  return 'verified';
}
/** The central record for one student and one skill, in the shape the spec asks for. */
function skillRecord(studentId, skillId, entry, { validDays, nowMs, band, skillVersion }) {
  const status = verification(entry, { validDays, nowMs });
  const cats = entry?.by_category || {};
  return {
    student_id: studentId, skill_id: skillId, skill_version: entry?.skill_version || skillVersion || 1,
    proficiency: entry && entry.score != null ? { score: entry.score, level: band(entry.score) } : null,
    evidence_type: { methods: entry?.evidence_types || [], categories: Object.keys(cats).filter((c) => cats[c]?.answered) },
    assessment_version: entry ? { attempt_id: entry.attempt_id || null, assessment: entry.assessment || null, config_version: entry.config_version || null, questions: entry.questions || [] } : null,
    last_assessed: entry?.at || null,
    coverage: { answered: entry?.answered || 0, max_difficulty: entry?.max_difficulty || 0, by_category: Object.fromEntries(Object.entries(cats).map(([c, v]) => [c, v.answered || 0])) },
    verification: status,
  };
}
/**
 * May this evidence be reused for a roadmap skill that needs `depth`?
 * Returns { ok, reason }. Low scores are reusable too (they are honest
 * evidence of a gap); what is never reused is thin, stale, shallow or
 * differently-defined evidence.
 */
function reusable(record, { depth = 1, skillVersion = 1 } = {}) {
  if (!record || record.verification === 'unverified') return { ok: false, reason: 'not_assessed' };
  if (record.skill_version !== skillVersion) return { ok: false, reason: 'definition_changed' };
  if (record.verification === 'provisional') return { ok: false, reason: 'insufficient_evidence' };
  if (record.verification === 'expired') return { ok: false, reason: 'expired' };
  if ((record.coverage.max_difficulty || 0) < depth) return { ok: false, reason: 'not_deep_enough' };
  return { ok: true, reason: 'verified' };
}
const REUSE_TEXT = {
  not_assessed: 'not assessed yet', definition_changed: 'the skill definition has changed since it was assessed',
  insufficient_evidence: 'too few questions answered to verify it', expired: 'the last result is too old',
  not_deep_enough: 'it was not assessed at the depth this roadmap needs', verified: 'verified evidence reused',
};

module.exports = { STATUSES, invariantError, enroll, setPrimary, pause, resume, archive, primaryOf, ensurePrimary, verification, skillRecord, reusable, REUSE_TEXT };
