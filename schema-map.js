'use strict';

/**
 * EchoLens LMS — shared Prisma <-> store.js column/type mapping
 *
 * Single source of truth for how store.js's JSON-shaped collections map onto
 * schema.prisma's normalized tables: which table+Prisma-model each collection
 * is, which columns are Json vs plain, which are now()-built timestamps vs
 * date-only strings (including the per-table exceptions where the same
 * column name means something different on two different tables), and the
 * camelCase Prisma field name for every snake_case column.
 *
 * Originally lived only in migrations/import-prisma.js (the one-time JSON ->
 * Postgres backfill). Now also used by store.js's live read/write path
 * (initFromPostgres / the Postgres-backed save()), so it needed a home both
 * can require without one depending on the other. Keeping this in one place
 * means the live app and the one-time import can never silently drift apart
 * on what a column means - a fix here (like the joined_at collision or the
 * source_id/graded_by type corrections found earlier) applies to both at
 * once instead of needing to be re-discovered twice.
 */

const { Prisma } = require('@prisma/client');

/* ---------------------------------------------------------------------- */
/* Collection -> [table name, Prisma model accessor, columns[]], in       */
/* FK-safe insertion order. Columns are store.js's own snake_case field   */
/* names (== the Postgres column / schema.prisma @map name); each is      */
/* converted to its camelCase Prisma field name mechanically (see         */
/* toCamel() below) rather than hand-listed, since schema.prisma uses     */
/* camelCase(column) for every single field with no exceptions.           */
/* ---------------------------------------------------------------------- */
const COLLECTIONS = [
  // -- no FK dependencies --
  ['courses', 'courses', 'course', ['id', 'code', 'title', 'tier', 'level', 'weeks', 'hours', 'price_pkr', 'summary', 'created_at', 'badges', 'free_mode']],
  ['companies', 'companies', 'company', ['id', 'domain', 'name', 'website', 'size_band', 'created_at']],
  // users depends on companies (company_id)
  ['users', 'users', 'user', [
    'id', 'name', 'role', 'username', 'email', 'reg_no', 'password_hash', 'profile', 'streak', 'best_streak',
    'last_active', 'created_at', 'onboarding_complete', 'avatar', 'signature', 'google_sub', 'is_deleted_placeholder',
    'company_id', 'designation', 'city', 'hiring_note', 'status', 'status_reason', 'override_requested', 'override_reason',
    'approved_by', 'approved_at',
  ]],
  // batches depends on courses
  ['batches', 'batches', 'batch', ['id', 'course_id', 'code', 'name', 'start_date', 'status', 'instructor_ids', 'created_at', 'is_deleted_placeholder']],
  ['enrollments', 'enrollments', 'enrollment', ['id', 'user_id', 'batch_id', 'created_at']],
  ['sessions', 'sessions', 'session', ['id', 'batch_id', 'week_no', 'title', 'session_date', 'start_time', 'end_time', 'room', 'started_at', 'ended_at', 'started_by', 'created_at']],
  ['live_classes', 'live_classes', 'liveClass', ['id', 'batch_id', 'title', 'room', 'started_by', 'started_at', 'ended_at', 'date']],
  ['quests', 'quests', 'quest', ['id', 'batch_id', 'track_key', 'no', 'week', 'session', 'title', 'topic', 'problems', 'created_at', 'deadline']],
  ['quest_submissions', 'quest_submissions', 'questSubmission', [
    'id', 'quest_id', 'pid', 'user_id', 'file_url', 'note', 'grade', 'gems', 'remarks', 'submitted_at', 'graded_at',
    'graded_by', 'code', 'language', 'ai_review', 'review_shared', 'review_shared_at', 'late', 'integrity', 'late_deduction',
  ]],
  ['open_submissions', 'open_submissions', 'openSubmission', [
    'id', 'user_id', 'track_key', 'level', 'pid', 'problem_title', 'points', 'code', 'language', 'file_url', 'file_name',
    'submitted_at', 'score', 'gems', 'feedback', 'graded_at', 'attempts', 'files',
  ]],
  ['task_files', 'task_files', 'taskFile', ['id', 'quest_id', 'pid', 'name', 'url', 'size', 'by', 'created_at']],
  ['gem_events', 'gem_events', 'gemEvent', ['id', 'user_id', 'batch_id', 'amount', 'source', 'note', 'by', 'at', 'reference_type', 'reference_id']],
  ['certificates', 'certificates', 'certificate', [
    'id', 'serial', 'user_id', 'student_name', 'reg_no', 'batch_id', 'kind', 'title', 'detail', 'completion_date',
    'instructor_name', 'instructor_sig', 'issued_by', 'issued_at', 'concepts', 'final_project', 'source_kind', 'source_id',
  ]],
  ['attendance', 'attendance', 'attendance', ['id', 'session_id', 'class_id', 'user_id', 'joined_at', 'minutes', 'last_seen']],
  ['course_messages', 'course_messages', 'courseMessage', ['id', 'batch_id', 'user_id', 'body', 'anonymous', 'staff_role', 'created_at', 'mentions']],
  ['chat_reads', 'chat_reads', 'chatRead', ['id', 'user_id', 'batch_id', 'last_read_at']],
  ['announcements', 'announcements', 'announcement', ['id', 'batch_id', 'author_id', 'title', 'body', 'created_at']],
  ['public_announcements', 'public_announcements', 'publicAnnouncement', ['id', 'kind', 'title', 'body', 'link', 'link_label', 'pinned', 'created_by', 'created_at']],
  ['ai_reports', 'ai_reports', 'aiReport', ['id', 'user_id', 'batch_id', 'scope', 'markdown', 'status', 'created_at', 'published_at', 'by']],
  ['events', 'events', 'event', [
    'id', 'kind', 'title', 'description', 'scope', 'entry', 'fee_pkr', 'pay_instructions', 'starts_at', 'ends_at',
    'deadline', 'duration_minutes', 'pass_mark', 'auto_grade', 'auto_certificate', 'compiler', 'dataset_url', 'files',
    'problems', 'prizes', 'meeting_link', 'open', 'created_by', 'created_at',
  ]],
  ['event_entries', 'event_entries', 'eventEntry', ['id', 'event_id', 'user_id', 'name', 'reg_no', 'tier', 'payment_status', 'payment_shot', 'registered_at']],
  ['event_submissions', 'event_submissions', 'eventSubmission', [
    'id', 'event_id', 'entry_id', 'user_id', 'pid', 'code', 'language', 'file_url', 'file_name', 'link', 'note',
    'submitted_at', 'ai_score', 'score', 'ai_feedback', 'graded_by', 'graded_at', 'certified',
  ]],
  ['event_comments', 'event_comments', 'eventComment', ['id', 'event_id', 'user_id', 'name', 'role', 'body', 'created_at']],
  ['leads', 'leads', 'lead', ['id', 'name', 'email', 'whatsapp', 'source', 'user_id', 'created_at', 'updated_at']],
  ['discount_categories', 'discount_categories', 'discountCategory', ['id', 'name', 'type', 'value', 'active', 'created_by', 'created_at']],
  ['registrations', 'registrations', 'registration', [
    'id', 'name', 'email', 'whatsapp', 'city', 'course_code', 'course_title', 'note', 'status', 'admin_note',
    'created_at', 'updated_at', 'payment_stage', 'discount_category_id', 'challan_serial', 'enrolled_user_id',
    'enrolled_batch_id', 'cleared_by', 'cleared_at', 'ambassador_code', 'ambassador_name',
  ]],
  ['challans', 'challans', 'challan', [
    'id', 'serial', 'registration_id', 'course_code', 'course_title', 'student_name', 'student_email', 'student_id',
    'gross_fee', 'fee_parts', 'discount_category_id', 'discounts', 'discount_label', 'discount_amount', 'net_fee',
    'deadline', 'bank_snapshot', 'status', 'generated_by', 'generated_at', 'sent_at', 'paid_confirmed_by', 'paid_confirmed_at',
  ]],
  ['expenses', 'expenses', 'expense', ['id', 'date', 'category', 'description', 'amount', 'added_by', 'created_at']],
  ['staff_groups', 'staff_groups', 'staffGroup', ['id', 'name', 'description', 'created_at']],
  ['staff_records', 'staff_records', 'staffRecord', ['id', 'user_id', 'name', 'email', 'phone', 'position', 'employment_type', 'group_id', 'status', 'joined_at', 'instructions', 'follow_ups', 'created_at']],
  ['departments', 'departments', 'department', ['id', 'name', 'head_user_id', 'created_by', 'created_at']],
  ['department_members', 'department_members', 'departmentMember', ['id', 'department_id', 'user_id', 'added_by', 'added_at']],
  ['department_tasks', 'department_tasks', 'departmentTask', ['id', 'department_id', 'title', 'description', 'scope', 'attachment', 'created_by', 'created_at']],
  ['department_task_status', 'department_task_status', 'departmentTaskStatus', ['id', 'task_id', 'user_id', 'status', 'note', 'proof_attachment', 'completed_at']],
  ['department_announcements', 'department_announcements', 'departmentAnnouncement', ['id', 'department_id', 'title', 'body', 'created_by', 'created_at']],
  ['coordinator_queries', 'coordinator_queries', 'coordinatorQuery', ['id', 'student_id', 'student_name', 'subject', 'messages', 'status', 'created_at', 'updated_at']],
  ['contracts', 'contracts', 'contract', [
    'id', 'user_id', 'role', 'status', 'pdf_filename', 'sent_at', 'deadline_at', 'submitted_at',
    'submission_zip_filename', 'offer_letter_filename', 'offer_letter_sent_at',
  ]],
  ['ambassadors', 'ambassadors', 'ambassador', ['id', 'user_id', 'name', 'email', 'code', 'university', 'active', 'gems', 'created_by', 'created_at']],
  ['ambassador_gem_events', 'ambassador_gem_events', 'ambassadorGemEvent', ['id', 'ambassador_id', 'amount', 'source', 'course_tier', 'registration_id', 'batch_id', 'note', 'created_at']],
  ['ambassador_duties', 'ambassador_duties', 'ambassadorDuty', ['id', 'ambassador_id', 'title', 'detail', 'due_at', 'created_by', 'created_at']],
  ['ambassador_duty_status', 'ambassador_duty_status', 'ambassadorDutyStatus', ['id', 'duty_id', 'status', 'note', 'updated_at']],
  ['ambassador_reports', 'ambassador_reports', 'ambassadorReport', ['id', 'ambassador_id', 'period', 'filename', 'student_count', 'total_paid', 'total_commission', 'generated_at']],
  ['jobs', 'jobs', 'job', ['id', 'title', 'company', 'location', 'job_type', 'experience_level', 'salary_range', 'description', 'requirements', 'apply_url', 'apply_email', 'deadline', 'status', 'posted_by', 'created_at']],
  ['job_comments', 'job_comments', 'jobComment', ['id', 'job_id', 'user_id', 'user_name', 'user_role', 'user_avatar', 'body', 'created_at']],
  ['lessons', 'lessons', 'lesson', ['id', 'course_id', 'batch_id', 'week_no', 'title', 'type', 'url', 'position', 'created_at']],
  ['assignments', 'assignments', 'assignment', ['id', 'batch_id', 'title', 'description', 'due_date', 'points', 'created_by', 'created_at']],
  ['submissions', 'submissions', 'submission', ['id', 'assignment_id', 'user_id', 'file_url', 'note', 'grade', 'gems', 'remarks', 'submitted_at', 'graded_at', 'graded_by']],
  ['challenges', 'challenges', 'challenge', ['id', 'title', 'description', 'difficulty', 'gems', 'due_date', 'open', 'created_by', 'created_at']],
  ['challenge_submissions', 'challenge_submissions', 'challengeSubmission', ['id', 'challenge_id', 'user_id', 'link', 'note', 'status', 'remarks', 'submitted_at', 'reviewed_at', 'reviewed_by']],
  ['hackathons', 'hackathons', 'hackathon', ['id', 'title', 'theme', 'starts_at', 'ends_at', 'mode', 'team_max', 'entry', 'fee_pkr', 'pay_instructions', 'prizes', 'finalized', 'created_by', 'created_at']],
  ['hackathon_entries', 'hackathon_entries', 'hackathonEntry', ['id', 'hackathon_id', 'team_name', 'member_ids', 'registered_by', 'payment_status', 'payment_ref', 'payment_by', 'registered_at']],
  ['hackathon_submissions', 'hackathon_submissions', 'hackathonSubmission', ['id', 'hackathon_id', 'entry_id', 'link', 'note', 'score', 'remarks', 'judged_by', 'judged_at', 'submitted_at']],
  ['quizzes', 'quizzes', 'quiz', ['id', 'batch_id', 'title', 'questions', 'duration_min', 'points', 'allow_ide', 'opened_at', 'closes_at', 'created_by', 'created_at']],
  ['quiz_attempts', 'quiz_attempts', 'quizAttempt', ['id', 'quiz_id', 'user_id', 'answers', 'correct', 'total', 'score_pct', 'gems', 'taken_at']],
  // showcase_posts depends on users/quest_submissions/courses/batches (all
  // far earlier above); showcase_images/likes/comments depend on
  // showcase_posts + users; showcase_reports depends only on users.
  ['showcase_posts', 'showcase_posts', 'showcasePost', [
    'id', 'author_user_id', 'caption', 'quest_submission_id', 'course_id', 'batch_id', 'visibility', 'status',
    'like_count', 'comment_count', 'created_at', 'updated_at', 'removed_at', 'removed_by_user_id', 'removal_reason',
  ]],
  ['showcase_images', 'showcase_images', 'showcaseImage', ['id', 'post_id', 'r2_key', 'thumb_key', 'width', 'height', 'byte_size', 'sort_order']],
  ['showcase_likes', 'showcase_likes', 'showcaseLike', ['id', 'post_id', 'user_id', 'created_at']],
  ['showcase_comments', 'showcase_comments', 'showcaseComment', ['id', 'post_id', 'author_user_id', 'body', 'status', 'created_at', 'removed_at', 'removed_by_user_id']],
  ['showcase_reports', 'showcase_reports', 'showcaseReport', ['id', 'target_type', 'target_id', 'reporter_user_id', 'reason', 'status', 'resolved_by_user_id', 'resolved_at', 'created_at']],
  ['audit_log', 'audit_log', 'auditLog', ['id', 'actor_id', 'action', 'target_type', 'target_id', 'detail', 'at']],
];
const FRONT_LOADED_KEYS = new Set(['courses', 'companies', 'users', 'batches']); // inserted by hand before the main loop, for tombstone ordering

