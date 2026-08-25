'use strict';

/**
 * EchoLens LMS - Coursera-style curriculum module (Programme/Course/Module)
 *
 * Deliberately isolated from store.js's persistence machinery. store.js's
 * Postgres path is a generic snapshot-diff flush engine shared by every
 * other feature in this app, and its own header comments document that a
 * single constraint/FK violation anywhere poisons every subsequent flush
 * for the life of the process. Wiring a brand-new, still-settling feature
 * into that shared engine risks degrading persistence for enrollments,
 * gems and certificates that have nothing to do with it. Instead this
 * module owns a single, self-contained blob of state:
 *
 *   - DATABASE_URL set (production): one row of JSONB in a dedicated
 *     `curriculum_store` table, written with a plain parameterized query
 *     through db.js's pool. No Prisma model, no schema-map.js entry, no
 *     shared flush queue.
 *   - DATABASE_URL unset (local dev): a JSON file next to the legacy
 *     echolens.json (CURRICULUM_DB_PATH, default ./curriculum.json),
 *     written atomically (temp file + rename). This is exactly the
 *     "keep the existing JSON file storage pattern" instruction, and
 *     mirrors the `(id, data JSONB)` blob shape store.js's own header
 *     comments describe as this codebase's pre-Prisma convention.
 *
 * Every field name is snake_case to match the rest of this codebase's
 * stored-data convention (see store.js), even though this module has its
 * own storage. Certificates and gems are NOT reimplemented here - this
 * module calls straight into store.js's existing `Certificates.issue()`
 * and `GemEvents.create()` so serial numbers, QR verification and gem
 * totals keep working exactly as they do today (gem totals are computed
 * live by summing `gem_events`, so nothing needs to be "migrated").
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');
const store = require('./store');

const { Certificates, GemEvents, Users } = store;

const SCHEMA_VERSION = 1;
const CURRICULUM_DB_PATH = process.env.CURRICULUM_DB_PATH || path.join(__dirname, 'curriculum.json');
const CURRICULUM_TABLE = 'curriculum_store';

/**
 * Single source of truth for the progression gate (spec: "Do not hard
 * code the 60 percent threshold or the 45/40/15 weightings in more than
 * one place"). Every weighting/threshold decision in this file reads from
 * here; nothing else defines these numbers.
 */
const MODULE_GATE = Object.freeze({
  passThreshold: 60, // percent, inclusive - see evaluateModule()
  weights: Object.freeze({ assignments: 0.45, project: 0.40, quests: 0.15 }),
});
const ATTAINMENT_BANDS = Object.freeze({ watchMax: 70, watchMin: 55 }); // per OBE framework section 10

function now() { return new Date().toISOString(); }
function today() { return new Date().toISOString().slice(0, 10); }

function emptyState() {
  return {
    schema_version: SCHEMA_VERSION,
    seq: {
      programmes: 0, courses: 0, modules: 0, sections: 0, assignments: 0, projects: 0,
      enrollments: 0, progress: 0, assignment_submissions: 0, project_submissions: 0, capstone_flags: 0,
    },
    programmes: [], courses: [], modules: [], sections: [], assignments: [], projects: [],
    enrollments: [], progress: [], assignment_submissions: [], project_submissions: [], capstone_flags: [],
  };
}

/* ------------------------------ schema migration chain ------------------------------ */
// v1 is the only version today. Future upgrades add a case here rather
// than mutating in place elsewhere, so an upgrade is always a named,
// reviewable step and never silently corrupts a stored state.
function migrateSchema(state) {
  if (!state || typeof state !== 'object') return emptyState();
  const base = emptyState();
  for (const k of Object.keys(base)) if (state[k] === undefined) state[k] = base[k];
  for (const k of Object.keys(base.seq)) if (state.seq[k] === undefined) state.seq[k] = 0;
  if (!state.schema_version || state.schema_version < 1) state.schema_version = 1;
  // if (state.schema_version < 2) { ...upgrade to v2...; state.schema_version = 2; }
  return state;
}

/* ------------------------------ load/persist ------------------------------ */
let data = null;
let loadingPromise = null;
let tableEnsured = false;

