'use strict';
/**
 * The free courses, organised beginner to advanced.
 *
 * Two layers:
 *  - Each course sits on one of three levels, with the course(s) we recommend
 *    finishing first. Level 1 courses assume nothing; level 2 builds on a
 *    level 1 course in the same language; level 3 is professional-track work
 *    whose stated prerequisites match a level 2 course.
 *  - Inside a course, its modules are split into Beginner, Intermediate and
 *    Advanced stages. Module order was already progressive, so stages are
 *    labels over the existing order - nothing is renumbered, which keeps every
 *    learner's saved progress and module pacing intact.
 *
 * Recommendations are guidance shown on the catalogue and course pages, not a
 * lock: learners already part-way through a course are never blocked.
 */

const LEVELS = [
  { no: 1, key: 'beginner', name: 'Beginner', blurb: 'Start here. No experience needed - learn a first language from the ground up.' },
  { no: 2, key: 'intermediate', name: 'Intermediate', blurb: 'Go deeper in a language you know: memory, objects, async and professional patterns.' },
  { no: 3, key: 'advanced', name: 'Advanced', blurb: 'Professional tracks: full-stack, AI, cloud, backend and database engineering.' },
];

// code -> [level, recommended-first codes]
const COURSES = {
  // Level 1 - Beginner
  'FC-01': [1, []],
  'FC-02': [1, []],
  'CS-104': [1, []],
  'CS-105': [1, []],
  'CS-106': [1, []],
  // Level 2 - Intermediate
  'CS1-ADV': [2, ['FC-01']],
  'CPP2-ADV': [2, ['FC-02']],
  'PY3-ADV': [2, ['CS-104']],
  'JS4-ADV': [2, ['CS-105']],
  'WEB5-ADV': [2, ['CS-106']],
  'TT-03': [2, ['CS-104']], // DSA: one language at a working level
  // Level 3 - Advanced
  'TT-01': [3, ['JS4-ADV', 'WEB5-ADV']], // Next.js + TypeScript: modern JS, HTML/CSS
  'TT-02': [3, ['PY3-ADV']], // RAG and agents: intermediate Python incl. async
  'TT-04': [3, ['TT-03']], // Cloud DevOps: able to build and debug an app
  'TT-05': [3, ['TT-03']], // Go backend: backend fundamentals
  'TT-06': [3, ['TT-03']], // PostgreSQL internals
};

const levelInfo = (no) => LEVELS.find((l) => l.no === no) || null;

/** Level fields for one catalogue course, or {} when it is not a mapped free course. */
function courseLevel(code, titleOf = () => null) {
  const row = COURSES[String(code || '').toUpperCase()];
  if (!row) return {};
  const [no, first] = row;
  const info = levelInfo(no);
  return {
    level_no: no, level: info.name, level_key: info.key,
    recommended_first: first.map((c) => ({ code: c, title: titleOf(c) || c })),
  };
}

/** Stage of the module at `index` (0-based) out of `total`: thirds, in order. */
function moduleStage(index, total) {
  if (!(total > 0)) return LEVELS[0];
  return LEVELS[Math.min(2, Math.floor((index * 3) / total))];
}

module.exports = { LEVELS, COURSES, courseLevel, moduleStage };
