'use strict';

/**
 * Unit tests for curriculum-store.js's gating engine (spec Phase 8):
 *   - exactly 60% passes
 *   - 59.9% does not
 *   - resubmission raises a failed module to passed and unlocks the next
 * Runs against the real seeded handbook catalogue in JSON-file mode, own
 * scratch file - never touches a real curriculum.json or echolens.json.
 *
 * Run: node --test test/curriculum-gate.test.js
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const CURRICULUM_SCRATCH = path.join(os.tmpdir(), `curriculum-gate-test-${Date.now()}.json`);
const STORE_SCRATCH = path.join(os.tmpdir(), `curriculum-gate-store-${Date.now()}.json`);
process.env.CURRICULUM_DB_PATH = CURRICULUM_SCRATCH;
process.env.DB_PATH = STORE_SCRATCH; // JSON-file mode for the legacy store too (Certificates/GemEvents live there)

const curriculumStore = require('../curriculum-store');
const { CATALOGUE } = require('../seed/curriculum');

after(() => {
  for (const f of [CURRICULUM_SCRATCH, CURRICULUM_SCRATCH + '.tmp', STORE_SCRATCH, STORE_SCRATCH + '.tmp']) {
    try { fs.unlinkSync(f); } catch { /* already gone */ }
  }
});

const STUDENT_A = 9001;
const STUDENT_B = 9002;
let module1, module2, assignments;

before(async () => {
  await curriculumStore.seedCurriculum(CATALOGUE);
  const data = curriculumStore._allData();
  const cs11 = data.courses.find((c) => c.code === 'CS1.1');
  module1 = data.modules.find((m) => m.course_id === cs11.id && m.order_no === 1);
  module2 = data.modules.find((m) => m.course_id === cs11.id && m.order_no === 2);
  assignments = data.assignments.filter((a) => a.module_id === module1.id);
  assert.equal(assignments.length, 2, 'module 1 of CS1.1 should have exactly 2 assignments');
});

async function gradeModule1(studentId, { a1, a2, project, quest }) {
  await curriculumStore.enrollStudent(studentId, module1.course_id);
  const s1 = await curriculumStore.submitAssignment({ studentId, moduleId: module1.id, assignmentId: assignments[0].id, text: 'work' });
  const s2 = await curriculumStore.submitAssignment({ studentId, moduleId: module1.id, assignmentId: assignments[1].id, text: 'work' });
  const p1 = await curriculumStore.submitProject({ studentId, moduleId: module1.id, text: 'project work' });
  await curriculumStore.gradeAssignmentSubmission({ submissionId: s1.submission.id, score: a1, feedback: 'ok', gradedBy: 1 });
  await curriculumStore.gradeAssignmentSubmission({ submissionId: s2.submission.id, score: a2, feedback: 'ok', gradedBy: 1 });
  await curriculumStore.gradeProjectSubmission({ submissionId: p1.submission.id, score: project, feedback: 'ok', gradedBy: 1 });
  return curriculumStore.setQuestScore({ studentId, moduleId: module1.id, score: quest, feedback: 'ok', gradedBy: 1 });
}

test('a weighted score of exactly 60 passes the module', async () => {
  // assignments avg 60 * 0.45 + project 60 * 0.40 + quests 60 * 0.15 = 60 exactly
  const result = await gradeModule1(STUDENT_A, { a1: 60, a2: 60, project: 60, quest: 60 });
  assert.equal(result.progress.weighted_score, 60);
  assert.equal(result.progress.passed, true);

  const path1 = await curriculumStore.getPathForStudent(module1.course_id, STUDENT_A);
  const m2 = path1.modules.find((m) => m.id === module2.id);
  assert.equal(m2.unlocked, true, 'module 2 should unlock once module 1 hits exactly 60');
});

