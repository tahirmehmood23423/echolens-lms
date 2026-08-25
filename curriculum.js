'use strict';

/**
 * EchoLens LMS - Coursera-style curriculum HTTP layer.
 *
 * Registered into server.js the same way showcase.js/talent.js are:
 * `require('./curriculum').register(app, { authRequired, teacherOrAdmin, adminRequired })`.
 * All data-layer logic (gating engine, progress, certificates, gems) lives
 * in curriculum-store.js - this file only ever does HTTP concerns: auth
 * scoping, turning {error}/{locked} returns into the right status code,
 * and serving the two dedicated pages.
 */

const path = require('path');
const curriculumStore = require('./curriculum-store');

const STAFF_ROLES = ['admin', 'instructor', 'coordinator'];

function isStaff(user) { return STAFF_ROLES.includes(user.role); }

/** A student can only ever ask about themselves; staff (admin/instructor/coordinator) can ask about anyone, matching the visibility rule this codebase already uses elsewhere (canManageBatch etc). */
function resolveTargetStudentId(req) {
  const requested = req.query.student_id || req.body?.student_id;
  if (requested && isStaff(req.user)) return Number(requested);
  return req.user.id;
}

function register(app, { authRequired, teacherOrAdmin, adminRequired }) {
  app.get('/api/curriculum/programmes', authRequired, async (req, res) => {
    res.json({ programmes: await curriculumStore.listProgrammes() });
  });

  app.get('/api/curriculum/courses/:id', authRequired, async (req, res) => {
    const studentId = resolveTargetStudentId(req);
    const result = await curriculumStore.getPathForStudent(req.params.id, studentId);
    if (!result) return res.status(404).json({ error: 'Course not found.' });
    res.json(result);
  });

  app.post('/api/curriculum/courses/:id/enroll', authRequired, async (req, res) => {
    const result = await curriculumStore.enrollStudent(req.user.id, req.params.id);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  // Locked modules are enforced here, at the API layer, not only hidden in
  // the interface - a direct request for a locked module returns 403 with
  // a reason string (spec Phase 3/4).
  app.get('/api/curriculum/modules/:id', authRequired, async (req, res) => {
    const studentId = resolveTargetStudentId(req);
    const result = await curriculumStore.getModuleForStudent(req.params.id, studentId);
    if (result.error) return res.status(404).json({ error: 'Module not found.' });
    if (result.locked) return res.status(403).json({ error: result.reason, locked: true });
    res.json(result);
  });

  app.post('/api/curriculum/modules/:id/assignments/:aid/submit', authRequired, async (req, res) => {
    const { text, file_url } = req.body || {};
    const result = await curriculumStore.submitAssignment({
      studentId: req.user.id, moduleId: req.params.id, assignmentId: req.params.aid, text, fileUrl: file_url,
    });
    if (result.error) return res.status(result.locked ? 403 : 400).json({ error: result.error });
    res.json(result);
  });

  app.post('/api/curriculum/modules/:id/project/submit', authRequired, async (req, res) => {
    const { text, file_url } = req.body || {};
    const result = await curriculumStore.submitProject({ studentId: req.user.id, moduleId: req.params.id, text, fileUrl: file_url });
    if (result.error) return res.status(result.locked ? 403 : 400).json({ error: result.error });
    res.json(result);
  });

  /* ------------------------------ instructor ------------------------------ */
  app.get('/api/curriculum/instructor/queue', authRequired, teacherOrAdmin, async (req, res) => {
    res.json(await curriculumStore.gradingQueue({ moduleId: req.query.module_id, courseId: req.query.course_id }));
  });

  app.post('/api/curriculum/assignment-submissions/:id/grade', authRequired, teacherOrAdmin, async (req, res) => {
    const { score, feedback } = req.body || {};
    if (score == null || Number.isNaN(Number(score))) return res.status(400).json({ error: 'A numeric score is required.' });
    if (!feedback || !String(feedback).trim()) return res.status(400).json({ error: 'Written feedback is required.' });
    const result = await curriculumStore.gradeAssignmentSubmission({ submissionId: req.params.id, score, feedback, gradedBy: req.user.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  });

  app.post('/api/curriculum/project-submissions/:id/grade', authRequired, teacherOrAdmin, async (req, res) => {
    const { score, feedback } = req.body || {};
    if (score == null || Number.isNaN(Number(score))) return res.status(400).json({ error: 'A numeric score is required.' });
    if (!feedback || !String(feedback).trim()) return res.status(400).json({ error: 'Written feedback is required.' });
    const result = await curriculumStore.gradeProjectSubmission({ submissionId: req.params.id, score, feedback, gradedBy: req.user.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  });

  app.post('/api/curriculum/modules/:id/quest-score', authRequired, teacherOrAdmin, async (req, res) => {
    const { student_id, score, feedback } = req.body || {};
    if (!student_id) return res.status(400).json({ error: 'student_id is required.' });
    if (score == null || Number.isNaN(Number(score))) return res.status(400).json({ error: 'A numeric score is required.' });
    const result = await curriculumStore.setQuestScore({ studentId: student_id, moduleId: req.params.id, score, feedback, gradedBy: req.user.id });
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  });

  app.get('/api/curriculum/modules/:id/attainment', authRequired, teacherOrAdmin, async (req, res) => {
    const result = await curriculumStore.moduleAttainment(req.params.id);
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  });

  app.post('/api/curriculum/programmes/:id/capstone', authRequired, teacherOrAdmin, async (req, res) => {
    const { student_id, passed } = req.body || {};
    if (!student_id) return res.status(400).json({ error: 'student_id is required.' });
    const result = await curriculumStore.setCapstoneDefense({ studentId: student_id, programmeId: req.params.id, passed: !!passed, setBy: req.user.id });
    res.json(result);
  });

  app.get('/api/curriculum/programmes/:id/diploma-eligibility', authRequired, async (req, res) => {
    const studentId = resolveTargetStudentId(req);
    const result = await curriculumStore.diplomaEligibility(studentId, req.params.id);
    if (result.error) return res.status(404).json({ error: result.error });
    res.json(result);
  });

  /* ------------------------------ pages ------------------------------ */
  app.get('/curriculum', (req, res) => res.sendFile(path.join(__dirname, 'public', 'curriculum.html')));
  app.get('/curriculum/instructor', (req, res) => res.sendFile(path.join(__dirname, 'public', 'curriculum-instructor.html')));
}

module.exports = { register };
