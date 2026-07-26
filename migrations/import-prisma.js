'use strict';

// Pin the process timezone to UTC before any Date math runs. The `pg`
// driver formats a JS Date's wall-clock string using the PROCESS's local
// timezone when writing a "timestamp without time zone" column (what every
// DateTime field here maps to) — left unset, the now()-based UTC instants
// this script builds (see isoFromNowString below) would land on a
// different wall-clock value depending on what timezone the machine
// running this script happens to be in. Setting this explicitly makes the
// import byte-for-byte reproducible whether it runs on Render (UTC by
// default), a dev laptop in another timezone, or anywhere else.
process.env.TZ = 'UTC';

/**
 * EchoLens LMS — one-time JSON → Postgres import (via Prisma Client)
 *
 * Copies every record in the JSON file store (echolens.json) into the real,
 * normalized Postgres database Prisma now owns (schema.prisma / the 57
 * tables created by `prisma migrate deploy`). This is the PRODUCTION import
 * — unlike migrations/import-normalized.js (a design-validation script that
 * refuses to touch anything but a throwaway staging database), this script
 * is meant to be run exactly once, for real, against DATABASE_URL.
 *
 * MUST RUN ON RENDER: Supabase is only reachable from Render's network, not
 * from a local dev machine, so this reads DATABASE_URL from the environment
 * (same variable the app itself uses) rather than taking a connection string
 * on the command line. Run it as a Render one-off Job — see the usage note
 * at the bottom of this file / the operator's runbook.
 *
 * TOMBSTONES
 *   Some rows reference a user or batch that was later deleted (e.g. a
 *   certificate whose user_id no longer has a matching users row). Postgres
 *   rejects the import outright once a foreign key points at nothing, so
 *   before any dependent table is populated, this script:
 *     1. Walks every FK-bearing field listed in FK_SCANS below across every
 *        collection in the JSON file.
 *     2. Collects every referenced id that ISN'T present in json.users /
 *        json.batches.
 *     3. Inserts one placeholder row per missing id, with
 *        is_deleted_placeholder = true and otherwise-minimal values.
 *   This is computed dynamically (not hardcoded to specific ids) so it does
 *   the right thing regardless of exactly which ids are missing in the real
 *   backup — for the known-good backup this produces tombstones for users
 *   5, 8, 21, 25, 27, 30, 31, 42 and batch 1, matching what a certificate
 *   (user 5), 13 graded_by references (user 8), and 12 quest rows (batch 1)
 *   actually need.
 *
 * ORDER
 *   Collections are inserted in FK-safe order (see COLLECTIONS below):
 *   courses/companies -> tombstones -> users -> batches -> enrollments ->
 *   quests -> submissions -> gems -> certificates -> everything else.
 *   Every table is inserted only after every table it references.
 *
 * IDS
 *   Every row keeps its original integer id (certificates and file paths
 *   reference these). Nothing is auto-generated. Sequences are reset with
 *   setval() after the import so the NEXT auto-generated id starts above
 *   whatever was imported.
 *
 * DATES
 *   now()-produced fields ("YYYY-MM-DD HH:MM:SS", a UTC instant with no
 *   offset marker) are converted to real Date objects by treating them as
 *   UTC. today()/date-only fields ("YYYY-MM-DD") and other free-text date
 *   strings (deadlines, due dates) are left as plain strings, matching their
 *   String columns in schema.prisma. Two Event fields (starts_at/ends_at)
 *   are a raw <input type="datetime-local"> string with no offset marker;
 *   since no timezone convention for it exists elsewhere in the app, this
 *   import explicitly treats it as Pakistan Standard Time, UTC+05:00 (see
 *   LOCAL_DATETIME_OFFSET below) rather than the host machine's own
 *   timezone, which would silently vary the result by where this script
 *   happens to run.
 *
 * IDEMPOTENCY
 *   Every insert uses Prisma's `skipDuplicates: true`, which compiles to
 *   `ON CONFLICT (id) DO NOTHING` — re-running this script (e.g. after a
 *   partial failure, or after wiping and re-migrating the database) skips
 *   whatever's already there instead of erroring or duplicating. The
 *   registries (seq/settings) use upsert so a re-run refreshes them to
 *   match the JSON file rather than silently keeping stale values.
 *
 * FAILS LOUDLY ON
 *   - An unrecognized top-level key in the JSON file with real data in it
 *     (a collection this script doesn't know about yet).
 *   - A duplicate id within a single source collection.
 *   - A date string that doesn't parse (surfaced before it becomes a
 *     silently-wrong "Invalid Date" row).
 *   - A row-count mismatch between the JSON file and Postgres after import.
 *   - Any Postgres constraint violation (foreign key, unique, not-null) —
 *     these are never caught/skipped, they abort the whole transaction.
 *
 * USAGE (as a Render one-off Job; DATABASE_URL is already set in the
 * service's environment, so nothing extra needs passing):
 *   node migrations/import-prisma.js
 *
 * Optional: --db-path=/path/to/echolens.json (defaults to DB_PATH env var,
 * then ./echolens.json next to this repo — same convention as store.js).
 */

