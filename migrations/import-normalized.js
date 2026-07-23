'use strict';

/**
 * EchoLens LMS — one-time JSON → normalized Postgres import
 *
 * Companion to schema.prisma (the FUTURE normalized-schema design — see that
 * file's header). This is a SEPARATE, independent import path from
 * migrations/import-json.js: that script feeds the legacy JSONB-blob store
 * (store.js's actual runtime persistence); this one feeds a from-scratch
 * relational database matching schema.prisma, for design validation only.
 * Nothing in the running app reads from the database this script writes to.
 *
 * SAFETY
 *  - Reads NORMALIZED_DATABASE_URL, never DATABASE_URL — the legacy JSONB
 *    store and this normalized design must never share a connection string,
 *    because both use the same table names (users, courses, ...) and a
 *    schema mismatch between them would be silently destructive.
 *  - Refuses to run unless NORMALIZED_DATABASE_URL's database name looks
 *    like a non-production database (contains "staging", "dev", "test", or
 *    "local"), unless --i-know-this-is-not-production is passed explicitly.
 *  - Refuses to import on top of existing rows unless --force (truncates
 *    first) — same one-time-move guard as import-json.js.
 *  - Never modifies the source JSON file.
 *
 * TOMBSTONES (dynamic, not hardcoded)
 *  The source backup this schema was designed against had 8 users (ids 5, 8,
 *  21, 25, 27, 30, 31, 42) and 1 batch (id 1) deleted but still referenced by
 *  a real foreign key elsewhere (e.g. a certificate's user_id). That exact
 *  backup file isn't available in every environment this script might run
 *  in, so instead of hardcoding those ids, this script:
 *    1. Loads every row for every collection.
 *    2. Walks every FK-bearing field listed in FK_FIELDS below.
 *    3. Collects every referenced id that ISN'T present in the real
 *       users/batches rows.
 *    4. Inserts one tombstone row per missing id (users.is_deleted_placeholder
 *       = true / batches.is_deleted_placeholder = true) with minimal
 *       satisfying values, BEFORE any dependent rows are inserted.
 *  This reproduces the intended tombstone behaviour for whatever a given
 *  backup actually contains, including the exact 8-users-+-batch-1 case.
 *
 * ORDER
 *  Collections are inserted in FK-safe order (see COLLECTIONS below): every
 *  table is inserted only after every table it references.
 *
 * DATES
 *  now()-produced fields ("YYYY-MM-DD HH:MM:SS", a UTC instant with no
 *  offset marker) are converted to real Date objects by appending "Z".
 *  today()/date-only fields ("YYYY-MM-DD") and other free-text date/deadline
 *  strings are left untouched (they map to Prisma String columns).
 *
 * USAGE
 *   NORMALIZED_DATABASE_URL=postgresql://.../echolens_normalized_staging \
 *     node migrations/import-normalized.js [--force] [--db-path=path/to/echolens.json]
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const FORCE = process.argv.includes('--force');
const ALLOW_PROD = process.argv.includes('--i-know-this-is-not-production');
const dbPathArg = process.argv.find((a) => a.startsWith('--db-path='));
const DB_PATH = dbPathArg ? dbPathArg.slice('--db-path='.length) : (process.env.DB_PATH || path.join(__dirname, '..', 'echolens.json'));
const CONN = process.env.NORMALIZED_DATABASE_URL;

if (!CONN) {
  console.error('NORMALIZED_DATABASE_URL is not set. This must point at an isolated database — never the legacy store\'s DATABASE_URL.');
  process.exit(1);
}
// Check ONLY the database name (last path segment), never the full
// connection string — the password/host/user can easily contain a
// substring like "dev" (e.g. "echolens_dev") without the actual database
// being anything but production. A previous version of this check matched
// the whole string and was fooled by exactly that.
let dbName = '';
try { dbName = new URL(CONN).pathname.replace(/^\//, ''); } catch { dbName = CONN.split('/').pop().split('?')[0]; }
if (!/staging|dev|test|local/i.test(dbName) && !ALLOW_PROD) {
  console.error(
    `Refusing to run: NORMALIZED_DATABASE_URL's database name ("${dbName}") doesn't look like a ` +
    `non-production database (expected "staging"/"dev"/"test"/"local" in the name). ` +
    `Pass --i-know-this-is-not-production if this really is safe.`
  );
  process.exit(1);
}
if (!fs.existsSync(DB_PATH)) {
  console.error(`No JSON store found at ${DB_PATH} (pass --db-path=... or set DB_PATH).`);
  process.exit(1);
}

/* ---------------------------------------------------------------------- */
/* Collection → Postgres table (@@map) and column list, in insertion order */
/* ---------------------------------------------------------------------- */

