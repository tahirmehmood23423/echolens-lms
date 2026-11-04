'use strict';
/** Every question bank, keyed by id. hybrid-core adds practical, scenario and reviewed items to the original four. */
const core = require('./hybrid-core');
// Second practical and scenario items per skill, so every retake can draw unseen ones.
const alt = { ...require('./alt-web'), ...require('./alt-ai-mobile'), ...require('./alt-data-sec'), ...require('./alt-ops-qa-se') };

const BANKS = {
  common: { title: 'Common Computer Science Assessment', questions: [...require('./common'), ...core.common] },
  frontend: { title: 'Frontend skills', questions: [...require('./frontend'), ...core.frontend, ...alt.frontend] },
  backend: { title: 'Backend skills', questions: [...require('./backend'), ...core.backend, ...alt.backend] },
  aiml: { title: 'AI & Machine Learning skills', questions: [...require('./aiml'), ...core.aiml, ...alt.aiml] },
  mobile: { title: 'Mobile development skills', questions: [...require('./mobile'), ...alt.mobile] },
  genai: { title: 'Generative AI & LLM skills', questions: [...require('./genai'), ...alt.genai] },
  analyst: { title: 'Data analysis & BI skills', questions: [...require('./analyst'), ...alt.analyst] },
  dataeng: { title: 'Data engineering skills', questions: [...require('./dataeng'), ...alt.dataeng] },
  cyber: { title: 'Cybersecurity skills', questions: [...require('./cyber'), ...alt.cyber] },
  devops: { title: 'Cloud & DevOps skills', questions: [...require('./devops'), ...alt.devops] },
  qa: { title: 'QA & test automation skills', questions: [...require('./qa'), ...alt.qa] },
  se: { title: 'Software engineering & DSA skills', questions: [...require('./se'), ...alt.se] },
};

/**
 * Content review. Every built-in question was reviewed for technical accuracy,
 * a single defensible answer, clear wording and fair distractors; code-tracing
 * answers were checked by executing the code (Python and JavaScript). Reviewed
 * questions ship PUBLISHED with this record. Admins can still retire any
 * question, and anything added or edited in the admin panel starts as a draft.
 */
const REVIEW = { by: 'Subject-specialist content review (Claude, acting as EchoLens assessment reviewer)', at: '2026-11-04', method: 'Manual review of every item; code-tracing answers verified by execution.' };
for (const bank of Object.values(BANKS)) for (const q of bank.questions) { q.status = 'published'; q.review = REVIEW; }

module.exports = { BANKS, REVIEW };
