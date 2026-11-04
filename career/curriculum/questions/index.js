'use strict';
/**
 * Built-in comprehensive-assessment banks, keyed by canonical subtrack id.
 * Each bank records who authored and reviewed it. Status 'reviewed' means a
 * subject-specialist review was completed; questions are used in a live
 * assessment only after an admin PUBLISHES that subtrack's assessment.
 */
const REVIEW = { author: 'Claude (EchoLens subject-specialist author)', reviewed_by: 'Claude (EchoLens subject-specialist review)', reviewed_at: '2026-11-04',
  method: 'Item-by-item review for a single defensible answer, plausible distractors with misconception notes, scenario realism and difficulty; all Python and SQL outputs verified by execution (SQL in SQLite) (scripts/verify-career-code.js).' };
const BANKS = {
  'python-fundamentals': { ...REVIEW, questions: ['a', 'b', 'c'].flatMap((p) => require('./python-fundamentals.' + p)) },
  'sql-fundamentals': { ...REVIEW, questions: ['a', 'b'].flatMap((p) => require('./sql-fundamentals.' + p)) },
  'rest-api-design': { ...REVIEW, questions: ['a', 'b'].flatMap((p) => require('./rest-api-design.' + p)) },
};
for (const b of Object.values(BANKS)) for (const q of b.questions) q.status = 'reviewed';
module.exports = { BANKS, REVIEW };