// Every entry: [jsonKey, tableName, columns[]]. `columns` maps camelCase JSON
// fields (as store.js actually names them, i.e. snake_case already) straight
// through — store.js's in-memory records already use snake_case keys
// matching the @map names in schema.prisma, so no renaming is needed except
// where noted.
const COLLECTIONS = [
  // -- no FK dependencies --
  ['courses', 'courses', ['id', 'code', 'title', 'tier', 'level', 'weeks', 'hours', 'price_pkr', 'summary', 'created_at', 'badges', 'free_mode']],
  ['companies', 'companies', ['id', 'domain', 'name', 'website', 'size_band', 'created_at']],
  // users depends on companies (company_id)
  ['users', 'users', [
    'id', 'name', 'role', 'username', 'email', 'reg_no', 'password_hash', 'profile', 'streak', 'best_streak',
    'last_active', 'created_at', 'onboarding_complete', 'avatar', 'signature', 'google_sub', 'is_deleted_placeholder',
    'company_id', 'designation', 'city', 'hiring_note', 'status', 'status_reason', 'override_requested', 'override_reason',
    'approved_by', 'approved_at',
  ]],
  // batches depends on courses
  ['batches', 'batches', ['id', 'course_id', 'code', 'name', 'start_date', 'status', 'instructor_ids', 'created_at', 'is_deleted_placeholder']],
  ['enrollments', 'enrollments', ['id', 'user_id', 'batch_id', 'created_at']],
  ['sessions', 'sessions', ['id', 'batch_id', 'week_no', 'title', 'session_date', 'start_time', 'end_time', 'room', 'started_at', 'ended_at', 'started_by', 'created_at']],
  ['live_classes', 'live_classes', ['id', 'batch_id', 'title', 'room', 'started_by', 'started_at', 'ended_at', 'date']],
  ['quests', 'quests', ['id', 'batch_id', 'track_key', 'no', 'week', 'session', 'title', 'topic', 'problems', 'created_at', 'deadline']],
  ['quest_submissions', 'quest_submissions', [
    'id', 'quest_id', 'pid', 'user_id', 'file_url', 'note', 'grade', 'gems', 'remarks', 'submitted_at', 'graded_at',
    'graded_by', 'code', 'language', 'ai_review', 'review_shared', 'review_shared_at', 'late', 'integrity', 'late_deduction',
  ]],
  ['open_submissions', 'open_submissions', [
    'id', 'user_id', 'track_key', 'level', 'pid', 'problem_title', 'points', 'code', 'language', 'file_url', 'file_name',
    'submitted_at', 'score', 'gems', 'feedback', 'graded_at', 'attempts', 'files',
  ]],
  ['task_files', 'task_files', ['id', 'quest_id', 'pid', 'name', 'url', 'size', 'by', 'created_at']],
  ['gem_events', 'gem_events', ['id', 'user_id', 'batch_id', 'amount', 'source', 'note', 'by', 'at']],
  ['certificates', 'certificates', [
    'id', 'serial', 'user_id', 'student_name', 'reg_no', 'batch_id', 'kind', 'title', 'detail', 'completion_date',
    'instructor_name', 'instructor_sig', 'issued_by', 'issued_at', 'concepts', 'final_project', 'source_kind', 'source_id',
  ]],
  ['attendance', 'attendance', ['id', 'session_id', 'user_id', 'joined_at', 'minutes', 'last_seen']],
  ['course_messages', 'course_messages', ['id', 'batch_id', 'user_id', 'body', 'anonymous', 'staff_role', 'created_at', 'mentions']],
  ['chat_reads', 'chat_reads', ['id', 'user_id', 'batch_id', 'last_read_at']],
  ['announcements', 'announcements', ['id', 'batch_id', 'author_id', 'title', 'body', 'created_at']],
  ['public_announcements', 'public_announcements', ['id', 'kind', 'title', 'body', 'link', 'link_label', 'pinned', 'created_by', 'created_at']],
  ['ai_reports', 'ai_reports', ['id', 'user_id', 'batch_id', 'scope', 'markdown', 'status', 'created_at', 'published_at', 'by']],
  ['events', 'events', [
    'id', 'kind', 'title', 'description', 'scope', 'entry', 'fee_pkr', 'pay_instructions', 'starts_at', 'ends_at',
    'deadline', 'duration_minutes', 'pass_mark', 'auto_grade', 'auto_certificate', 'compiler', 'dataset_url', 'files',
    'problems', 'prizes', 'meeting_link', 'open', 'created_by', 'created_at',
  ]],
  ['event_entries', 'event_entries', ['id', 'event_id', 'user_id', 'name', 'reg_no', 'tier', 'payment_status', 'payment_shot', 'registered_at']],
  ['event_submissions', 'event_submissions', [
    'id', 'event_id', 'entry_id', 'user_id', 'pid', 'code', 'language', 'file_url', 'file_name', 'link', 'note',
    'submitted_at', 'ai_score', 'score', 'ai_feedback', 'graded_by', 'graded_at', 'certified',
  ]],
  ['event_comments', 'event_comments', ['id', 'event_id', 'user_id', 'name', 'role', 'body', 'created_at']],
  ['leads', 'leads', ['id', 'name', 'email', 'whatsapp', 'source', 'user_id', 'created_at', 'updated_at']],
  ['discount_categories', 'discount_categories', ['id', 'name', 'type', 'value', 'active', 'created_by', 'created_at']],
  ['registrations', 'registrations', [
    'id', 'name', 'email', 'whatsapp', 'city', 'course_code', 'course_title', 'note', 'status', 'admin_note',
    'created_at', 'updated_at', 'payment_stage', 'discount_category_id', 'challan_serial', 'enrolled_user_id',
    'enrolled_batch_id', 'cleared_by', 'cleared_at', 'ambassador_code', 'ambassador_name',
  ]],
  ['challans', 'challans', [
    'id', 'serial', 'registration_id', 'course_code', 'course_title', 'student_name', 'student_email', 'student_id',
    'gross_fee', 'fee_parts', 'discount_category_id', 'discounts', 'discount_label', 'discount_amount', 'net_fee',
    'deadline', 'bank_snapshot', 'status', 'generated_by', 'generated_at', 'sent_at', 'paid_confirmed_by', 'paid_confirmed_at',
  ]],
  ['expenses', 'expenses', ['id', 'date', 'category', 'description', 'amount', 'added_by', 'created_at']],
  ['staff_groups', 'staff_groups', ['id', 'name', 'description', 'created_at']],
  ['staff_records', 'staff_records', ['id', 'user_id', 'name', 'email', 'phone', 'position', 'employment_type', 'group_id', 'status', 'joined_at', 'instructions', 'follow_ups', 'created_at']],
  ['departments', 'departments', ['id', 'name', 'head_user_id', 'created_by', 'created_at']],
  ['department_members', 'department_members', ['id', 'department_id', 'user_id', 'added_by', 'added_at']],
  ['department_tasks', 'department_tasks', ['id', 'department_id', 'title', 'description', 'scope', 'attachment', 'created_by', 'created_at']],
  ['department_task_status', 'department_task_status', ['id', 'task_id', 'user_id', 'status', 'note', 'proof_attachment', 'completed_at']],
  ['department_announcements', 'department_announcements', ['id', 'department_id', 'title', 'body', 'created_by', 'created_at']],
  ['coordinator_queries', 'coordinator_queries', ['id', 'student_id', 'student_name', 'subject', 'messages', 'status', 'created_at', 'updated_at']],
  ['contracts', 'contracts', [
    'id', 'user_id', 'role', 'status', 'pdf_filename', 'sent_at', 'deadline_at', 'submitted_at',
    'submission_zip_filename', 'offer_letter_filename', 'offer_letter_sent_at',
  ]],
  ['ambassadors', 'ambassadors', ['id', 'user_id', 'name', 'email', 'code', 'university', 'active', 'gems', 'created_by', 'created_at']],
  // ambassador_gem_events depends on ambassadors + registrations + batches
  ['ambassador_gem_events', 'ambassador_gem_events', ['id', 'ambassador_id', 'amount', 'source', 'course_tier', 'registration_id', 'batch_id', 'note', 'created_at']],
  ['ambassador_duties', 'ambassador_duties', ['id', 'ambassador_id', 'title', 'detail', 'due_at', 'created_by', 'created_at']],
  ['ambassador_duty_status', 'ambassador_duty_status', ['id', 'duty_id', 'status', 'note', 'updated_at']],
  ['ambassador_reports', 'ambassador_reports', ['id', 'ambassador_id', 'period', 'filename', 'student_count', 'total_paid', 'total_commission', 'generated_at']],
  ['jobs', 'jobs', ['id', 'title', 'company', 'location', 'job_type', 'experience_level', 'salary_range', 'description', 'requirements', 'apply_url', 'apply_email', 'deadline', 'status', 'posted_by', 'created_at']],
  ['job_comments', 'job_comments', ['id', 'job_id', 'user_id', 'user_name', 'user_role', 'user_avatar', 'body', 'created_at']],
  ['lessons', 'lessons', ['id', 'course_id', 'batch_id', 'week_no', 'title', 'type', 'url', 'position', 'created_at']],
  ['assignments', 'assignments', ['id', 'batch_id', 'title', 'description', 'due_date', 'points', 'created_by', 'created_at']],
  ['submissions', 'submissions', ['id', 'assignment_id', 'user_id', 'file_url', 'note', 'grade', 'gems', 'remarks', 'submitted_at', 'graded_at', 'graded_by']],
  ['challenges', 'challenges', ['id', 'title', 'description', 'difficulty', 'gems', 'due_date', 'open', 'created_by', 'created_at']],
  ['challenge_submissions', 'challenge_submissions', ['id', 'challenge_id', 'user_id', 'link', 'note', 'status', 'remarks', 'submitted_at', 'reviewed_at', 'reviewed_by']],
  ['hackathons', 'hackathons', ['id', 'title', 'theme', 'starts_at', 'ends_at', 'mode', 'team_max', 'entry', 'fee_pkr', 'pay_instructions', 'prizes', 'finalized', 'created_by', 'created_at']],
  ['hackathon_entries', 'hackathon_entries', ['id', 'hackathon_id', 'team_name', 'member_ids', 'registered_by', 'payment_status', 'payment_ref', 'payment_by', 'registered_at']],
  ['hackathon_submissions', 'hackathon_submissions', ['id', 'hackathon_id', 'entry_id', 'link', 'note', 'score', 'remarks', 'judged_by', 'judged_at', 'submitted_at']],
  ['quizzes', 'quizzes', ['id', 'batch_id', 'title', 'questions', 'duration_min', 'points', 'allow_ide', 'opened_at', 'closes_at', 'created_by', 'created_at']],
  ['quiz_attempts', 'quiz_attempts', ['id', 'quiz_id', 'user_id', 'answers', 'correct', 'total', 'score_pct', 'gems', 'taken_at']],
  ['audit_log', 'audit_log', ['id', 'actor_id', 'action', 'target_type', 'target_id', 'detail', 'at']],
];

