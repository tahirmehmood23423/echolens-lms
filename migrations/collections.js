'use strict';

/**
 * Single source of truth for which store.js collections get their own
 * Postgres table. Every entry here is a JS array in store.js's in-memory
 * `data` object (see the `empty()` function there), keyed by an integer
 * `id` assigned by `nextId(name)`.
 *
 * `issued_usernames` and `issued_regnos` are plain string/number arrays
 * (no `id` field per entry) and `settings`/`seq` are single objects, not
 * collections - all four live in the `store_meta` table instead (see
 * migrations/0001_legacy_store_schema.sql).
 *
 * If store.js's `empty()` ever gains a new collection, add its name here
 * and add a matching `CREATE TABLE` in a new numbered migration - do not
 * edit 0001 after it has shipped anywhere.
 */
const COLLECTIONS = [
  'users', 'courses', 'batches', 'enrollments', 'sessions', 'lessons', 'assignments',
  'submissions', 'announcements', 'gem_events', 'challenges', 'challenge_submissions',
  'hackathons', 'hackathon_entries', 'hackathon_submissions', 'ai_reports', 'quests',
  'quest_submissions', 'course_messages', 'chat_reads', 'live_classes', 'attendance',
  'quizzes', 'quiz_attempts', 'certificates', 'task_files', 'events', 'event_entries',
  'event_submissions', 'event_comments', 'leads', 'open_submissions', 'registrations',
  'public_announcements', 'jobs', 'job_comments', 'discount_categories', 'challans',
  'expenses', 'coordinator_queries', 'staff_groups', 'staff_records', 'ambassadors',
  'ambassador_gem_events', 'ambassador_duties', 'ambassador_duty_status',
  'ambassador_reports', 'departments', 'department_members', 'department_tasks',
  'department_task_status', 'department_announcements', 'contracts',
  // Talent Marketplace (Phase 1+) - added in migrations/0002_recruiters.sql
  'companies', 'audit_log',
];

module.exports = { COLLECTIONS };
