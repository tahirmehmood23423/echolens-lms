'use strict';

/**
 * EchoLens - course pacing rules for the free self-paced tracks.
 *
 * All pure functions over a track definition plus the learner's own
 * submissions, so they can be unit-tested and reused by both the API and the
 * catalogue UI without touching the store:
 *
 *  1. ONE MODULE AT A TIME - exactly one module is open. Module N+1 opens the
 *     moment every required problem in module N is GRADED, and nothing else
 *     gates it: no clock, no daily quota. Finish early and you move on early.
 *
 *  2. EIGHT-HOUR GRADING WINDOW - a grade appears as soon as it is awarded,
 *     which may be seconds or may be hours: the AI grader works through the
 *     queue as its free-tier quota allows (8k tokens/minute - see ai.js). The
 *     8 h is a PROMISE, not a delay. It is the deadline the learner is shown
 *     ("your grades arrive within 8 hours") and the span the grading worker
 *     keeps retrying across, so a provider outage is absorbed by retries
 *     rather than surfacing to the learner as a failure.
 *
 *  3. CONFIRMED SEAT - a free course is shut until the enrolment is confirmed,
 *     one hour after enrolling. See isEnrollmentActive below.
 *
 * Rule 1 gates only the FIRST submission into a module. Once a module is open,
 * every problem inside it can be submitted and resubmitted freely - the pacing
 * is per module, never per problem.
 *
 * An earlier revision held every grade for 12 h and capped learners at one
 * module per 24 h. Both are gone: holding a grade that had already been awarded
 * only made the course feel broken, and the daily cap could keep a module shut
 * for hours after its predecessor was marked.
 */

const HOUR_MS = 60 * 60 * 1000;
// Enrolling does not open a course. The seat is confirmed an hour later, and
// only a CONFIRMED enrolment unlocks lesson content or accepts a submission -
// so nobody reaches the material by walking straight into a lesson URL.
const ENROLLMENT_HOLD_MS = Number(process.env.ENROLLMENT_HOLD_HOURS || 1) * HOUR_MS;
// The window the learner is promised and the grading worker retries across.
// Not a delay: a grade shows the moment it is awarded, often long before this.
const GRADING_WINDOW_MS = Number(process.env.GRADING_WINDOW_HOURS || 8) * HOUR_MS;
const GRADING_WINDOW_HOURS = Math.round(GRADING_WINDOW_MS / HOUR_MS);
// Free self-paced courses a learner may study at once. Waitlisted courses that
// have not launched do not count - they cannot be studied yet.
const MAX_ACTIVE_COURSES = 2;

/**
 * store.js's now() renders UTC as 'YYYY-MM-DD HH:mm:ss' (store.js:748) - a bare
 * format Date.parse reads as LOCAL time. Parsing it naively shifts every
 * deadline by the host's UTC offset: on a UTC+5 box the 12 h grade hold became
 * 7 h and the 1 h enrolment hold expired before it began; on UTC-5 the hold
 * would have run 17 h. It only looked right because Render happens to run UTC.
 * Timestamps with an explicit zone (our own iso() output, ISO strings from the
 * API) already parse correctly and are passed through untouched.
 */
const BARE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const ms = (t) => {
  if (!t) return NaN;
  const s = String(t);
  return Date.parse(BARE_TIMESTAMP.test(s) ? s.replace(' ', 'T') + 'Z' : s);
};
const iso = (n) => new Date(n).toISOString();

/* ----------------------- enrolment confirmation window -----------------------
 * An enrolment carries `activates_at`. Until that moment the seat is held but
 * the course is shut: no lesson bodies, no video URLs, no submissions.
 * Enrolments made before this rule existed have no `activates_at` at all and
 * are treated as confirmed - a live learner must never be locked out by a
 * rule that arrived after they started.
 */