// JSON columns (need JSON.stringify before insert)
const JSON_COLUMNS = new Set([
  'profile', 'badges', 'instructor_ids', 'problems', 'ai_review', 'integrity', 'files', 'concepts', 'mentions',
  'status', 'discounts', 'fee_parts', 'bank_snapshot', 'instructions', 'follow_ups', 'attachment', 'proof_attachment',
  'messages', 'prizes', 'member_ids', 'questions', 'answers', 'detail',
]);
// `detail` is JSON only on audit_log; on certificates it's a plain string. Handled per-table below instead of globally.
const JSON_COLUMNS_BY_TABLE = {
  audit_log: new Set(['detail']),
};

// now()-style full-timestamp columns (need "YYYY-MM-DD HH:MM:SS" -> Date).
// Columns NOT in this set that still look like dates (deadline, due_date,
// start_date, session_date, joined_at-that's-actually-now, starts_at/ends_at
// on hackathons) are left as plain strings per the verified date-type notes
// in schema.prisma.
const TIMESTAMP_COLUMNS = new Set([
  'created_at', 'updated_at', 'last_active', 'submitted_at', 'graded_at', 'review_shared_at', 'at', 'issued_at',
  'joined_at', 'last_seen', 'last_read_at', 'registered_at', 'added_at', 'started_at', 'ended_at', 'generated_at',
  'sent_at', 'paid_confirmed_at', 'cleared_at', 'completed_at', 'approved_at', 'published_at', 'taken_at',
  'judged_at', 'reviewed_at', 'opened_at', 'closes_at',
]);
// Event.starts_at/ends_at are a raw "YYYY-MM-DDTHH:MM" datetime-local string
// (no seconds) — still a real timestamp column, just needs different parsing
// (new Date() handles this format natively without appending "Z", treating
// it as local time; that matches how the browser originally produced it).
const LOCAL_DATETIME_COLUMNS_BY_TABLE = { events: new Set(['starts_at', 'ends_at']) };

