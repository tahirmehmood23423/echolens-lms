'use strict';
/**
 * EchoLens curriculum v1: canonical subtracks, the 12 track structures and
 * the 36 job roles, with validation.
 *
 *   SUBTRACKS  canonical subtracks (catalog/*.js)
 *   TRACKS     track slug -> ordered entries -> canonical subtrack ids
 *   ROLES      job roles -> mandatory / optional subtracks + JD evidence
 *
 * validate() returns { errors, warnings }. Errors must be empty for the
 * catalog to load (enforced by tests); warnings are listed in the admin QA
 * dashboard and the audit report.
 */
const SUBTRACKS = [
  ...require('./catalog/backend'), ...require('./catalog/web'), ...require('./catalog/mobile'), ...require('./catalog/ai'),
  ...require('./catalog/data'), ...require('./catalog/ops'), ...require('./catalog/qa-se'),
];
const TRACKS = require('./tracks');
const ROLES = require('./roles');

const byId = new Map(SUBTRACKS.map((s) => [s.id, s]));
const subtrack = (id) => byId.get(id) || null;
const roleById = new Map(ROLES.map((r) => [r.id, r]));
const role = (id) => roleById.get(id) || null;
const compIndex = new Map();
for (const s of SUBTRACKS) for (const m of s.modules) for (const c of m.objectives) compIndex.set(c.id, { subtrack: s.id, module: m.id, competency: c });
const competency = (id) => compIndex.get(id) || null;

/** Canonical subtrack ids used by a track (core order first, then variants). */
function trackSubtracks(slug) {
  const t = TRACKS[slug]; if (!t) return [];
  const core = [...new Set(t.order.flatMap((e) => e.subtracks))];
  return { core, variants: (t.variants || []).filter((id) => !core.includes(id)) };
}
/** Where each subtrack is used. */
function usage(id) {
  const tracks = Object.keys(TRACKS).filter((slug) => { const u = trackSubtracks(slug); return u.core.includes(id) || u.variants.includes(id); });
  const roles = ROLES.filter((r) => r.mandatory.includes(id) || r.optional.includes(id)).map((r) => ({ id: r.id, mandatory: r.mandatory.includes(id) }));
  return { tracks, roles };
}
/** All prerequisites of a subtrack, transitively. */
function prereqClosure(id, seen = new Set()) {
  for (const p of subtrack(id)?.prereq || []) if (!seen.has(p)) { seen.add(p); prereqClosure(p, seen); }
  return seen;
}
/** Order subtracks so prerequisites come first (stable by the given order). */
function prereqOrder(ids) {
  const set = new Set(ids), out = [], done = new Set();
  const visit = (id) => { if (done.has(id) || !set.has(id)) return; done.add(id); for (const p of subtrack(id)?.prereq || []) visit(p); out.push(id); };
  ids.forEach(visit);
  return out;
}
/**
 * The learning path for a role: its mandatory subtracks plus every
 * prerequisite they depend on, in prerequisite order. Prerequisites a role
 * does not list explicitly are added and marked, so a complete beginner is
 * never dropped into a subtrack without its foundations.
 */
function rolePath(r) {
  const listed = new Set([...r.mandatory, ...r.optional]);
  const pre = new Set();
  for (const id of r.mandatory) for (const p of prereqClosure(id)) if (!listed.has(p)) pre.add(p);
  const required = prereqOrder([...pre, ...r.mandatory]);
  return { required, prerequisites_added: [...pre], optional: prereqOrder(r.optional) };
}
const words = (s) => new Set(String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 3));
const jaccard = (a, b) => { const i = [...a].filter((x) => b.has(x)).length; return i / (a.size + b.size - i || 1); };

function validate() {
  const errors = [], warnings = [];
  // ids and structure
  const seen = new Set();
  for (const s of SUBTRACKS) {
    if (seen.has(s.id)) errors.push(`duplicate subtrack id ${s.id}`); seen.add(s.id);
    if (s.modules.length < 3 || s.modules.length > 6) errors.push(`${s.id}: needs 3 to 6 modules (has ${s.modules.length})`);
    if (!s.modules.some((m) => m.objectives.some((o) => o.critical))) warnings.push(`${s.id}: no critical competency marked`);
    for (const p of s.prereq) if (!byId.has(p)) errors.push(`${s.id}: unknown prerequisite ${p}`);
    if (!['foundation', 'beginner', 'intermediate', 'advanced'].includes(s.level)) errors.push(`${s.id}: bad level ${s.level}`);
    if (!(s.depth >= 1 && s.depth <= 4)) errors.push(`${s.id}: depth must be 1-4`);
  }
  // prerequisite cycles (DFS with colours)
  const colour = new Map();
  const dfs = (id, path) => {
    colour.set(id, 1);
    for (const p of subtrack(id)?.prereq || []) {
      if (colour.get(p) === 1) errors.push(`prerequisite cycle: ${[...path, id, p].join(' -> ')}`);
      else if (!colour.get(p)) dfs(p, [...path, id]);
    }
    colour.set(id, 2);
  };
  for (const s of SUBTRACKS) if (!colour.get(s.id)) dfs(s.id, []);
  // track and role references
  for (const [slug, t] of Object.entries(TRACKS)) for (const e of t.order) for (const id of e.subtracks) if (!byId.has(id)) errors.push(`track ${slug}: unknown subtrack ${id}`);
  for (const [slug, t] of Object.entries(TRACKS)) for (const id of t.variants || []) if (!byId.has(id)) errors.push(`track ${slug}: unknown variant ${id}`);
  for (const r of ROLES) {
    if (!TRACKS[r.track]) errors.push(`role ${r.id}: unknown track ${r.track}`);
    for (const id of [...r.mandatory, ...r.optional]) if (!byId.has(id)) errors.push(`role ${r.id}: unknown subtrack ${id}`);
    const both = r.mandatory.filter((id) => r.optional.includes(id));
    if (both.length) errors.push(`role ${r.id}: ${both.join(', ')} both mandatory and optional`);
    if (r.jd.status !== 'search_summary_unverified' && r.jd.status !== 'jd_verification_required') errors.push(`role ${r.id}: unexpected JD status`);
  }
  // every subtrack is used somewhere
  for (const s of SUBTRACKS) { const u = usage(s.id); if (!u.tracks.length && !u.roles.length) warnings.push(`${s.id}: not used by any track or role`); }
  // near-duplicate subtracks (very similar objectives)
  const sig = SUBTRACKS.map((s) => [s.id, words(s.modules.flatMap((m) => m.objectives.map((o) => o.text)).join(' '))]);
  for (let i = 0; i < sig.length; i++) for (let j = i + 1; j < sig.length; j++) {
    const sim = jaccard(sig[i][1], sig[j][1]);
    if (sim >= 0.45) warnings.push(`possible duplicate subtracks ${sig[i][0]} and ${sig[j][0]} (objective overlap ${Math.round(sim * 100)}%)`);
  }
  return { errors, warnings };
}

module.exports = { SUBTRACKS, TRACKS, ROLES, subtrack, role, competency, trackSubtracks, usage, prereqClosure, prereqOrder, rolePath, validate };
