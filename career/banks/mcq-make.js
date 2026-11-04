'use strict';
/**
 * Compact builder for the MCQ expansion banks (mcq-*.js).
 *
 * Each row: [kind, skill, difficulty, prompt, options, explanation, code?]
 *   kind: 'T' theory, 'P' practical (reading/fixing real code, queries,
 *         commands or configuration), 'S' scenario (a real-world decision)
 *   options[0] is the correct answer; option order is shuffled per student
 *   at delivery, so position carries no information.
 * IDs are stable: m-<skill>-<kind><difficulty>[-n], in row order.
 */
const { mc } = require('./../q');

function make(rows) {
  const seen = new Map();
  return rows.map(([kind, skill, d, prompt, options, explanation, code]) => {
    if (!['T', 'P', 'S'].includes(kind)) throw new Error('bad kind ' + kind);
    if (options.length !== 4 || new Set(options).size !== 4) throw new Error(`${skill} "${prompt.slice(0, 40)}": needs four distinct options`);
    const base = `m-${skill.replace(/\./g, '-')}-${kind.toLowerCase()}${d}`;
    const n = (seen.get(base) || 0) + 1; seen.set(base, n);
    const extra = { ...(code ? { code } : {}), ...(kind === 'P' ? { practical: true } : kind === 'S' ? { type: 'scenario' } : {}) };
    return mc(n === 1 ? base : `${base}-${n}`, skill, d, prompt, options, 0, explanation, extra);
  });
}
module.exports = { make };