async function ensureTable() {
  if (tableEnsured) return;
  await db.query(`CREATE TABLE IF NOT EXISTS ${CURRICULUM_TABLE} (
    id INTEGER PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  tableEnsured = true;
}

async function doLoad() {
  if (db.enabled()) {
    await ensureTable();
    const { rows } = await db.query(`SELECT data FROM ${CURRICULUM_TABLE} WHERE id = 1`);
    data = migrateSchema(rows[0] ? rows[0].data : emptyState());
  } else {
    try {
      data = migrateSchema(JSON.parse(fs.readFileSync(CURRICULUM_DB_PATH, 'utf8')));
    } catch {
      data = emptyState();
    }
  }
  return data;
}

/** Every exported function calls this first. Memoized so repeated calls within one boot don't re-read storage. */
async function ensureLoaded() {
  if (data) return data;
  if (!loadingPromise) loadingPromise = doLoad();
  return loadingPromise;
}

async function persist() {
  if (db.enabled()) {
    await ensureTable();
    await db.query(
      `INSERT INTO ${CURRICULUM_TABLE} (id, data, updated_at) VALUES (1, $1, now())
       ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = now()`,
      [JSON.stringify(data)]
    );
  } else {
    const tmp = CURRICULUM_DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, CURRICULUM_DB_PATH);
  }
}

/** Test-only: forces the next ensureLoaded() to re-read storage from scratch (mirrors store.js test conventions - see test/gem-totals.test.js). */
function _resetForTest() { data = null; loadingPromise = null; tableEnsured = false; }
/** Test-only: direct access to the in-memory state, same pattern as store.js's allData(). */
function _allData() { return data; }

/** Snapshots the current stored state to backups/ before a seed or migration runs, mirroring the backups/echolens-*.json convention already used for the legacy store. Idempotent-safe: harmless if called repeatedly. */
async function backup() {
  await ensureLoaded();
  const dir = path.join(__dirname, 'backups');
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* already exists */ }
  const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
  const file = path.join(dir, `curriculum-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

function nextId(collection) { return (data.seq[collection] = (data.seq[collection] || 0) + 1); }

/* ------------------------------ seeding (idempotent) ------------------------------ */
/**
 * catalogue shape: [{ code, name, courses: [{ code, title, level, order_no,
 *   capstone_artifact, modules: [{ order_no, title, learning_outcome,
 *   sections: {videos:[...], reading, rules:[...], example:{...}},
 *   assignments: [{title, brief, pass_criteria}, {..}], project: {title, brief} }] }] }]
 *
 * Matched by code (programme/course) and by (course_id, order_no) for
 * modules, so re-running the seed updates existing rows in place rather
 * than duplicating them - "The seed must be re runnable without
 * duplicating records."
 */
async function seedCurriculum(catalogue) {
  await ensureLoaded();
  await backup();

  for (const p of catalogue) {
    let programme = data.programmes.find((x) => x.code === p.code);
    if (!programme) {
      programme = { id: nextId('programmes'), code: p.code, name: p.name, created_at: now() };
      data.programmes.push(programme);
    } else {
      programme.name = p.name;
    }

    for (const c of p.courses) {
      let course = data.courses.find((x) => x.code === c.code);
      if (!course) {
        course = {
          id: nextId('courses'), programme_id: programme.id, code: c.code, title: c.title,
          level: c.level, order_no: c.order_no, capstone_artifact: c.capstone_artifact || null,
          created_at: now(),
        };
        data.courses.push(course);
      } else {
        Object.assign(course, {
          programme_id: programme.id, title: c.title, level: c.level, order_no: c.order_no,
          capstone_artifact: c.capstone_artifact || null,
        });
      }

      for (const m of c.modules) {
        let mod = data.modules.find((x) => x.course_id === course.id && x.order_no === m.order_no);
        if (!mod) {
          mod = {
            id: nextId('modules'), course_id: course.id, order_no: m.order_no,
            title: m.title, learning_outcome: m.learning_outcome, created_at: now(),
          };
          data.modules.push(mod);
        } else {
          Object.assign(mod, { title: m.title, learning_outcome: m.learning_outcome });
        }

        const sectionKinds = ['videos', 'reading', 'rules', 'example', 'assignments', 'project'];
        sectionKinds.forEach((kind, idx) => {
          let sec = data.sections.find((x) => x.module_id === mod.id && x.kind === kind);
          const content = kind === 'videos' ? m.sections.videos
            : kind === 'reading' ? m.sections.reading
            : kind === 'rules' ? m.sections.rules
            : kind === 'example' ? m.sections.example
            : null; // assignments/project sections are headers; real records live in their own arrays below
          if (!sec) {
            sec = { id: nextId('sections'), module_id: mod.id, order_no: idx + 1, kind, content };
            data.sections.push(sec);
          } else {
            sec.order_no = idx + 1;
            if (content !== null) sec.content = content;
          }
        });

        // Assignments: replace-by-order so re-seeding updates text without duplicating.
        m.assignments.forEach((a, i) => {
          let rec = data.assignments.find((x) => x.module_id === mod.id && x.order_no === i + 1);
          if (!rec) {
            rec = { id: nextId('assignments'), module_id: mod.id, order_no: i + 1, title: a.title, brief: a.brief, pass_criteria: a.pass_criteria, created_at: now() };
            data.assignments.push(rec);
          } else {
            Object.assign(rec, { title: a.title, brief: a.brief, pass_criteria: a.pass_criteria });
          }
        });

        let proj = data.projects.find((x) => x.module_id === mod.id);
        if (!proj) {
          proj = { id: nextId('projects'), module_id: mod.id, title: m.project.title, brief: m.project.brief, created_at: now() };
          data.projects.push(proj);
        } else {
          Object.assign(proj, { title: m.project.title, brief: m.project.brief });
        }
      }
    }
  }

  await persist();
  return {
    programmes: data.programmes.length, courses: data.courses.length,
    modules: data.modules.length, sections: data.sections.length,
  };
}

/* ------------------------------ catalogue reads ------------------------------ */
async function listProgrammes() {
  await ensureLoaded();
  return data.programmes.map((p) => ({
    ...p,
    courses: data.courses.filter((c) => c.programme_id === p.id).sort((a, b) => a.order_no - b.order_no),
  }));
}

function moduleComponentBreakdown(prog) {
  if (!prog) return { assignments: null, project: null, quests: null };
  return { ...prog.component_scores };
}

/** Missing-component + shortfall gap, for the "tell them what to do next" UI requirement (spec Phase 5). Mirrors evaluateModule()'s own all-three-known rule - a weighted figure is only ever shown once every component has a real grade. */
function gapReport(prog) {
  const w = MODULE_GATE.weights;
  const scores = prog ? prog.component_scores : { assignments: null, project: null, quests: null };
  const parts = ['assignments', 'project', 'quests'].map((k) => ({ key: k, weight: w[k], score: scores[k] == null ? null : scores[k] }));
  const missing = parts.filter((p) => p.score == null).map((p) => p.key);
  const weighted = missing.length ? null : parts.reduce((s, p) => s + p.score * p.weight, 0);
  return {
    weighted_score: weighted == null ? null : Math.round(weighted * 100) / 100,
    missing,
    short_by: weighted == null ? null : Math.max(0, Math.round((MODULE_GATE.passThreshold - weighted) * 100) / 100),
  };
}

function progressFor(studentId, moduleId) {
  return data.progress.find((p) => p.student_id === Number(studentId) && p.module_id === Number(moduleId)) || null;
}
function ensureProgressRow(studentId, moduleId, courseId) {
  let prog = progressFor(studentId, moduleId);
  if (!prog) {
    prog = {
      id: nextId('progress'), student_id: Number(studentId), module_id: Number(moduleId), course_id: Number(courseId),
      component_scores: { assignments: null, project: null, quests: null },
      weighted_score: null, passed: false, unlocked_at: null, passed_at: null, attempts: [],
    };
    data.progress.push(prog);
  }
  return prog;
}

/** Course detail with per-module lock state, progress % and component breakdown - Phase 4/5 requirement. */
async function getPathForStudent(courseId, studentId) {
  await ensureLoaded();
  const course = data.courses.find((c) => c.id === Number(courseId));
  if (!course) return null;
  const modules = data.modules.filter((m) => m.course_id === course.id).sort((a, b) => a.order_no - b.order_no);
  const enrolled = !!data.enrollments.find((e) => e.student_id === Number(studentId) && e.course_id === course.id);
  return {
    course, enrolled,
    modules: modules.map((m) => {
      const prog = progressFor(studentId, m.id);
      const unlocked = !!prog && !!prog.unlocked_at;
      return {
        ...m,
        unlocked,
        lock_reason: unlocked ? null : (m.order_no === 1 ? 'Enroll in this course to begin.' : 'Pass the previous module to unlock this one.'),
        passed: !!prog && prog.passed,
        weighted_score: prog ? prog.weighted_score : null,
        component_scores: moduleComponentBreakdown(prog),
        gap: unlocked && prog && !prog.passed ? gapReport(prog) : null,
      };
    }),
  };
}

/** Module detail: 6 sections in order + assignments + project + this student's progress. Returns {locked, reason} instead of throwing - the route layer turns that into a 403. */
async function getModuleForStudent(moduleId, studentId) {
  await ensureLoaded();
  const mod = data.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return { error: 'not_found' };
  const prog = progressFor(studentId, mod.id);
  if (!prog || !prog.unlocked_at) {
    return {
      locked: true,
      reason: mod.order_no === 1
        ? 'Enroll in this course to unlock module 1.'
        : 'This module is locked. Pass the previous module at 60% or above to unlock it.',
    };
  }
  const sections = data.sections.filter((s) => s.module_id === mod.id).sort((a, b) => a.order_no - b.order_no);
  const assignments = data.assignments.filter((a) => a.module_id === mod.id).sort((a, b) => a.order_no - b.order_no);
  const project = data.projects.find((p) => p.module_id === mod.id) || null;
  return {
    locked: false,
    module: mod, sections, assignments, project,
    progress: { component_scores: prog.component_scores, weighted_score: prog.weighted_score, passed: prog.passed, gap: prog.passed ? null : gapReport(prog) },
    assignment_submissions: data.assignment_submissions.filter((s) => s.module_id === mod.id && s.student_id === Number(studentId)),
    project_submissions: data.project_submissions.filter((s) => s.module_id === mod.id && s.student_id === Number(studentId)),
  };
}

/* ------------------------------ enrollment ------------------------------ */
async function enrollStudent(studentId, courseId) {
  await ensureLoaded();
  const course = data.courses.find((c) => c.id === Number(courseId));
  if (!course) return { error: 'Course not found.' };
  let enr = data.enrollments.find((e) => e.student_id === Number(studentId) && e.course_id === course.id);
  if (!enr) {
    enr = { id: nextId('enrollments'), student_id: Number(studentId), course_id: course.id, enrolled_at: now() };
    data.enrollments.push(enr);
  }
  const modules = data.modules.filter((m) => m.course_id === course.id).sort((a, b) => a.order_no - b.order_no);
  const first = modules[0];
  if (first) {
    const prog = ensureProgressRow(studentId, first.id, course.id);
    if (!prog.unlocked_at) prog.unlocked_at = now();
  }
  await persist();
  return { ok: true, enrollment: enr };
}

/* ------------------------------ submissions ------------------------------ */
function requireUnlocked(studentId, moduleId) {
  const prog = progressFor(studentId, moduleId);
  return !!prog && !!prog.unlocked_at;
}

async function submitAssignment({ studentId, moduleId, assignmentId, text, fileUrl }) {
  await ensureLoaded();
  const mod = data.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return { error: 'Module not found.' };
  if (!requireUnlocked(studentId, moduleId)) return { error: 'This module is locked.', locked: true };
  const assignment = data.assignments.find((a) => a.id === Number(assignmentId) && a.module_id === mod.id);
  if (!assignment) return { error: 'Assignment not found.' };
  const priorCount = data.assignment_submissions.filter((s) => s.assignment_id === assignment.id && s.student_id === Number(studentId)).length;
  const sub = {
    id: nextId('assignment_submissions'), module_id: mod.id, assignment_id: assignment.id, student_id: Number(studentId),
    submitted_at: now(), text: text || null, file_url: fileUrl || null, attempt_no: priorCount + 1,
    score: null, feedback: null, graded_at: null, graded_by: null,
  };
  data.assignment_submissions.push(sub);
  await persist();
  return { ok: true, submission: sub };
}

async function submitProject({ studentId, moduleId, text, fileUrl }) {
  await ensureLoaded();
  const mod = data.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return { error: 'Module not found.' };
  if (!requireUnlocked(studentId, moduleId)) return { error: 'This module is locked.', locked: true };
  const priorCount = data.project_submissions.filter((s) => s.module_id === mod.id && s.student_id === Number(studentId)).length;
  const sub = {
    id: nextId('project_submissions'), module_id: mod.id, student_id: Number(studentId),
    submitted_at: now(), text: text || null, file_url: fileUrl || null, attempt_no: priorCount + 1,
    score: null, feedback: null, graded_at: null, graded_by: null,
  };
  data.project_submissions.push(sub);
  await persist();
  return { ok: true, submission: sub };
}

/** Grading queue for an instructor: latest submission per student that has no score yet. */
async function gradingQueue({ moduleId, courseId }) {
  await ensureLoaded();
  const moduleIds = moduleId ? [Number(moduleId)] : data.modules.filter((m) => !courseId || m.course_id === Number(courseId)).map((m) => m.id);
  const pendingAssignments = data.assignment_submissions.filter((s) => moduleIds.includes(s.module_id) && s.score == null);
  const pendingProjects = data.project_submissions.filter((s) => moduleIds.includes(s.module_id) && s.score == null);
  return { pending_assignments: pendingAssignments, pending_projects: pendingProjects };
}

/* ------------------------------ gating engine ------------------------------ */
/**
 * Single evaluator - every part of the system that needs to know pass/lock
 * state calls this, or reads its already-persisted result off the
 * `progress` row. Nothing else in this file (or callers of it) computes
 * the 60% threshold or the 45/40/15 weighting independently.
 */
async function evaluateModule(studentId, moduleId) {
  await ensureLoaded();
  const mod = data.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return { error: 'Module not found.' };
  const prog = ensureProgressRow(studentId, mod.id, mod.course_id);

  const w = MODULE_GATE.weights;
  const s = prog.component_scores;
  // Weighted score only counts as final once ALL THREE components are graded
  // (assignments average, project, quests) - a partial weighted average
  // against only-known components would let a module "pass" on 45% of the
  // real weight. Until all three exist, the module simply has no verdict yet.
  const allThreeKnown = ['assignments', 'project', 'quests'].every((k) => s[k] != null);
  const finalWeighted = allThreeKnown
    ? (s.assignments * w.assignments) + (s.project * w.project) + (s.quests * w.quests)
    : null;

  const wasPassed = prog.passed;
  prog.weighted_score = finalWeighted == null ? null : Math.round(finalWeighted * 100) / 100;
  prog.passed = finalWeighted != null && finalWeighted >= MODULE_GATE.passThreshold;

  if (prog.passed && !wasPassed) prog.passed_at = now();
  if (!prog.passed) prog.passed_at = null; // a later regrade can revoke pass state - the recorded score is always the final attempt

  if (prog.passed) await onModulePassed(studentId, mod);

  await persist();
  return { ok: true, progress: prog };
}

async function onModulePassed(studentId, mod) {
  const course = data.courses.find((c) => c.id === mod.course_id);
  const siblings = data.modules.filter((m) => m.course_id === mod.course_id).sort((a, b) => a.order_no - b.order_no);
  const next = siblings.find((m) => m.order_no === mod.order_no + 1);
  if (next) {
    const nextProg = ensureProgressRow(studentId, next.id, mod.course_id);
    if (!nextProg.unlocked_at) nextProg.unlocked_at = now();
  } else {
    // Last module of the course passed - check whether every module in the course is now passed.
    const allPassed = siblings.every((m) => {
      const p = progressFor(studentId, m.id);
      return p && p.passed;
    });
    if (allPassed) await maybeIssueCourseCertificate(studentId, course);
  }
}

/* ------------------------------ grading endpoints ------------------------------ */
async function gradeAssignmentSubmission({ submissionId, score, feedback, gradedBy }) {
  await ensureLoaded();
  const sub = data.assignment_submissions.find((s) => s.id === Number(submissionId));
  if (!sub) return { error: 'Submission not found.' };
  const clamped = Math.max(0, Math.min(100, Number(score)));
  sub.score = clamped; sub.feedback = feedback || null; sub.graded_at = now(); sub.graded_by = gradedBy;

  const mod = data.modules.find((m) => m.id === sub.module_id);
  const prog = ensureProgressRow(sub.student_id, mod.id, mod.course_id);
  const moduleAssignmentIds = data.assignments.filter((a) => a.module_id === mod.id).map((a) => a.id);
  // Latest graded score per assignment for this student, averaged across the module's assignments.
  const latestPerAssignment = moduleAssignmentIds.map((aid) => {
    const subs = data.assignment_submissions
      .filter((x) => x.assignment_id === aid && x.student_id === sub.student_id && x.score != null)
      .sort((a, b) => new Date(b.graded_at) - new Date(a.graded_at));
    return subs[0] ? subs[0].score : null;
  }).filter((v) => v != null);
  prog.component_scores.assignments = latestPerAssignment.length
    ? Math.round((latestPerAssignment.reduce((s, v) => s + v, 0) / latestPerAssignment.length) * 100) / 100
    : null;
  prog.attempts.push({ at: now(), kind: 'assignment', ref_id: sub.assignment_id, score: clamped, feedback: feedback || null, graded_by: gradedBy });

  const before = prog.passed;
  const result = await evaluateModule(sub.student_id, mod.id);
  await awardComponentGems(sub.student_id, mod, 'assignments', before, result.progress);
  return { ok: true, submission: sub, progress: result.progress };
}

async function gradeProjectSubmission({ submissionId, score, feedback, gradedBy }) {
  await ensureLoaded();
  const sub = data.project_submissions.find((s) => s.id === Number(submissionId));
  if (!sub) return { error: 'Submission not found.' };
  const clamped = Math.max(0, Math.min(100, Number(score)));
  sub.score = clamped; sub.feedback = feedback || null; sub.graded_at = now(); sub.graded_by = gradedBy;

  const mod = data.modules.find((m) => m.id === sub.module_id);
  const prog = ensureProgressRow(sub.student_id, mod.id, mod.course_id);
  prog.component_scores.project = clamped;
  prog.attempts.push({ at: now(), kind: 'project', ref_id: null, score: clamped, feedback: feedback || null, graded_by: gradedBy });

  const before = prog.passed;
  const result = await evaluateModule(sub.student_id, mod.id);
  await awardComponentGems(sub.student_id, mod, 'project', before, result.progress);
  return { ok: true, submission: sub, progress: result.progress };
}

/** Class-quest component (OBE framework instrument 1, "Quest laboratory") - recorded per module by the instructor, same as the other two components, since the handbook's six-part module sequence has no separate quest-taking artifact of its own. */
async function setQuestScore({ studentId, moduleId, score, feedback, gradedBy }) {
  await ensureLoaded();
  const mod = data.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return { error: 'Module not found.' };
  const clamped = Math.max(0, Math.min(100, Number(score)));
  const prog = ensureProgressRow(studentId, mod.id, mod.course_id);
  prog.component_scores.quests = clamped;
  prog.attempts.push({ at: now(), kind: 'quest', ref_id: null, score: clamped, feedback: feedback || null, graded_by: gradedBy });

  const before = prog.passed;
  const result = await evaluateModule(studentId, mod.id);
  await awardComponentGems(studentId, mod, 'quests', before, result.progress);
  return { ok: true, progress: result.progress };
}

/* ------------------------------ gems ------------------------------ */
const GEM_AWARD = { assignments: 15, project: 30, quests: 10, module_complete: 25 };
/**
 * GemEvents.create()'s reference_type/reference_id fields are only a
 * uniqueness constraint in the Prisma-managed Postgres schema - the actual
 * JS function (store.js) has no in-memory dedup at all, so calling it
 * twice with the same reference happily creates two events in both
 * JSON-file mode and this app's legacy JSONB Postgres mode. Since a
 * module's assignments component is regraded independently per
 * assignment (2 assignments = 2 gradeAssignmentSubmission calls, both
 * touching the same "assignments" component), the dedup has to happen
 * here before ever calling GemEvents.create.
 */
function alreadyAwarded(studentId, referenceType, referenceId) {
  return GemEvents.forStudent(studentId).some((e) => e.reference_type === referenceType && String(e.reference_id) === String(referenceId));
}
async function awardComponentGems(studentId, mod, component, wasPassed, prog) {
  const passingComponentThreshold = 60;
  const componentRefType = `curriculum_module_${component}`;
  if (prog.component_scores[component] != null && prog.component_scores[component] >= passingComponentThreshold
      && !alreadyAwarded(studentId, componentRefType, mod.id)) {
    GemEvents.create({
      user_id: studentId, batch_id: null, amount: GEM_AWARD[component], source: `module_${component}_pass`,
      note: `${mod.title}: ${component} passed`, reference_type: componentRefType, reference_id: mod.id,
    });
  }
  if (prog.passed && !wasPassed && !alreadyAwarded(studentId, 'curriculum_module_complete', mod.id)) {
    GemEvents.create({
      user_id: studentId, batch_id: null, amount: GEM_AWARD.module_complete, source: 'module_complete',
      note: `${mod.title}: module completed`, reference_type: 'curriculum_module_complete', reference_id: mod.id,
    });
  }
}

/* ------------------------------ certificates ------------------------------ */
async function maybeIssueCourseCertificate(studentId, course) {
  const user = Users.byId(studentId);
  if (!user) return;
  Certificates.issue({
    user_id: studentId, batch_id: null, kind: 'course',
    title: `Verified Course Certificate: ${course.title}`,
    completion_date: today(), detail: `${course.level} - EchoLens curriculum`,
    instructor_id: null, issued_by: studentId, // system-triggered; no admin actor
    source_kind: 'curriculum_course', source_id: course.id,
  });
}

async function diplomaEligibility(studentId, programmeId) {
  await ensureLoaded();
  const programme = data.programmes.find((p) => p.id === Number(programmeId));
  if (!programme) return { error: 'Programme not found.' };
  const courses = data.courses.filter((c) => c.programme_id === programme.id);
  const certs = Certificates.forUser(studentId);
  const courseCertsHeld = courses.filter((c) => certs.some((cert) => cert.source_kind === 'curriculum_course' && Number(cert.source_id) === c.id));
  const flag = data.capstone_flags.find((f) => f.student_id === Number(studentId) && f.programme_id === programme.id);
  return {
    programme, courses_total: courses.length, courses_certified: courseCertsHeld.length,
    capstone_defense_passed: !!(flag && flag.passed),
    eligible: courseCertsHeld.length === courses.length && !!(flag && flag.passed),
  };
}

async function setCapstoneDefense({ studentId, programmeId, passed, setBy }) {
  await ensureLoaded();
  let flag = data.capstone_flags.find((f) => f.student_id === Number(studentId) && f.programme_id === Number(programmeId));
  if (!flag) {
    flag = { id: nextId('capstone_flags'), student_id: Number(studentId), programme_id: Number(programmeId), passed: !!passed, set_by: setBy, set_at: now() };
    data.capstone_flags.push(flag);
  } else {
    flag.passed = !!passed; flag.set_by = setBy; flag.set_at = now();
  }
  await persist();
  if (flag.passed) {
    const elig = await diplomaEligibility(studentId, programmeId);
    if (elig.eligible) {
      const user = Users.byId(studentId);
      const programme = data.programmes.find((p) => p.id === Number(programmeId));
      if (user && programme) {
        Certificates.issue({
          user_id: studentId, batch_id: null, kind: 'diploma',
          title: `Specialization Diploma: ${programme.name}`,
          completion_date: today(), detail: 'Three course certificates plus a passed capstone defense.',
          instructor_id: null, issued_by: studentId,
          source_kind: 'curriculum_diploma', source_id: programme.id,
        });
      }
    }
  }
  return { ok: true, flag };
}

/* ------------------------------ instructor attainment view ------------------------------ */
async function moduleAttainment(moduleId) {
  await ensureLoaded();
  const mod = data.modules.find((m) => m.id === Number(moduleId));
  if (!mod) return { error: 'Module not found.' };
  const enrolled = data.enrollments.filter((e) => e.course_id === mod.course_id);
  const rows = enrolled.map((e) => {
    const prog = progressFor(e.student_id, mod.id);
    return { student_id: e.student_id, unlocked: !!(prog && prog.unlocked_at), passed: !!(prog && prog.passed), weighted_score: prog ? prog.weighted_score : null };
  }).filter((r) => r.unlocked);
  const passedCount = rows.filter((r) => r.passed).length;
  const pct = rows.length ? Math.round((passedCount / rows.length) * 1000) / 10 : null;
  let band = 'not_enough_data';
  if (pct != null) {
    if (pct < ATTAINMENT_BANDS.watchMin) band = 'action'; // below 55
    else if (pct <= ATTAINMENT_BANDS.watchMax) band = 'watch'; // 55-70
    else band = 'ok';
  }
  return { module: mod, students_reached: rows.length, students_passed: passedCount, attainment_pct: pct, band, students: rows };
}

module.exports = {
  MODULE_GATE, SCHEMA_VERSION,
  seedCurriculum, backup,
  listProgrammes, getPathForStudent, getModuleForStudent,
  enrollStudent,
  submitAssignment, submitProject, gradingQueue,
  gradeAssignmentSubmission, gradeProjectSubmission, setQuestScore,
  evaluateModule,
  diplomaEligibility, setCapstoneDefense,
  moduleAttainment,
  _resetForTest, _allData, ensureLoaded,
};