test('a weighted score of 59.9 does not pass the module', async () => {
  // assignments avg 59 * 0.45 + project 60 * 0.40 + quests 60 * 0.15 = 59.55 (below 60)
  // Use a combination that lands just under 60: 59, 60, 60 -> 59*0.45+60*0.4+60*0.15 = 59.55
  const result = await gradeModule1(STUDENT_B, { a1: 58, a2: 60, project: 60, quest: 60 });
  assert.ok(result.progress.weighted_score < 60, `expected < 60, got ${result.progress.weighted_score}`);
  assert.equal(result.progress.passed, false);

  const path1 = await curriculumStore.getPathForStudent(module1.course_id, STUDENT_B);
  const m2 = path1.modules.find((m) => m.id === module2.id);
  assert.equal(m2.unlocked, false, 'module 2 must stay locked below the 60% gate');
  assert.ok(m2.lock_reason, 'a locked module must carry a reason string');
});

test('resubmission raises a failed module to passed and unlocks the next module', async () => {
  const studentId = 9003;
  const failing = await gradeModule1(studentId, { a1: 40, a2: 40, project: 40, quest: 40 });
  assert.equal(failing.progress.passed, false);
  let locked = await curriculumStore.getPathForStudent(module1.course_id, studentId);
  assert.equal(locked.modules.find((m) => m.id === module2.id).unlocked, false);

  // Resubmit + regrade the project and both assignments higher - "the recorded score is the final accepted attempt".
  const resubA1 = await curriculumStore.submitAssignment({ studentId, moduleId: module1.id, assignmentId: assignments[0].id, text: 'v2' });
  const resubA2 = await curriculumStore.submitAssignment({ studentId, moduleId: module1.id, assignmentId: assignments[1].id, text: 'v2' });
  const resubP = await curriculumStore.submitProject({ studentId, moduleId: module1.id, text: 'v2' });
  await curriculumStore.gradeAssignmentSubmission({ submissionId: resubA1.submission.id, score: 80, feedback: 'better', gradedBy: 1 });
  await curriculumStore.gradeAssignmentSubmission({ submissionId: resubA2.submission.id, score: 80, feedback: 'better', gradedBy: 1 });
  const passing = await curriculumStore.gradeProjectSubmission({ submissionId: resubP.submission.id, score: 80, feedback: 'better', gradedBy: 1 });

  assert.equal(passing.progress.passed, true, 'the module should now be passed on the final accepted attempt');
  assert.equal(resubA1.submission.attempt_no, 2, 'the resubmission should be recorded as attempt 2');

  const unlocked = await curriculumStore.getPathForStudent(module1.course_id, studentId);
  assert.equal(unlocked.modules.find((m) => m.id === module2.id).unlocked, true, 'passing on resubmission must unlock module 2');
});

test('a weighted score of exactly 59.9 does not pass (precise boundary, spec wording)', async () => {
  const studentId = 9005;
  await curriculumStore.enrollStudent(studentId, module1.course_id);
  // evaluateModule() reads whatever is in component_scores - set it directly
  // to hit exactly 59.9 (45% * 59.9 + 40% * 59.9 + 15% * 59.9 = 59.9), rather
  // than hunting for three 0-100 grades whose weighted sum lands on that
  // exact decimal.
  const data = curriculumStore._allData();
  const prog = data.progress.find((p) => p.student_id === studentId && p.module_id === module1.id);
  prog.component_scores = { assignments: 59.9, project: 59.9, quests: 59.9 };
  const result = await curriculumStore.evaluateModule(studentId, module1.id);
  assert.equal(result.progress.weighted_score, 59.9);
  assert.equal(result.progress.passed, false, '59.9 must fail the 60% gate');
});

test('evaluateModule requires all three components before producing a verdict', async () => {
  const studentId = 9004;
  await curriculumStore.enrollStudent(studentId, module1.course_id);
  const s1 = await curriculumStore.submitAssignment({ studentId, moduleId: module1.id, assignmentId: assignments[0].id, text: 'work' });
  const result = await curriculumStore.gradeAssignmentSubmission({ submissionId: s1.submission.id, score: 100, feedback: 'ok', gradedBy: 1 });
  assert.equal(result.progress.weighted_score, null, 'no verdict until project and quest components are also graded');
  assert.equal(result.progress.passed, false);
});