const fs = require('fs');
const path = require('path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient, Prisma } = require('@prisma/client');

const dbPathArg = process.argv.find((a) => a.startsWith('--db-path='));
const DB_PATH = dbPathArg ? dbPathArg.slice('--db-path='.length) : (process.env.DB_PATH || path.join(__dirname, '..', 'echolens.json'));
const DATABASE_URL = process.env.DATABASE_URL;
const ANCHOR_COURSE_ID = -1; // placeholder course tombstone batches point at; chosen not to collide with any real course id

function log(msg) { console.log(`[import-prisma] ${msg}`); }

if (!DATABASE_URL) {
  console.error('[import-prisma] DATABASE_URL is not set. This script must run where the app runs (e.g. a Render one-off Job) so it can read the same DATABASE_URL the service uses.');
  process.exit(1);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`[import-prisma] No JSON store found at ${DB_PATH} (pass --db-path=... or set DB_PATH).`);
  process.exit(1);
}

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
  ['gem_events', 'gem_events', 'gemEvent', ['id', 'user_id', 'batch_id', 'amount', 'source', 'note', 'by', 'at']],
  ['certificates', 'certificates', 'certificate', [
    'id', 'serial', 'user_id', 'student_name', 'reg_no', 'batch_id', 'kind', 'title', 'detail', 'completion_date',
    'instructor_name', 'instructor_sig', 'issued_by', 'issued_at', 'concepts', 'final_project', 'source_kind', 'source_id',
  ]],
  ['attendance', 'attendance', 'attendance', ['id', 'session_id', 'user_id', 'joined_at', 'minutes', 'last_seen']],
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
// plain strings, matching their String columns in schema.prisma.
const TIMESTAMP_COLUMNS = new Set([
  'created_at', 'updated_at', 'last_active', 'submitted_at', 'graded_at', 'review_shared_at', 'at', 'issued_at',
  'joined_at', 'last_seen', 'last_read_at', 'registered_at', 'added_at', 'started_at', 'ended_at', 'generated_at',
  'sent_at', 'paid_confirmed_at', 'cleared_at', 'completed_at', 'approved_at', 'published_at', 'taken_at',
  'judged_at', 'reviewed_at', 'opened_at', 'closes_at',
]);
// Event.starts_at/ends_at are a raw "YYYY-MM-DDTHH:MM" datetime-local string
// (no seconds/offset) straight from the browser's <input type="datetime-local">
// — store.js never attached a timezone to it (schema.prisma's header confirms
// this was "no reformatting"), so there is no wall-clock convention already
// established elsewhere in the app to match. EchoLens is a Pakistan-based
// platform (PKR pricing, Lahore-based admin/ops), so this import explicitly
// treats that wall-clock string as Pakistan Standard Time (UTC+05:00, no DST)
// rather than relying on new Date()'s system-local-timezone parsing, which
// would silently pick up whatever timezone the machine running this script
// happens to be in (UTC on Render) and shift the stored instant by 5 hours.
const LOCAL_DATETIME_COLUMNS_BY_TABLE = { events: new Set(['starts_at', 'ends_at']) };
const LOCAL_DATETIME_OFFSET = '+05:00';