// JSON columns (schema.prisma `Json`/`Json?` fields) — passed through as-is
// to Prisma (it serializes objects/arrays itself; no JSON.stringify here).
// Keyed per-table, not globally: the same column name is nullable on one
// table and required on another (e.g. `files` is Json? on open_submissions
// but Json @default("[]") on events; `detail` is Json? on audit_log but a
// plain String on certificates) — a global set got this wrong. The boolean
// is whether the column is NULLABLE: a null source value becomes
// Prisma.DbNull (real SQL NULL) when nullable, or Prisma.JsonNull (the JSON
// literal null, since NOT NULL forbids a real SQL NULL) when required -
// Prisma rejects a plain JS `null` for any Json field outright.
const JSON_COLUMNS_BY_TABLE = {
  users: { profile: false },
  courses: { badges: true },
  batches: { instructor_ids: false },
  quests: { problems: false },
  quest_submissions: { ai_review: true, integrity: true },
  open_submissions: { files: true },
  certificates: { concepts: false },
  course_messages: { mentions: false },
  events: { files: false, problems: false, prizes: false },
  registrations: { status: false },
  challans: { fee_parts: false, discounts: false, bank_snapshot: false },
  staff_records: { instructions: false, follow_ups: false },
  department_tasks: { attachment: true },
  department_task_status: { proof_attachment: true },
  coordinator_queries: { messages: false },
  hackathons: { prizes: false },
  hackathon_entries: { member_ids: false },
  quizzes: { questions: false },
  quiz_attempts: { answers: false },
  audit_log: { detail: true },
};