/* ---------------------------------------------------------------------- */
/* FK fields that must resolve to a real users.id / batches.id, else the   */
/* referenced id gets a tombstone row. Format: { table: { column: 'users'  */
/* | 'batches', required: bool } }                                        */
/* ---------------------------------------------------------------------- */
const USER_FK = { table: 'users', idsInData: (json) => new Set((json.users || []).map((u) => u.id)) };
const BATCH_FK = { table: 'batches', idsInData: (json) => new Set((json.batches || []).map((b) => b.id)) };

const FK_SCANS = [
  // [collectionKey, column, kind ('user'|'batch'), optional]
  ['enrollments', 'user_id', 'user', false], ['enrollments', 'batch_id', 'batch', false],
  ['sessions', 'batch_id', 'batch', false],
  ['live_classes', 'batch_id', 'batch', false],
  ['quests', 'batch_id', 'batch', false],
  ['quest_submissions', 'user_id', 'user', false], ['quest_submissions', 'graded_by', 'user', true],
  ['open_submissions', 'user_id', 'user', false],
  ['task_files', 'by', 'user', true],
  ['gem_events', 'user_id', 'user', false], ['gem_events', 'batch_id', 'batch', true],
  ['certificates', 'user_id', 'user', false], ['certificates', 'batch_id', 'batch', true],
  ['attendance', 'user_id', 'user', false],
  ['course_messages', 'batch_id', 'batch', false], ['course_messages', 'user_id', 'user', false],
  ['chat_reads', 'user_id', 'user', false], ['chat_reads', 'batch_id', 'batch', false],
  ['announcements', 'batch_id', 'batch', true],
  ['ai_reports', 'user_id', 'user', false], ['ai_reports', 'batch_id', 'batch', true],
  ['event_entries', 'user_id', 'user', false],
  ['event_submissions', 'user_id', 'user', false],
  ['event_comments', 'user_id', 'user', false],
  ['leads', 'user_id', 'user', true],
  ['staff_records', 'user_id', 'user', false],
  ['department_members', 'user_id', 'user', false],
  ['ambassadors', 'user_id', 'user', true],
  ['ambassador_gem_events', 'batch_id', 'batch', true],
  ['job_comments', 'user_id', 'user', false],
  ['lessons', 'batch_id', 'batch', false],
  ['assignments', 'batch_id', 'batch', false],
  ['submissions', 'user_id', 'user', false],
  ['challenge_submissions', 'user_id', 'user', false],
  ['quizzes', 'batch_id', 'batch', false],
  ['quiz_attempts', 'user_id', 'user', false],
  ['contracts', 'user_id', 'user', false],
];