/* ---------------------------------------------------------------------- */
/* FK fields that must resolve to a real users.id / batches.id, else the  */
/* referenced id gets a tombstone row.                                    */
/* ---------------------------------------------------------------------- */
const FK_SCANS = [
  // [collectionKey, column, kind ('user'|'batch')]
  ['enrollments', 'user_id', 'user'], ['enrollments', 'batch_id', 'batch'],
  ['sessions', 'batch_id', 'batch'],
  ['live_classes', 'batch_id', 'batch'],
  ['quests', 'batch_id', 'batch'],
  ['quest_submissions', 'user_id', 'user'], ['quest_submissions', 'graded_by', 'user'],
  ['open_submissions', 'user_id', 'user'],
  ['task_files', 'by', 'user'],
  ['gem_events', 'user_id', 'user'], ['gem_events', 'batch_id', 'batch'],
  ['certificates', 'user_id', 'user'], ['certificates', 'batch_id', 'batch'],
  ['attendance', 'user_id', 'user'],
  ['course_messages', 'batch_id', 'batch'], ['course_messages', 'user_id', 'user'],
  ['chat_reads', 'user_id', 'user'], ['chat_reads', 'batch_id', 'batch'],
  ['announcements', 'batch_id', 'batch'],
  ['ai_reports', 'user_id', 'user'], ['ai_reports', 'batch_id', 'batch'],
  ['event_entries', 'user_id', 'user'],
  ['event_submissions', 'user_id', 'user'],
  ['event_comments', 'user_id', 'user'],
  ['leads', 'user_id', 'user'],
  ['staff_records', 'user_id', 'user'],
  ['department_members', 'user_id', 'user'],
  ['ambassadors', 'user_id', 'user'],
  ['ambassador_gem_events', 'batch_id', 'batch'],
  ['job_comments', 'user_id', 'user'],
  ['lessons', 'batch_id', 'batch'],
  ['assignments', 'batch_id', 'batch'],
  ['submissions', 'user_id', 'user'],
  ['challenge_submissions', 'user_id', 'user'],
  ['quizzes', 'batch_id', 'batch'],
  ['quiz_attempts', 'user_id', 'user'],
  ['contracts', 'user_id', 'user'],
];

function toCamel(col) { return col.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase()); }

function isoFromNowString(s) {
  // now(): "2026-07-21 14:30:00" -> treat as a UTC instant.
  return new Date(String(s).replace(' ', 'T') + 'Z');
}

function assertValidDate(d, ctx) {
  if (!d || Number.isNaN(d.getTime())) {
    throw new Error(`Unparseable date while converting ${ctx} - refusing to import a row that would silently become "Invalid Date".`);
  }
  return d;
}

