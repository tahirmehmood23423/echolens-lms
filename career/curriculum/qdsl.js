'use strict';
/**
 * Comprehensive-assessment questions (one bank per subtrack, questions/<subtrack>.js).
 *
 *   Q(id, comp, diff, type, scenario, prompt, code, options, answer, explanation, why, extra)
 *     comp      competency id relative to the subtrack, e.g. 'm2.c1'
 *     diff      E (easy) | M (medium) | H (hard) | A (advanced)
 *     type      concept | scenario | output | error | completion | debugging | sql | config | architecture | log
 *     scenario  business/workplace setting ('e-commerce', 'hospital', 'lms', 'banking', ...) or null for a
 *               foundational item. All scenarios are ORIGINAL; none is attributed to a real company.
 *     options   exactly four strings; answer is the index (0-3) of the single correct one
 *     why       three strings: the misconception behind each WRONG option, in option order
 *     extra     { expect } for code questions: the exact output, checked by scripts/verify-career-code.js
 *               and required to equal the correct option
 *
 * Every question is validated by validateQuestion() before it can be used.
 */
const TYPES = ['concept', 'scenario', 'output', 'error', 'completion', 'debugging', 'sql', 'config', 'architecture', 'log'];
const DIFFS = { E: 'easy', M: 'medium', H: 'hard', A: 'advanced' };

function Q(id, comp, diff, type, scenario, prompt, code, options, answer, explanation, why, extra = {}) {
  return { id, comp, difficulty: DIFFS[diff] || diff, type, scenario: scenario || null, scenario_origin: scenario ? 'original' : null,
    prompt, code: code || null, options, answer, explanation, why, expect: extra.expect ?? null, lang: extra.lang || (code ? 'python' : null), version: 1 };
}

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const lnorm = (s) => norm(s).toLowerCase();
const SHORTCUT = /\b(all|none|both) of the above\b|\ball of these\b|\bnone of these\b/i;

/**
 * Check one question against the quality standard. `subtrack` is the
 * canonical subtrack it belongs to. Returns { errors, warnings }.
 */
function validateQuestion(q, subtrack) {
  const errors = [], warnings = [];
  const e = (m) => errors.push(m), w = (m) => warnings.push(m);
  if (!q.id) e('missing id');
  if (!Array.isArray(q.options) || q.options.length !== 4) e('needs exactly four options');
  else {
    if (new Set(q.options.map(norm)).size !== 4) e('two options have the same text');
    if (q.options.some((o) => !String(o).trim())) e('an option is empty');
    if (q.options.some((o) => SHORTCUT.test(o))) e('uses an "all/none of the above" shortcut');
  }
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) e('answer must be exactly one option index (0-3)');
  if (!Object.values(DIFFS).includes(q.difficulty)) e(`unknown difficulty ${q.difficulty}`);
  if (!TYPES.includes(q.type)) e(`unknown type ${q.type}`);
  if (!q.prompt || q.prompt.length < 15) e('prompt too short');
  if (!q.explanation || q.explanation.length < 30) e('explanation must say why the answer is correct');
  if (!Array.isArray(q.why) || q.why.length !== 3 || q.why.some((x) => !x || x.length < 10)) e('needs a misconception note for each of the three wrong options');
  if (subtrack) {
    const mod = subtrack.modules.find((m) => q.comp && q.comp.startsWith(m.id.slice(subtrack.id.length + 1) + '.'));
    const comp = mod && mod.objectives.find((o) => o.id === `${subtrack.id}.${q.comp}`);
    if (!comp) e(`competency ${q.comp} is not part of ${subtrack.id}`);
  }
  if (q.expect != null && Array.isArray(q.options) && Number.isInteger(q.answer) && String(q.options[q.answer]).trim() !== String(q.expect).trim()) e('the correct option does not match the verified code output');
  if (q.type === 'output' && q.expect == null) e('output questions must declare the expected output so it can be verified');
  if (Array.isArray(q.options) && Number.isInteger(q.answer) && q.options.length === 4) {
    const r = String(q.options[q.answer]).length, wrong = Math.max(...q.options.filter((_, i) => i !== q.answer).map((o) => String(o).length));
    if (r > 25 && r > wrong * 1.15) w('the correct option is noticeably longer than the others');
  }
  return { errors, warnings };
}

/** Bank-level checks: duplicate ids, identical and near-identical questions. */
function validateBank(questions, subtrack) {
  const out = { errors: [], warnings: [], items: {} };
  const ids = new Set(), sigs = new Map();
  const tok = (q) => new Set(norm(q.prompt + ' ' + (q.code || '')).split(' ').filter((x) => x.length > 2));
  const toks = questions.map((q) => [q.id, tok(q)]);
  for (const q of questions) {
    const v = validateQuestion(q, subtrack);
    if (ids.has(q.id)) v.errors.push('duplicate question id'); ids.add(q.id);
    const sig = norm(q.prompt) + '|' + norm(q.code);
    if (sigs.has(sig)) v.errors.push(`identical to ${sigs.get(sig)}`); else sigs.set(sig, q.id);
    out.items[q.id] = v;
  }
  for (let i = 0; i < toks.length; i++) for (let j = i + 1; j < toks.length; j++) {
    const a = toks[i][1], b = toks[j][1], inter = [...a].filter((x) => b.has(x)).length, sim = inter / (a.size + b.size - inter || 1);
    if (sim >= 0.8) out.items[toks[j][0]].warnings.push(`very similar to ${toks[i][0]} (${Math.round(sim * 100)}%)`);
  }
  for (const [id, v] of Object.entries(out.items)) { v.errors.forEach((m) => out.errors.push(`${id}: ${m}`)); v.warnings.forEach((m) => out.warnings.push(`${id}: ${m}`)); }
  return out;
}

module.exports = { Q, TYPES, DIFFS, validateQuestion, validateBank };
