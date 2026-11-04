'use strict';
/**
 * Question constructors shared by the banks.
 *
 * Every question belongs to one evaluation CATEGORY:
 *   theory     concepts, MCQs, multiple-select, code tracing, short explanations
 *   practical  hands-on work: debugging, fixing code/SQL/config, data tasks
 *   scenario   real-world problems needing reasoning and a decision
 *
 * and is graded one of two ways:
 *   auto    deterministic rules (options, or typed answers that must match)
 *   review  a staff member scores it against a rubric. AI may SUGGEST rubric
 *           scores to the reviewer, but nothing counts until staff confirm.
 *
 *   mc(id, skills, difficulty, prompt, options, correct, explanation, extra)
 *     correct: option index, or an array of indices for multiple-select.
 *   out(id, skills, difficulty, prompt, code, accepted, explanation, extra)
 *     typed answer - code tracing or a computed value. `accepted` lists every
 *     equivalent spelling; comparison ignores case and whitespace.
 *   written(id, skills, difficulty, category, prompt, rubric, model, extra)
 *     a short written explanation, reviewed against `rubric`.
 *   submission(id, skills, difficulty, prompt, rubric, model, extra)
 *     a practical submission (code, SQL, configuration, test cases) that the
 *     platform cannot run safely on the server, so staff review it.
 *     rubric: [[criterion, points], ...]
 *
 * extra: { code, type: 'debug' | 'scenario', category, practical, time_sec }
 * Default category: 'scenario' type -> scenario; 'debug' type or
 * practical:true -> practical; everything else -> theory. Points follow difficulty
 * (1, 2, 3) for auto items and the rubric total for reviewed items. All
 * questions ship as 'draft' until an admin reviews and publishes them.
 */
const LETTERS = 'abcdefgh';
const TIME = { 1: 45, 2: 75, 3: 105 };
const CATEGORIES = ['theory', 'practical', 'scenario'];

function categoryOf(type, extra) {
  if (extra.category) return extra.category;
  if (type === 'scenario') return 'scenario';
  if (type === 'debug' || extra.practical) return 'practical';
  return 'theory';
}
function base(id, skills, difficulty, prompt, explanation, extra = {}) {
  return {
    id, version: 1, status: 'draft', skills: [].concat(skills), difficulty, prompt, explanation,
    code: extra.code || null, points: difficulty, time_sec: extra.time_sec || TIME[difficulty], grading: 'auto',
  };
}
function finish(q, extra) {
  q.category = categoryOf(extra.type || q.type, extra);
  if (!CATEGORIES.includes(q.category)) throw new Error(`${q.id}: unknown category ${q.category}`);
  q.practical = q.category === 'practical';
  return q;
}
function mc(id, skills, difficulty, prompt, options, correct, explanation, extra = {}) {
  const multi = Array.isArray(correct);
  return finish({
    ...base(id, skills, difficulty, prompt, explanation, extra),
    type: multi ? 'multi' : (extra.type || 'single'),
    options: options.map((text, i) => ({ id: LETTERS[i], text })),
    answer: [].concat(correct).map((i) => LETTERS[i]),
  }, extra);
}
function out(id, skills, difficulty, prompt, code, accepted, explanation, extra = {}) {
  return finish({ ...base(id, skills, difficulty, prompt, explanation, { ...extra, code }), type: 'output', options: [], answer: accepted.map(String) }, extra);
}
function reviewed(type, id, skills, difficulty, category, prompt, rubric, model, extra = {}) {
  const r = rubric.map(([criterion, points]) => ({ criterion, points }));
  return finish({
    ...base(id, skills, difficulty, prompt, model, extra), type, grading: 'review', options: [], answer: [],
    rubric: r, model_answer: model, points: r.reduce((a, c) => a + c.points, 0),
    time_sec: extra.time_sec || (type === 'submission' ? 420 : 240),
  }, { ...extra, category });
}
const written = (id, skills, difficulty, category, prompt, rubric, model, extra) => reviewed('written', id, skills, difficulty, category, prompt, rubric, model, extra);
const submission = (id, skills, difficulty, prompt, rubric, model, extra) => reviewed('submission', id, skills, difficulty, 'practical', prompt, rubric, model, extra);

module.exports = { mc, out, written, submission, CATEGORIES };
