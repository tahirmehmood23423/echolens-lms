'use strict';
/**
 * Compact authoring helpers for the curriculum catalog.
 *
 *   S(id, title, description, meta, modules)
 *     meta: { level, depth, hours, prereq: [subtrack ids], refs: [free course track keys], kind }
 *       level  foundation | beginner | intermediate | advanced
 *       depth  1-4: required proficiency depth. Two subtracks that teach the
 *              same thing at different depths stay separate on purpose.
 *       kind   'core' (default) or 'variant' (a technology-specific
 *              alternative such as Kotlin/Android vs Flutter)
 *     modules: [[title, [objective, ...]], ...]
 *       Every objective is written as a measurable competency ("Choose ...",
 *       "Predict ...", "Diagnose ..."). A leading "!" marks a CRITICAL
 *       competency: a comprehensive assessment cannot be passed without
 *       demonstrating it, however high the overall score.
 *
 * Stable ids: subtrack `python-fundamentals`, module `python-fundamentals.m2`,
 * competency `python-fundamentals.m2.c1`. Never renumber a published
 * subtrack; add modules or competencies at the end instead.
 */
const LEVELS = ['foundation', 'beginner', 'intermediate', 'advanced'];

function S(id, title, description, meta, modules) {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`bad subtrack id ${id}`);
  const m = modules.map(([mt, objectives], mi) => {
    const mid = `${id}.m${mi + 1}`;
    return {
      id: mid, title: mt,
      objectives: objectives.map((o, ci) => {
        const critical = o.startsWith('!');
        return { id: `${mid}.c${ci + 1}`, text: critical ? o.slice(1).trim() : o, critical };
      }),
    };
  });
  return {
    id, title, description,
    level: meta.level, depth: meta.depth, hours: meta.hours,
    prereq: meta.prereq || [], refs: meta.refs || [], kind: meta.kind || 'core',
    modules: m, version: 1, structure_status: meta.status || 'reviewed',
  };
}
module.exports = { S, LEVELS };