function buildRow(table, columns, rec, idx, collKey) {
  const row = {};
  const jsonCols = JSON_COLUMNS_BY_TABLE[table];
  const localDateCols = LOCAL_DATETIME_COLUMNS_BY_TABLE[table];
  for (const col of columns) {
    const raw = rec[col];
    if (raw === undefined) continue; // omit -> let Prisma apply the schema default / NULL
    const field = toCamel(col);
    if (jsonCols && col in jsonCols) {
      const nullable = jsonCols[col];
      row[field] = raw === null ? (nullable ? Prisma.DbNull : Prisma.JsonNull) : raw;
    } else if (localDateCols && localDateCols.has(col)) {
      // raw is "YYYY-MM-DDTHH:MM" with no seconds/offset - append both
      // explicitly rather than trust system-local parsing (see
      // LOCAL_DATETIME_OFFSET comment above).
      row[field] = raw == null ? null : assertValidDate(new Date(`${raw}:00${LOCAL_DATETIME_OFFSET}`), `${collKey}[${idx}].${col}="${raw}"`);
    } else if (TIMESTAMP_COLUMNS.has(col) && raw != null) {
      row[field] = assertValidDate(isoFromNowString(raw), `${collKey}[${idx}].${col}="${raw}"`);
    } else {
      row[field] = raw;
    }
  }
  return row;
}

function assertNoDuplicateIds(collKey, records) {
  const seen = new Set();
  for (const r of records) {
    if (seen.has(r.id)) {
      throw new Error(`Duplicate id ${r.id} within source collection "${collKey}" in ${DB_PATH} - refusing to import ambiguous data.`);
    }
    seen.add(r.id);
  }
}

async function insertCollection(tx, model, table, columns, records, collKey) {
  if (!records.length) return { inserted: 0, skipped: 0 };
  assertNoDuplicateIds(collKey, records);
  const rows = records.map((r, i) => buildRow(table, columns, r, i, collKey));
  const result = await tx[model].createMany({ data: rows, skipDuplicates: true });
  return { inserted: result.count, skipped: records.length - result.count };
}

/** Scans every FK_SCANS entry, returns { userIdsNeeded: Set, batchIdsNeeded: Set } of ids referenced but not present in json.users/json.batches. */
function findDanglingIds(json) {
  const realUserIds = new Set((json.users || []).map((u) => u.id));
  const realBatchIds = new Set((json.batches || []).map((b) => b.id));
  const userIdsNeeded = new Set();
  const batchIdsNeeded = new Set();
  for (const [collKey, col, kind] of FK_SCANS) {
    const rows = Array.isArray(json[collKey]) ? json[collKey] : [];
    for (const r of rows) {
      const v = r[col];
      if (v == null) continue;
      const id = Number(v);
      if (Number.isNaN(id)) continue; // e.g. event_submissions.graded_by can be the string 'ai' — not a user id
      if (kind === 'user' && !realUserIds.has(id)) userIdsNeeded.add(id);
      if (kind === 'batch' && !realBatchIds.has(id)) batchIdsNeeded.add(id);
    }
  }
  return { userIdsNeeded, batchIdsNeeded };
}

function tombstoneUser(id) {
  return {
    id, name: `[deleted user ${id}]`, role: 'deleted', username: `__deleted_user_${id}__`,
    email: null, regNo: null, passwordHash: null, profile: {}, streak: 0, bestStreak: 0,
    lastActive: null, createdAt: new Date(0), onboardingComplete: true, avatar: null,
    signature: null, googleSub: null, isDeletedPlaceholder: true,
    companyId: null, designation: null, city: null, hiringNote: null, status: null, statusReason: null,
    overrideRequested: false, overrideReason: null, approvedBy: null, approvedAt: null,
  };
}

function tombstoneBatch(id) {
  return {
    id, courseId: ANCHOR_COURSE_ID, code: `__DELETED_BATCH_${id}__`, name: `[deleted batch ${id}]`,
    startDate: '1970-01-01', status: 'deleted', instructorIds: [], createdAt: new Date(0), isDeletedPlaceholder: true,
  };
}