function isoFromNowString(s) {
  if (s == null) return null;
  // now(): "2026-07-21 14:30:00" -> treat as UTC instant.
  return new Date(String(s).replace(' ', 'T') + 'Z');
}

async function tableRowCount(client, table) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${table}`);
  return rows[0].n;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Columns this script itself adds to the schema that no real store.js record
// ever populates (is_deleted_placeholder didn't exist before this migration
// design) — substitute the schema's own default rather than pass an explicit
// NULL, which would violate the NOT NULL constraint. Deliberately scoped to
// exact (table, column) pairs rather than a blanket per-column-name default,
// since column names repeat across tables with different defaults/types.
const MISSING_VALUE_DEFAULTS = {
  'users.is_deleted_placeholder': false,
  'batches.is_deleted_placeholder': false,
  // Recruiter-only field (Users.createRecruiter) — absent on every non-recruiter row.
  'users.override_requested': false,
};

function convertValue(table, column, value) {
  if (value === undefined) {
    const key = `${table}.${column}`;
    if (key in MISSING_VALUE_DEFAULTS) return MISSING_VALUE_DEFAULTS[key];
    return null;
  }
  const jsonCols = JSON_COLUMNS_BY_TABLE[table] || JSON_COLUMNS;
  if (jsonCols.has(column) && value !== null) return JSON.stringify(value);
  if (LOCAL_DATETIME_COLUMNS_BY_TABLE[table] && LOCAL_DATETIME_COLUMNS_BY_TABLE[table].has(column)) {
    return value == null ? null : new Date(value);
  }
  if (TIMESTAMP_COLUMNS.has(column) && value != null) return isoFromNowString(value);
  return value === undefined ? null : value;
}

async function insertCollection(client, table, columns, records) {
  if (!records.length) return 0;
  let inserted = 0;
  for (const batch of chunk(records, 500)) {
    const values = [];
    const params = [];
    batch.forEach((rec, ri) => {
      const placeholders = columns.map((_, ci) => `$${ri * columns.length + ci + 1}`);
      values.push(`(${placeholders.join(', ')})`);
      for (const col of columns) params.push(convertValue(table, col, rec[col]));
    });
    await client.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values.join(', ')} ON CONFLICT (id) DO NOTHING`,
      params
    );
    inserted += batch.length;
  }
  return inserted;
}