// now()-style full-timestamp columns ("YYYY-MM-DD HH:MM:SS" -> DateTime).
// Columns not in this set that still look like dates (deadline, due_date,
// start_date, session_date, starts_at/ends_at on hackathons) are left as
// plain strings, matching their String columns in schema.prisma. Verified
// against schema.prisma + store.js by a full cross-check of every column
// touched here against every column's declared type (2026-07-26) - caught
// staff_records.joined_at (below) and added offer_letter_sent_at, which was
// simply missing from this list despite being a real now() column
// (Contracts.markOfferLetterSent, store.js:2253).
const TIMESTAMP_COLUMNS = new Set([
  'created_at', 'updated_at', 'last_active', 'submitted_at', 'graded_at', 'review_shared_at', 'at', 'issued_at',
  'joined_at', 'last_seen', 'last_read_at', 'registered_at', 'added_at', 'started_at', 'ended_at', 'generated_at',
  'sent_at', 'paid_confirmed_at', 'cleared_at', 'completed_at', 'approved_at', 'published_at', 'taken_at',
  'judged_at', 'reviewed_at', 'opened_at', 'closes_at', 'offer_letter_sent_at',
  // showcase_posts.removed_at, showcase_comments.removed_at, showcase_reports.resolved_at
  'removed_at', 'resolved_at',
]);
// Column-name collisions: the same JSON key means something different on a
// different table. `joined_at` is a real now()-built timestamp on
// Attendance (store.js:1786) but a date-only today()-built string on
// StaffRecord (store.js:3321, StaffRecord.joinedAt is declared String, not
// DateTime) - TIMESTAMP_COLUMNS can't represent "convert on this table,
// not that one" on its own, so carve the exception out here instead.
const TIMESTAMP_COLUMN_EXCLUSIONS_BY_TABLE = { staff_records: new Set(['joined_at']) };
// Event.starts_at/ends_at are a raw "YYYY-MM-DDTHH:MM" datetime-local string
// (no seconds/offset) straight from the browser's <input type="datetime-local">
// — store.js never attached a timezone to it, so there is no wall-clock
// convention already established elsewhere in the app to match. EchoLens is
// a Pakistan-based platform (PKR pricing, Lahore-based admin/ops), so both
// directions here treat that wall-clock string as Pakistan Standard Time
// (UTC+05:00, no DST) rather than the host machine's own timezone, which
// would silently vary the result by where the process happens to run.
const LOCAL_DATETIME_COLUMNS_BY_TABLE = { events: new Set(['starts_at', 'ends_at']) };
const LOCAL_DATETIME_OFFSET_MINUTES = 5 * 60;

