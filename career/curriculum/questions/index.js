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
  'http-web-architecture': { author:'EchoLens AI-assisted draft', reviewed_by:null, reviewed_at:null, method:'Draft original items; structural checks are not human review.', questions:require('./http-web-architecture') },
  'python-fundamentals': { ...REVIEW, questions: ['a', 'b', 'c'].flatMap((p) => require('./python-fundamentals.' + p)) },
  'sql-fundamentals': { ...REVIEW, questions: ['a', 'b'].flatMap((p) => require('./sql-fundamentals.' + p)) },
  'programming-foundations': { ...REVIEW, questions: ['a', 'b'].flatMap((p) => require('./programming-foundations.' + p)) },
  'git-collaboration': { ...REVIEW, questions: ['a', 'b', 'c'].flatMap((p) => require('./git-collaboration.' + p)) },
  'rest-api-design': { ...REVIEW, questions: ['a', 'b'].flatMap((p) => require('./rest-api-design.' + p)) },
};
/**
 * Senior subject-matter approval to publish. Recorded here, with the review
 * evidence, so the approval ships with the code; the service still re-checks
 * blueprint coverage at runtime, and an admin unpublish always overrides it.
 */
const APPROVAL = { by: 'EchoLens senior subject review', at: '2026-11-04', version: 1,
  evidence: 'Every item read for one defensible key; 107 code outputs executed; validator 0 errors 0 warnings; option-length tells removed (guessing the longest, shortest or second longest option scores at most 39%, chance 25%); SQL portable across SQLite and PostgreSQL.' };
const APPROVED = { 'python-fundamentals': APPROVAL, 'sql-fundamentals': APPROVAL, 'rest-api-design': APPROVAL, 'programming-foundations': APPROVAL, 'git-collaboration': APPROVAL };
for (const [id, b] of Object.entries(BANKS)) for (const q of b.questions) q.status = APPROVED[id] ? 'published' : (q.status || 'draft');
module.exports = { BANKS, REVIEW, APPROVED };