async function importRegistries(tx, json) {
  const seqEntries = Object.entries(json.seq || {});
  for (const [name, value] of seqEntries) {
    await tx.seq.upsert({ where: { name }, create: { name, value }, update: { value } });
  }
  const issuedUsernames = (json.issued_usernames || []).map(String);
  if (issuedUsernames.length) {
    await tx.issuedUsername.createMany({ data: issuedUsernames.map((value) => ({ value })), skipDuplicates: true });
  }
  const issuedRegnos = (json.issued_regnos || []).map(String);
  if (issuedRegnos.length) {
    await tx.issuedRegno.createMany({ data: issuedRegnos.map((value) => ({ value })), skipDuplicates: true });
  }
  const settingsEntries = Object.entries(json.settings || {});
  for (const [key, value] of settingsEntries) {
    // Setting.value is `Json` (NOT nullable) - a null source value must become
    // Prisma.JsonNull (the JSON literal null), not Prisma.DbNull (a real SQL
    // NULL), which the NOT NULL constraint would reject.
    const v = value === null ? Prisma.JsonNull : value;
    await tx.setting.upsert({ where: { key }, create: { key, value: v }, update: { value: v } });
  }
  log(`registries: ${seqEntries.length} seq counter(s), ${issuedUsernames.length} issued username(s), ${issuedRegnos.length} issued reg no(s), ${settingsEntries.length} settings key(s)`);
}

async function resetSequences(prisma) {
  log('Resetting sequences to MAX(id) for every table...');
  const tables = [...new Set(COLLECTIONS.map((c) => c[1]))];
  for (const table of tables) {
    const seqRows = await prisma.$queryRawUnsafe(`SELECT pg_get_serial_sequence('${table}', 'id') AS seq`);
    const seqName = seqRows[0] && seqRows[0].seq;
    if (!seqName) continue; // table has no serial "id" (shouldn't happen here, but don't assume)
    await prisma.$executeRawUnsafe(
      `SELECT setval($1, GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1), (SELECT COUNT(*) FROM ${table}) > 0)`,
      seqName
    );
  }
  log('Sequences reset.');
}

function assertKnownTopLevelKeys(json) {
  const known = new Set([...COLLECTIONS.map((c) => c[0]), 'seq', 'settings', 'issued_usernames', 'issued_regnos']);
  for (const key of Object.keys(json)) {
    if (known.has(key)) continue;
    const v = json[key];
    const hasData = Array.isArray(v) ? v.length > 0 : (v && typeof v === 'object' ? Object.keys(v).length > 0 : v != null);
    if (hasData) {
      throw new Error(`Unrecognized top-level key "${key}" with data in ${DB_PATH} - this script doesn't know how to import it yet. Add it to COLLECTIONS in migrations/import-prisma.js rather than silently dropping this data.`);
    }
  }
}