// users.last_active: a DateTime column in Postgres (schema.prisma), but
// every JS reader/writer treats it as a plain "YYYY-MM-DD" calendar-day
// string, not a real timestamp - touchActivity's once-per-day gate
// (store.js) does `u.last_active === today()`, and the risk report/profile
// code does `new Date(u.last_active + 'T00:00:00')`, both of which only
// make sense against a bare date string. Found 2026-07-28 (load test v21):
// because this column was in TIMESTAMP_COLUMNS, dateToNowString() below was
// reading it back from Postgres as "YYYY-MM-DD HH:MM:SS" (always
// "...00:00:00" in practice, since it's only ever written as a bare date -
// see isoFromNowString's UTC-midnight parse below) - so `=== today()` could
// never match, touchActivity's gate silently never fired once a snapshot
// had round-tripped through Postgres, and every authenticated request from
// a student/free user rewrote the row and entered the flush queue. This
// column gets its own date-only conversion instead, checked before the
// general isTimestampColumn() case.
const DATE_ONLY_COLUMNS_BY_TABLE = { users: new Set(['last_active']) };
function isDateOnlyColumn(table, col) {
  const cols = DATE_ONLY_COLUMNS_BY_TABLE[table];
  return !!(cols && cols.has(col));
}

// Columns where store.js's in-memory JS value is genuinely one of two
// incompatible types (found via live-code read-throughs, not just data
// audits - the historical data never happened to exercise either path).
// store.js's in-memory shape is deliberately left untouched for both - the
// JS value stays exactly as it always was (the literal string 'ai', or a
// String track-key slug); only the Postgres write/read boundary here knows
// the DB schema splits each into two real columns instead of one loosely
// typed one. Not folded into JSON_COLUMNS_BY_TABLE/toCamel-driven mapping
// since each entry maps ONE JS column onto TWO Postgres columns.
const POLYMORPHIC_COLUMNS_BY_TABLE = {
  // event_submissions.graded_by (Int?): a real admin user id, OR the
  // literal string 'ai' for AI-graded submissions (store.js:2663) - 'ai'
  // goes to graded_by_ai instead, since it can never fit an Int column.
  event_submissions: { graded_by: { companionColumn: 'graded_by_ai', sentinel: 'ai' } },
  // certificates.source_id (Int?): a real event id, OR a String track-key
  // slug like "bc01-python" for free-track auto-certs
  // (OpenQuest.maybeCertify, store.js:3080) - the string form goes to
  // source_track_key instead.
  certificates: { source_id: { companionColumn: 'source_track_key' } },
};
function polymorphicColumnInfo(table, col) {
  const cols = POLYMORPHIC_COLUMNS_BY_TABLE[table];
  return cols && cols[col];
}

