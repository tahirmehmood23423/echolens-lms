'use strict';

/**
 * EchoLens - course pacing rules for the free self-paced tracks.
 *
 * Three rules, all pure functions over a track definition plus the learner's
 * own submissions, so they can be unit-tested and reused by both the API and
 * the catalogue UI without touching the store:
 *
 *  1. HELD GRADES - a grade stays hidden until 12 h after submission. The
 *     grading worker still runs immediately, so the AI provider gets a twelve
 *     hour window (and three retries) to answer inside its free-tier quota.
 *     A learner therefore never watches a grading failure happen: by the time
 *     the result is due, it has been retried long since. This is the whole
 *     point of the hold - see AI_COOLDOWN_MINUTES in ai.js for the other half.
 *
 *  2. SEQUENTIAL MODULES - module N+1 opens only once every required problem
 *     in module N has a RELEASED grade. Released, not merely graded, so the
 *     learner always sees their result before the next module appears; an
 *     unlocked module they cannot explain is worse than a wait.
 *
 *  3. ONE MODULE PER DAY - a learner cannot open a new module within 24 h of
 *     opening the previous one. Rule 2 alone already paces at ~12 h; this
 *     makes the cadence exactly one module per day as the academy intends.
 *     It is a rolling 24 h from their own first submission, not a midnight
 *     reset, so a learner who studies at night is not cut off at 00:00.
 *
 * Rules 2 and 3 gate only the FIRST submission into a module. Once a module is
 * open, every problem inside it can be submitted and resubmitted freely - the
 * pacing is per module, never per problem.
 */

const HOUR_MS = 60 * 60 * 1000;
// Enrolling does not open a course. The seat is confirmed an hour later, and
// only a CONFIRMED enrolment unlocks lesson content or accepts a submission -
// so nobody reaches the material by walking straight into a lesson URL.
const ENROLLMENT_HOLD_MS = Number(process.env.ENROLLMENT_HOLD_HOURS || 1) * HOUR_MS;
const GRADE_HOLD_MS = Number(process.env.GRADE_HOLD_HOURS || 12) * HOUR_MS;
const MODULE_COOLDOWN_MS = Number(process.env.MODULE_COOLDOWN_HOURS || 24) * HOUR_MS;
// Free self-paced courses a learner may study at once. Waitlisted courses that
// have not launched do not count - they cannot be studied yet.
const MAX_ACTIVE_COURSES = Number(process.env.MAX_ACTIVE_FREE_COURSES || 2);

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

/** A grade is visible only once the hold has elapsed. */
function releaseAt(submittedAt) {
  const t = ms(submittedAt);
  return Number.isFinite(t) ? iso(t + GRADE_HOLD_MS) : null;
}
/**
 * The hold exists to buy the AI grader quota headroom, so it applies only to
 * AI-graded assignments. A capstone is reviewed by a human who has already
 * looked at the work - making that learner wait another 12 h serves nobody.
 */
function isHeldKind(submission) {
  return (submission.assessment_kind || 'assignment') === 'assignment' && !(submission.level === 0 && submission.pid === 0);
}
function isReleased(submission, nowMs = Date.now()) {
  if (!submission || submission.score == null) return false;
  if (!isHeldKind(submission)) return true;
  const due = ms(releaseAt(submission.submitted_at));
  return !Number.isFinite(due) || due <= nowMs;
}

/**
 * The learner-facing view of one submission: the grade is stripped out until
 * it is due. Everything else (that it was received, when it lands) is shown,
 * because silence during a 12 h wait reads as a lost submission.
 */
function publicSubmission(submission, nowMs = Date.now()) {
  if (!submission) return submission;
  if (!isHeldKind(submission)) return { ...submission, grade_released: submission.score != null, grade_release_at: null };
  const released = isReleased(submission, nowMs);
  const due = releaseAt(submission.submitted_at);
  if (released || submission.score == null) {
    return { ...submission, grade_released: released, grade_release_at: submission.score == null ? due : null };
  }
  return {
    ...submission,
    score: null, gems: 0, feedback: null, graded_at: null,
    grade_released: false, grade_release_at: due,
    grade_pending: true,
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

/** Every required problem across every level of this module has a released grade. */
function moduleComplete(module_, submissions, nowMs = Date.now()) {
  const pairs = module_.levels.flatMap((l) => requiredProblems(l).map((p) => [l.no, p.pid]));
  if (!pairs.length) return false;
  return pairs.every(([levelNo, pid]) => {
    const s = submissions.find((x) => x.level === levelNo && x.pid === pid && (x.assessment_kind || 'assignment') === 'assignment');
    return isReleased(s, nowMs);
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
  let previousStartedAt = null;

  for (const module_ of modulesOf(track)) {
    const started = moduleStartedAt(module_, submissions);
    const complete = moduleComplete(module_, submissions, nowMs);
    const cooldownUntil = previousStartedAt == null ? null : previousStartedAt + MODULE_COOLDOWN_MS;
    const inCooldown = started == null && cooldownUntil != null && cooldownUntil > nowMs;

    let status, reason = null, unlocks_at = null;
    if (started != null) {
      status = complete ? 'complete' : 'open';
      if (!complete) reason = 'In progress.';
    } else if (!previousComplete) {
      status = 'locked';
      reason = 'Finish the previous module and collect its grade to unlock this one.';
    } else if (inCooldown) {
      status = 'locked';
      unlocks_at = iso(cooldownUntil);
      reason = 'One module opens per day. This module unlocks ' + hoursFrom(cooldownUntil, nowMs) + '.';
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
      status, reason, unlocks_at,
    });
    previousComplete = complete;
    previousStartedAt = started != null ? started : previousStartedAt;
  }
  return out;
}

function hoursFrom(targetMs, nowMs) {
  const mins = Math.max(1, Math.ceil((targetMs - nowMs) / 60000));
  if (mins < 60) return `in about ${mins} minute${mins === 1 ? '' : 's'}`;
  const hours = Math.round(mins / 60);
  return `in about ${hours} hour${hours === 1 ? '' : 's'}`;
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
  GRADE_HOLD_MS, MODULE_COOLDOWN_MS, MAX_ACTIVE_COURSES, ENROLLMENT_HOLD_MS,
  activatesAt, isEnrollmentActive, confirmationNote,
  requiredProblems, releaseAt, isReleased, isHeldKind, publicSubmission,
  moduleComplete, moduleStartedAt, moduleStates, canSubmit, modulesOf, moduleOfLevel, moduleKeyOf,
  activeCourseCount, canEnroll,
};