function activatesAt(enrolledAt) {
  const t = ms(enrolledAt);
  return Number.isFinite(t) ? iso(t + ENROLLMENT_HOLD_MS) : null;
}
function isEnrollmentActive(enrollment, nowMs = Date.now()) {
  if (!enrollment) return false;
  if (!enrollment.activates_at) return true; // pre-existing enrolment
  const due = ms(enrollment.activates_at);
  return !Number.isFinite(due) || due <= nowMs;
}
/** How the wait reads to the learner, e.g. "in about 40 minutes". */
function confirmationNote(enrollment, nowMs = Date.now()) {
  if (isEnrollmentActive(enrollment, nowMs)) return null;
  const mins = Math.max(1, Math.ceil((ms(enrollment.activates_at) - nowMs) / 60000));
  return mins < 60
    ? `Your seat is confirmed in about ${mins} minute${mins === 1 ? '' : 's'}.`
    : `Your seat is confirmed in about ${Math.round(mins / 60)} hour${Math.round(mins / 60) === 1 ? '' : 's'}.`;
}

/** Problems a learner must pass for the module to count as done. */
function requiredProblems(level) {
  return (level.problems || []).filter((p) => p.required !== false && p.optional !== true);
}

/** When a submission's grade is promised by. Shown while it is still pending. */
function gradeDueBy(submittedAt) {
  const t = ms(submittedAt);
  return Number.isFinite(t) ? iso(t + GRADING_WINDOW_MS) : null;
}
/** Is this submission still inside the window the worker should keep retrying? */
function withinGradingWindow(submittedAt, nowMs = Date.now()) {
  const due = ms(gradeDueBy(submittedAt));
  return !Number.isFinite(due) || due > nowMs;
}
/**
 * Graded means graded. Nothing is withheld: the moment the grader answers, the
 * learner sees the score and the next module opens.
 */
function isGraded(submission) {
  return !!submission && submission.score != null;
}

/**
 * The learner-facing view of one submission. An awarded grade passes straight
 * through; a pending one carries the deadline it is promised by, because
 * silence while waiting reads as a lost submission.
 */
function publicSubmission(submission, nowMs = Date.now()) {
  if (!submission) return submission;
  if (isGraded(submission)) return { ...submission, grade_pending: false, grade_due_by: null };
  return {
    ...submission,
    grade_pending: true,
    grade_due_by: gradeDueBy(submission.submitted_at),
    grade_overdue: !withinGradingWindow(submission.submitted_at, nowMs),
  };
}

/**
 * A track's `levels` are individual topics/sessions; a MODULE is a group of
 * them. The catalogue groups by `module_no` when the track supplies one and by
 * `week` otherwise - FC-01, for instance, is 16 levels across 5 weekly modules.
 * This mirrors drawCourse() in public/js/open.js exactly, because pacing a
 * learner by something other than the module they can see would be incoherent
 * (and would stretch a 5-module course to 16 days).
 */
function moduleKeyOf(level) {
  return level.module_no != null ? `module:${level.module_no}` : `week:${level.week != null ? level.week : level.no}`;
}
function modulesOf(track) {
  const byKey = new Map();
  const out = [];
  for (const level of (track.levels || []).slice().sort((a, b) => a.no - b.no)) {
    const key = moduleKeyOf(level);
    if (!byKey.has(key)) {
      const m = { no: out.length + 1, key, week: level.week != null ? level.week : level.no, title: level.module_title || null, levels: [] };
      byKey.set(key, m);
      out.push(m);
    }
    byKey.get(key).levels.push(level);
  }
  return out;
}
function moduleOfLevel(track, levelNo) {
  return modulesOf(track).find((m) => m.levels.some((l) => l.no === Number(levelNo))) || null;
}

/** Every required problem across every level of this module has been graded. */
function moduleComplete(module_, submissions) {
  const pairs = module_.levels.flatMap((l) => requiredProblems(l).map((p) => [l.no, p.pid]));
  if (!pairs.length) return false;
  return pairs.every(([levelNo, pid]) => {
    const s = submissions.find((x) => x.level === levelNo && x.pid === pid && (x.assessment_kind || 'assignment') === 'assignment');
    return isGraded(s);
  });
}

/** When the learner first submitted anything in this module. */
function moduleStartedAt(module_, submissions) {
  const levelNos = new Set(module_.levels.map((l) => l.no));
  const times = submissions
    .filter((s) => levelNos.has(s.level) && (s.assessment_kind || 'assignment') === 'assignment')
    .map((s) => ms(s.submitted_at))
    .filter(Number.isFinite);
  return times.length ? Math.min(...times) : null;
}