function toCamel(col) { return col.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase()); }

function isTimestampColumn(table, col) {
  const excluded = TIMESTAMP_COLUMN_EXCLUSIONS_BY_TABLE[table] && TIMESTAMP_COLUMN_EXCLUSIONS_BY_TABLE[table].has(col);
  return TIMESTAMP_COLUMNS.has(col) && !excluded;
}
function isLocalDatetimeColumn(table, col) {
  const cols = LOCAL_DATETIME_COLUMNS_BY_TABLE[table];
  return !!(cols && cols.has(col));
}
/** Returns { nullable } if `col` is a Json column on `table`, else undefined. */
function jsonColumnInfo(table, col) {
  const cols = JSON_COLUMNS_BY_TABLE[table];
  if (!cols || !(col in cols)) return undefined;
  return { nullable: cols[col] };
}

/* -------------------------- JS -> Postgres (write) ------------------------ */

function isoFromNowString(s) {
  // now(): "2026-07-21 14:30:00" -> treat as a UTC instant.
  return new Date(String(s).replace(' ', 'T') + 'Z');
}
function dateOnlyStringToDate(s) {
  // today(): "2026-07-21" is already valid ISO 8601 (date-only) - the native
  // Date constructor parses this as UTC midnight on its own, no reformatting needed.
  return new Date(String(s));
}
function localDatetimeStringToDate(s) {
  // raw is "YYYY-MM-DDTHH:MM" with no seconds/offset - append both explicitly
  // rather than trust system-local parsing (see LOCAL_DATETIME_OFFSET_MINUTES above).
  const offset = LOCAL_DATETIME_OFFSET_MINUTES >= 0
    ? `+${String(Math.floor(LOCAL_DATETIME_OFFSET_MINUTES / 60)).padStart(2, '0')}:${String(LOCAL_DATETIME_OFFSET_MINUTES % 60).padStart(2, '0')}`
    : '-00:00';
  return new Date(`${s}:00${offset}`);
}
function assertValidDate(d, ctx) {
  if (!d || Number.isNaN(d.getTime())) {
    throw new Error(`Unparseable date while converting ${ctx} - refusing to write a value that would silently become "Invalid Date".`);
  }
  return d;
}