/** Scans every FK_SCANS entry, returns { userIdsNeeded: Set, batchIdsNeeded: Set } of ids referenced but not present in json.users/json.batches. */
function findDanglingIds(json) {
  const realUserIds = USER_FK.idsInData(json);
  const realBatchIds = BATCH_FK.idsInData(json);
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

async function insertUserTombstones(client, ids) {
  if (!ids.size) return;
  const rows = [...ids].sort((a, b) => a - b).map((id) => ({
    id, name: `[deleted user ${id}]`, role: 'deleted', username: `__deleted_user_${id}__`, email: null, reg_no: null,
    password_hash: null, profile: {}, streak: 0, best_streak: 0, last_active: null,
    created_at: new Date(0).toISOString().replace('T', ' ').slice(0, 19), onboarding_complete: true, avatar: null,
    signature: null, google_sub: null, is_deleted_placeholder: true,
    company_id: null, designation: null, city: null, hiring_note: null, status: null, status_reason: null,
    override_requested: false, override_reason: null, approved_by: null, approved_at: null,
  }));
  const columns = COLLECTIONS.find(([k]) => k === 'users')[2];
  const n = await insertCollection(client, 'users', columns, rows);
  console.log(`  tombstoned ${n} deleted-but-referenced user(s): ${[...ids].sort((a, b) => a - b).join(', ')}`);
}

async function insertBatchTombstones(client, ids) {
  if (!ids.size) return;
  // Batches require a real course_id FK. Insert one small anchor course
  // (a sentinel high id, chosen not to collide with real course ids) so the
  // tombstone batches have something valid to point at.
  const anchorId = -1;
  await client.query(
    `INSERT INTO courses (id, code, title, tier, level, weeks, hours, price_pkr, summary, created_at, badges, free_mode)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) ON CONFLICT (id) DO NOTHING`,
    [anchorId, '__DELETED_BATCH_ANCHOR__', '[placeholder course for deleted-batch tombstones]', null, null, null, null, null, null, new Date(0), null, null]
  );
  const rows = [...ids].sort((a, b) => a - b).map((id) => ({
    id, course_id: anchorId, code: `__DELETED_BATCH_${id}__`, name: `[deleted batch ${id}]`, start_date: '1970-01-01',
    status: 'deleted', instructor_ids: [], created_at: new Date(0).toISOString().replace('T', ' ').slice(0, 19), is_deleted_placeholder: true,
  }));
  const columns = COLLECTIONS.find(([k]) => k === 'batches')[2];
  const n = await insertCollection(client, 'batches', columns, rows);
  console.log(`  tombstoned ${n} deleted-but-referenced batch(es): ${[...ids].sort((a, b) => a - b).join(', ')}`);
}

async function setSequences(client) {
  console.log('\nResetting sequences to MAX(id)+1 for every collection...');
  for (const [, table] of COLLECTIONS) {
    // Not every table necessarily has rows (or even an id sequence, e.g.
    // singleton/no-autoincrement tables aren't in COLLECTIONS at all).
    const seqRes = await client.query(`SELECT pg_get_serial_sequence($1, 'id') AS seq`, [table]);
    const seqName = seqRes.rows[0] && seqRes.rows[0].seq;
    if (!seqName) continue;
    await client.query(`SELECT setval($1, GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1), (SELECT COUNT(*) FROM ${table}) > 0)`, [seqName]);
  }
  console.log('Done.');
}

async function importStoreMeta(client, json) {
  // seq / issued_usernames / issued_regnos / settings map onto standalone
  // singleton-style tables in the normalized schema:
  //   Seq        { name String @id, value Int }   <- one row per counter
  //   IssuedUsername / IssuedRegno { value String @id } <- one row per issued value
  //   Setting    { key String @id, value Json }   <- one row per settings.* key
  const seq = json.seq || {};
  const seqRows = Object.entries(seq).map(([name, value]) => [name, value]);
  if (seqRows.length) {
    const values = seqRows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    await client.query(`INSERT INTO seq (name, value) VALUES ${values} ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value`, seqRows.flat());
  }
  const issuedUsernames = json.issued_usernames || [];
  for (const batch of chunk(issuedUsernames, 1000)) {
    if (!batch.length) continue;
    const values = batch.map((_, i) => `($${i + 1})`).join(', ');
    await client.query(`INSERT INTO issued_usernames (value) VALUES ${values} ON CONFLICT (value) DO NOTHING`, batch);
  }
  const issuedRegnos = (json.issued_regnos || []).map(String);
  for (const batch of chunk(issuedRegnos, 1000)) {
    if (!batch.length) continue;
    const values = batch.map((_, i) => `($${i + 1})`).join(', ');
    await client.query(`INSERT INTO issued_regnos (value) VALUES ${values} ON CONFLICT (value) DO NOTHING`, batch);
  }
  const settings = json.settings || {};
  const settingsRows = Object.entries(settings);
  if (settingsRows.length) {
    const values = settingsRows.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const params = settingsRows.flatMap(([k, v]) => [k, JSON.stringify(v)]);
    await client.query(`INSERT INTO settings (key, value) VALUES ${values} ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, params);
  }
  console.log(`Imported store_meta: ${seqRows.length} seq counters, ${issuedUsernames.length} issued usernames, ${issuedRegnos.length} issued reg nos, ${settingsRows.length} settings keys.`);
}

async function main() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const json = JSON.parse(raw);

  const client = new Client({ connectionString: CONN });
  await client.connect();
  try {
    if (!FORCE) {
      const existing = await tableRowCount(client, 'users');
      if (existing > 0) {
        console.error(`Postgres already has ${existing} row(s) in "users". Refusing to import without --force (this is a one-time move, not a sync).`);
        process.exit(1);
      }
    } else {
      console.log('--force passed: truncating all tables first...');
      const tableNames = [...new Set(COLLECTIONS.map(([, t]) => t))].concat(['seq', 'issued_usernames', 'issued_regnos', 'settings']);
      await client.query(`TRUNCATE ${tableNames.join(', ')} RESTART IDENTITY CASCADE`);
    }

    await client.query('BEGIN');

    console.log('Scanning for dangling foreign-key references (deleted-but-referenced users/batches)...');
    const { userIdsNeeded, batchIdsNeeded } = findDanglingIds(json);
    if (!userIdsNeeded.size && !batchIdsNeeded.size) {
      console.log('  none found — every FK in this dataset resolves to a real row.');
    }

    // Batches reference courses, so courses must exist before any tombstone
    // batch anchor and before real batches. Insert real courses first.
    const coursesEntry = COLLECTIONS.find(([k]) => k === 'courses');
    const nCourses = await insertCollection(client, coursesEntry[1], coursesEntry[2], json.courses || []);
    console.log(`courses: ${nCourses} inserted`);

    const companiesEntry = COLLECTIONS.find(([k]) => k === 'companies');
    const nCompanies = await insertCollection(client, companiesEntry[1], companiesEntry[2], json.companies || []);
    console.log(`companies: ${nCompanies} inserted`);

    // Tombstones before any real dependent rows.
    await insertUserTombstones(client, userIdsNeeded);
    await insertBatchTombstones(client, batchIdsNeeded);

    const usersEntry = COLLECTIONS.find(([k]) => k === 'users');
    const nUsers = await insertCollection(client, usersEntry[1], usersEntry[2], json.users || []);
    console.log(`users: ${nUsers} inserted (plus ${userIdsNeeded.size} tombstone(s) above)`);

    const batchesEntry = COLLECTIONS.find(([k]) => k === 'batches');
    const nBatches = await insertCollection(client, batchesEntry[1], batchesEntry[2], json.batches || []);
    console.log(`batches: ${nBatches} inserted (plus ${batchIdsNeeded.size} tombstone(s) above)`);

    const summary = [];
    for (const [key, table, columns] of COLLECTIONS) {
      if (key === 'courses' || key === 'companies' || key === 'users' || key === 'batches') continue; // already done above
      const records = Array.isArray(json[key]) ? json[key] : [];
      const inserted = await insertCollection(client, table, columns, records);
      summary.push({ key, table, jsonCount: records.length, inserted });
    }

    await importStoreMeta(client, json);

    await client.query('COMMIT');

    await setSequences(client);

    console.log('\nImport summary (JSON records -> Postgres rows now in table):');
    let allMatch = true;
    for (const row of [{ key: 'courses', table: 'courses', jsonCount: (json.courses || []).length }, { key: 'companies', table: 'companies', jsonCount: (json.companies || []).length }, ...summary]) {
      const nowInTable = await tableRowCount(client, row.table);
      const ok = nowInTable >= row.jsonCount;
      if (!ok) allMatch = false;
      console.log(`  ${row.table.padEnd(28)} json=${row.jsonCount}  postgres=${nowInTable}  ${ok ? 'OK' : 'MISMATCH'}`);
    }
    const usersInTable = await tableRowCount(client, 'users');
    const batchesInTable = await tableRowCount(client, 'batches');
    console.log(`  ${'users'.padEnd(28)} json=${(json.users || []).length}  postgres=${usersInTable}  (includes ${userIdsNeeded.size} tombstone(s))`);
    console.log(`  ${'batches'.padEnd(28)} json=${(json.batches || []).length}  postgres=${batchesInTable}  (includes ${batchIdsNeeded.size} tombstone(s))`);

    if (!allMatch) {
      console.error('\nOne or more collections do not have matching row counts. Investigate before trusting this import.');
      process.exitCode = 1;
      return;
    }
    console.log(`\nAll collections imported. The JSON file at ${DB_PATH} was not modified.`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[import-normalized] failed:', err);
  process.exit(1);
});