/**
 * Status of every module in a track for one learner. `unlocks_at` is a best
 * estimate the UI can count down to; it is null when the block is waiting on a
 * grade that has not been awarded yet (we cannot know when that lands).
 */
function moduleStates(track, submissions, nowMs = Date.now()) {
  const out = [];
  let previousComplete = true; // module 1 has no predecessor

  for (const module_ of modulesOf(track)) {
    const started = moduleStartedAt(module_, submissions);
    const complete = moduleComplete(module_, submissions);

    // A started-but-unfinished module is either still being worked on or
    // waiting on the grader; the learner needs to be told which, and when the
    // grades are due, since that wait is the only thing between them and the
    // next module.
    const pending = module_.levels.flatMap((l) => requiredProblems(l).map((p) =>
      submissions.find((x) => x.level === l.no && x.pid === p.pid && (x.assessment_kind || 'assignment') === 'assignment')))
      .filter((s) => s && !isGraded(s));
    const dueBy = pending.length
      ? pending.map((s) => gradeDueBy(s.submitted_at)).filter(Boolean).sort().pop()
      : null;

    let status, reason = null, unlocks_at = null, awaiting_grades = 0;
    if (started != null) {
      status = complete ? 'complete' : 'open';
      awaiting_grades = pending.length;
      if (!complete && pending.length) {
        unlocks_at = dueBy;
        reason = `Grading ${pending.length} submission${pending.length > 1 ? 's' : ''} - results arrive within ${GRADING_WINDOW_HOURS} hours, and the next module opens as soon as they do.`;
      } else if (!complete) {
        reason = 'In progress.';
      }
    } else if (!previousComplete) {
      status = 'locked';
      reason = `Opens as soon as the previous module is graded - within ${GRADING_WINDOW_HOURS} hours of your last submission.`;
    } else {
      status = 'available';
    }

    out.push({
      no: module_.no,
      key: module_.key,
      week: module_.week,
      title: module_.title || module_.levels[0]?.title || `Module ${module_.no}`,
      levels: module_.levels.map((l) => l.no),
      required: module_.levels.reduce((a, l) => a + requiredProblems(l).length, 0),
      status, reason, unlocks_at, awaiting_grades,
    });
    previousComplete = complete;
  }
  return out;
}


/**
 * May this learner submit to `level` right now? Returns {ok:true} or an error
 * shaped for the API ({error, status, unlocks_at}). Resubmitting inside a
 * module the learner has already opened is always allowed.
 */
function canSubmit(track, submissions, level, nowMs = Date.now()) {
  const owner = moduleOfLevel(track, level);
  if (!owner) return { ok: false, error: 'Module not found.', status: 404 };
  const state = moduleStates(track, submissions, nowMs).find((m) => m.no === owner.no);
  if (!state) return { ok: false, error: 'Module not found.', status: 404 };
  if (state.status === 'open' || state.status === 'complete' || state.status === 'available') return { ok: true };
  return { ok: false, error: state.reason, status: 409, unlocks_at: state.unlocks_at };
}

/**
 * Free courses a learner is actively studying. A completed course frees its
 * slot; a waitlisted course that has not launched never occupied one.
 */
function activeCourseCount(enrollments) {
  return (enrollments || []).filter((e) => !e.completed && !e.waitlisted).length;
}
function canEnroll(enrollments) {
  const active = activeCourseCount(enrollments);
  if (active < MAX_ACTIVE_COURSES) return { ok: true, active, limit: MAX_ACTIVE_COURSES };
  return {
    ok: false,
    active,
    limit: MAX_ACTIVE_COURSES,
    error: `You can study ${MAX_ACTIVE_COURSES} courses at a time. Finish one of your current courses before enrolling in another.`,
    status: 409,
  };
}

module.exports = {
  GRADING_WINDOW_MS, GRADING_WINDOW_HOURS, MAX_ACTIVE_COURSES, ENROLLMENT_HOLD_MS,
  parseTimestamp: ms,
  activatesAt, isEnrollmentActive, confirmationNote,
  requiredProblems, gradeDueBy, withinGradingWindow, isGraded, publicSubmission,
  moduleComplete, moduleStartedAt, moduleStates, canSubmit, modulesOf, moduleOfLevel, moduleKeyOf,
  activeCourseCount, canEnroll,
};
