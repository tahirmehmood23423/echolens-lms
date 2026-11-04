'use strict';
/**
 * Question constructors shared by the banks.
 *
 *   mc(id, skills, difficulty, prompt, options, correct, explanation, extra)
 *     correct: an option index, or an array of indices for multiple-answer.
 *   out(id, skills, difficulty, prompt, code, accepted, explanation, extra)
 *     a typed answer (code-output prediction or a computed value). `accepted`
 *     lists every equivalent correct spelling; comparison ignores case and
 *     surrounding/inner whitespace (engine.normalizeTyped).
 *
 * extra: { code, type: 'debug' | 'scenario', practical: true, time_sec }
 * Points follow difficulty (1, 2, 3). Every question ships as 'draft' - an
 * admin must review it before it can appear in a student's assessment.
 */
const LETTERS = 'abcdefgh';
const TIME = { 1: 45, 2: 75, 3: 105 };

function base(id, skills, difficulty, prompt, explanation, extra = {}) {
  return {
    id, version: 1, status: 'draft', skills: [].concat(skills), difficulty, prompt, explanation,
    code: extra.code || null, practical: !!extra.practical,
    points: difficulty, time_sec: extra.time_sec || TIME[difficulty],
  };
}
function mc(id, skills, difficulty, prompt, options, correct, explanation, extra = {}) {
  const multi = Array.isArray(correct);
  return {
    ...base(id, skills, difficulty, prompt, explanation, extra),
    type: multi ? 'multi' : (extra.type || 'single'),
    options: options.map((text, i) => ({ id: LETTERS[i], text })),
    answer: [].concat(correct).map((i) => LETTERS[i]),
  };
}
function out(id, skills, difficulty, prompt, code, accepted, explanation, extra = {}) {
  return { ...base(id, skills, difficulty, prompt, explanation, { ...extra, code }), type: 'output', options: [], answer: accepted.map(String) };
}
module.exports = { mc, out };