async function main() {
  log(`Reading JSON store from ${DB_PATH}`);
  const json = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  assertKnownTopLevelKeys(json);

  const adapter = new PrismaPg({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
  });
  const prisma = new PrismaClient({ adapter });

  let userIdsNeeded = new Set();
  let batchIdsNeeded = new Set();

  try {
    log('Scanning for dangling foreign-key references (deleted-but-referenced users/batches)...');
    ({ userIdsNeeded, batchIdsNeeded } = findDanglingIds(json));
    if (userIdsNeeded.size) log(`  user tombstones needed: ${[...userIdsNeeded].sort((a, b) => a - b).join(', ')}`);
    if (batchIdsNeeded.size) log(`  batch tombstones needed: ${[...batchIdsNeeded].sort((a, b) => a - b).join(', ')}`);
    if (!userIdsNeeded.size && !batchIdsNeeded.size) log('  none found - every FK in this dataset resolves to a real row.');

    await prisma.$transaction(async (tx) => {
      const coursesEntry = COLLECTIONS.find((c) => c[0] === 'courses');
      const rCourses = await insertCollection(tx, coursesEntry[2], coursesEntry[1], coursesEntry[3], json.courses || [], 'courses');
      log(`courses: ${rCourses.inserted} inserted, ${rCourses.skipped} already present (json had ${(json.courses || []).length})`);

      const companiesEntry = COLLECTIONS.find((c) => c[0] === 'companies');
      const rCompanies = await insertCollection(tx, companiesEntry[2], companiesEntry[1], companiesEntry[3], json.companies || [], 'companies');
      log(`companies: ${rCompanies.inserted} inserted, ${rCompanies.skipped} already present (json had ${(json.companies || []).length})`);

      if (batchIdsNeeded.size) {
        await tx.course.createMany({
          data: [{ id: ANCHOR_COURSE_ID, code: '__DELETED_BATCH_ANCHOR__', title: '[placeholder course for deleted-batch tombstones]', createdAt: new Date(0) }],
          skipDuplicates: true,
        });
        log(`  inserted anchor course id=${ANCHOR_COURSE_ID} for tombstone batches to point at`);
      }
      if (userIdsNeeded.size) {
        const rows = [...userIdsNeeded].sort((a, b) => a - b).map(tombstoneUser);
        const r = await tx.user.createMany({ data: rows, skipDuplicates: true });
        log(`  tombstoned ${r.count} deleted-but-referenced user(s): ${[...userIdsNeeded].sort((a, b) => a - b).join(', ')}`);
      }
      if (batchIdsNeeded.size) {
        const rows = [...batchIdsNeeded].sort((a, b) => a - b).map(tombstoneBatch);
        const r = await tx.batch.createMany({ data: rows, skipDuplicates: true });
        log(`  tombstoned ${r.count} deleted-but-referenced batch(es): ${[...batchIdsNeeded].sort((a, b) => a - b).join(', ')}`);
      }

      const usersEntry = COLLECTIONS.find((c) => c[0] === 'users');
      const rUsers = await insertCollection(tx, usersEntry[2], usersEntry[1], usersEntry[3], json.users || [], 'users');
      log(`users: ${rUsers.inserted} inserted, ${rUsers.skipped} already present (json had ${(json.users || []).length}, plus ${userIdsNeeded.size} tombstone(s) above)`);

      const batchesEntry = COLLECTIONS.find((c) => c[0] === 'batches');
      const rBatches = await insertCollection(tx, batchesEntry[2], batchesEntry[1], batchesEntry[3], json.batches || [], 'batches');
      log(`batches: ${rBatches.inserted} inserted, ${rBatches.skipped} already present (json had ${(json.batches || []).length}, plus ${batchIdsNeeded.size} tombstone(s) above)`);

      for (const [key, table, model, columns] of COLLECTIONS) {
        if (FRONT_LOADED_KEYS.has(key)) continue;
        const records = Array.isArray(json[key]) ? json[key] : [];
        const r = await insertCollection(tx, model, table, columns, records, key);
        log(`${table}: ${r.inserted} inserted, ${r.skipped} already present (json had ${records.length})`);
      }

      await importRegistries(tx, json);
    }, { maxWait: 30000, timeout: 10 * 60 * 1000 });

    log('Transaction committed.');

    await resetSequences(prisma);

    log('\nImport summary (JSON records -> Postgres rows now in table):');
    let allOk = true;
    for (const [key, table] of COLLECTIONS) {
      const jsonCount = Array.isArray(json[key]) ? json[key].length : 0;
      const extra = key === 'users' ? userIdsNeeded.size : key === 'batches' ? batchIdsNeeded.size : 0;
      const countRows = await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM ${table}`);
      const now = countRows[0].n;
      const ok = now >= jsonCount + extra;
      if (!ok) allOk = false;
      log(`  ${table.padEnd(28)} json=${jsonCount}${extra ? ` (+${extra} tombstone)` : ''}  postgres=${now}  ${ok ? 'OK' : 'MISMATCH'}`);
    }
    if (!allOk) {
      throw new Error('One or more collections do not have matching row counts after import - investigate before trusting this import.');
    }
    log(`\nAll collections verified. The JSON file at ${DB_PATH} was not modified.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[import-prisma] FAILED:', err);
  process.exitCode = 1;
});