/**
 * Converts one store.js JS record (snake_case fields, now()/today()-style
 * date strings, plain JS values for Json columns) into the shape Prisma's
 * create()/update() expect (camelCase fields, real Date objects,
 * Prisma.DbNull/JsonNull where a plain `null` would be ambiguous for a Json
 * column). Shared by migrations/import-prisma.js (bulk historical import)
 * and store.js's live write engine (schema-map.js's own callers) - both
 * need the exact same column/type rules, and duplicating them is how the
 * staff_records.joined_at and offer_letter_sent_at bugs happened in the
 * first place.
 *
 * `undefined` on `rec[col]` (the key is genuinely absent) is skipped
 * entirely rather than passed through - for a create() that lets Prisma
 * apply the schema default; for an update() it means "don't touch this
 * column", which matches every real call site (store.js's write methods
 * only ever set a field to a new value or leave it alone, never delete a
 * property to "unset" it).
 */
function buildPrismaRow(table, columns, rec, context) {
  const row = {};
  for (const col of columns) {
    const raw = rec[col];
    if (raw === undefined) continue;
    const field = toCamel(col);
    const poly = polymorphicColumnInfo(table, col);
    const jsonInfo = jsonColumnInfo(table, col);
    if (poly) {
      const companionField = toCamel(poly.companionColumn);
      if (raw === null) {
        row[field] = null;
        if (poly.sentinel) row[companionField] = false;
      } else if (poly.sentinel && raw === poly.sentinel) {
        row[field] = null;
        row[companionField] = true;
      } else if (typeof raw === 'string') {
        // Non-sentinel string (e.g. a track-key slug) - goes to the string companion column.
        row[field] = null;
        row[companionField] = raw;
      } else {
        row[field] = raw;
        if (poly.sentinel) row[companionField] = false;
      }
    } else if (jsonInfo) {
      row[field] = raw === null ? (jsonInfo.nullable ? Prisma.DbNull : Prisma.JsonNull) : raw;
    } else if (isLocalDatetimeColumn(table, col)) {
      row[field] = raw == null ? null : assertValidDate(localDatetimeStringToDate(raw), `${context}.${col}="${raw}"`);
    } else if (isDateOnlyColumn(table, col) && raw != null) {
      row[field] = assertValidDate(dateOnlyStringToDate(raw), `${context}.${col}="${raw}"`);
    } else if (isTimestampColumn(table, col) && raw != null) {
      row[field] = assertValidDate(isoFromNowString(raw), `${context}.${col}="${raw}"`);
    } else {
      row[field] = raw;
    }
  }
  return row;
}

