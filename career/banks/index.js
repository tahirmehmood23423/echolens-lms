'use strict';
/** Every question bank, keyed by id. hybrid-core adds practical, scenario and reviewed items to the original four. */
const core = require('./hybrid-core');
// Second practical and scenario items per skill, so every retake can draw unseen ones.
const alt = { ...require('./alt-web'), ...require('./alt-ai-mobile'), ...require('./alt-data-sec'), ...require('./alt-ops-qa-se') };

// MCQ expansion: easy practical/scenario items and harder theory, so every
// category runs from basic to advanced in every track.
const web = require('./mcq-web'), ai = require('./mcq-ai'), dat = require('./mcq-data'), so = require('./mcq-sec-ops'), qsm = require('./mcq-qa-se-mobile');

const BANKS = {
  common: { title: 'Common Computer Science Assessment', questions: [...require('./common'), ...core.common, ...require('./mcq-common')] },
  frontend: { title: 'Frontend skills', questions: [...require('./frontend'), ...core.frontend, ...alt.frontend, ...web.frontend] },
  backend: { title: 'Backend skills', questions: [...require('./backend'), ...core.backend, ...alt.backend, ...web.backend] },
  aiml: { title: 'AI & Machine Learning skills', questions: [...require('./aiml'), ...core.aiml, ...alt.aiml, ...ai.aiml] },
  mobile: { title: 'Mobile development skills', questions: [...require('./mobile'), ...alt.mobile, ...qsm.mobile] },
  genai: { title: 'Generative AI & LLM skills', questions: [...require('./genai'), ...alt.genai, ...ai.genai] },
  analyst: { title: 'Data analysis & BI skills', questions: [...require('./analyst'), ...alt.analyst, ...dat.analyst] },
  dataeng: { title: 'Data engineering skills', questions: [...require('./dataeng'), ...alt.dataeng, ...dat.dataeng] },
  cyber: { title: 'Cybersecurity skills', questions: [...require('./cyber'), ...alt.cyber, ...so.cyber] },
  devops: { title: 'Cloud & DevOps skills', questions: [...require('./devops'), ...alt.devops, ...so.devops] },
  qa: { title: 'QA & test automation skills', questions: [...require('./qa'), ...alt.qa, ...qsm.qa] },
  se: { title: 'Software engineering & DSA skills', questions: [...require('./se'), ...alt.se, ...qsm.se] },
};

/**
 * Content review. Every built-in question was reviewed for technical accuracy,
 * a single defensible answer, clear wording and fair distractors; code-tracing
 * answers were checked by executing the code (Python and JavaScript). Reviewed
 * questions ship PUBLISHED with this record. Admins can still retire any
 * question, and anything added or edited in the admin panel starts as a draft.
 */
const REVIEW = { by: 'Subject-specialist content review (Claude, acting as EchoLens assessment reviewer)', at: '2026-11-04', method: 'Manual review of every item; code-tracing answers verified by execution.' };
/**
 * MCQ-only assessments. Typed answers and staff-reviewed written/practical
 * submissions cannot be marked for a large audience, so:
 *  - every typed code-tracing/calculation question becomes a four-option MCQ
 *    (output-mcq.js: correct answer plus three common-mistake distractors);
 *  - staff-reviewed items stay in the bank as RETIRED (history and earlier
 *    results that used them keep working) and are never put on a new form.
 */
const OUTPUT_MCQ = require('./output-mcq');
const LETTERS = 'abcd';
for (const bank of Object.values(BANKS)) for (const q of bank.questions) {
  if (q.type === 'output') {
    const opts = OUTPUT_MCQ[q.id];
    if (!opts || opts.length !== 4 || new Set(opts).size !== 4) throw new Error(`${q.id}: needs four distinct MCQ options in output-mcq.js`);
    q.type = 'single'; q.options = opts.map((text, i) => ({ id: LETTERS[i], text })); q.answer = ['a']; q.was_typed = true;
  }
  q.status = q.grading === 'review' ? 'retired' : 'published'; q.review = REVIEW;
  if (q.grading === 'review') q.retired_reason = 'Assessments are multiple-choice only; written and practical submissions are not used.';
}

module.exports = { BANKS, REVIEW, OUTPUT_MCQ };