/* -------------------------- Postgres -> JS (read) ------------------------- */

/** Inverse of isoFromNowString: a DateTime read back from Postgres -> store.js's "YYYY-MM-DD HH:MM:SS" now()-format string. */
function dateToNowString(d) {
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
/** Inverse of dateOnlyStringToDate: a DateTime read back from Postgres -> store.js's "YYYY-MM-DD" today()-format string - NOT dateToNowString(), whose trailing time-of-day is exactly what broke touchActivity's `=== today()` gate (see DATE_ONLY_COLUMNS_BY_TABLE above). */
function dateToDateOnlyString(d) {
  return d.toISOString().slice(0, 10);
}
/** Inverse of localDatetimeStringToDate: a DateTime read back from Postgres -> "YYYY-MM-DDTHH:MM" in Pakistan time, matching what the browser's <input type="datetime-local"> originally sent. */
function dateToLocalDatetimeString(d) {
  const shifted = new Date(d.getTime() + LOCAL_DATETIME_OFFSET_MINUTES * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}`;
}

/**
 * Converts one row as returned by Prisma (camelCase fields, real Date
 * objects, Json columns already deserialized) back into the snake_case,
 * string-dated shape store.js's `data.<collection>` entries have always
 * used - i.e. the exact inverse of migrations/import-prisma.js's buildRow().
 * A DB NULL and a stored JSON-literal null both come back from Prisma as JS
 * `null`, which is exactly what a `null` in the original JSON file meant
 * too, so no DbNull/JsonNull distinction is needed on this side.
 */
function rowFromPrisma(table, columns, prismaRow) {
  const row = {};
  for (const col of columns) {
    const field = toCamel(col);
    const poly = polymorphicColumnInfo(table, col);
    if (poly) {
      const companionValue = prismaRow[toCamel(poly.companionColumn)];
      if (poly.sentinel && companionValue === true) row[col] = poly.sentinel;
      else if (!poly.sentinel && companionValue != null) row[col] = companionValue;
      else row[col] = prismaRow[field];
      continue;
    }
    const value = prismaRow[field];
    if (value == null) {
      row[col] = null;
    } else if (isLocalDatetimeColumn(table, col)) {
      row[col] = dateToLocalDatetimeString(value);
    } else if (isDateOnlyColumn(table, col)) {
      row[col] = dateToDateOnlyString(value);
    } else if (isTimestampColumn(table, col)) {
      row[col] = dateToNowString(value);
    } else {
      row[col] = value;
    }
  }
  return row;
}

module.exports = {
  COLLECTIONS, FRONT_LOADED_KEYS,
  JSON_COLUMNS_BY_TABLE, TIMESTAMP_COLUMNS, TIMESTAMP_COLUMN_EXCLUSIONS_BY_TABLE,
  LOCAL_DATETIME_COLUMNS_BY_TABLE, LOCAL_DATETIME_OFFSET_MINUTES, POLYMORPHIC_COLUMNS_BY_TABLE,
  DATE_ONLY_COLUMNS_BY_TABLE, isDateOnlyColumn, dateOnlyStringToDate, dateToDateOnlyString,
  toCamel, isTimestampColumn, isLocalDatetimeColumn, jsonColumnInfo, polymorphicColumnInfo,
  isoFromNowString, localDatetimeStringToDate, assertValidDate, buildPrismaRow,
  dateToNowString, dateToLocalDatetimeString, rowFromPrisma,
  Prisma,
};
