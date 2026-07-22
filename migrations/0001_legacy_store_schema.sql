-- 0001: legacy JSON store schema
-- One table per store.js collection (see migrations/collections.js), each
-- row holding its record as a JSONB payload keyed by the same integer id
-- store.js's nextId() already assigns. This is a deliberate translation of
-- the existing whole-file-snapshot JSON model, not a fresh relational
-- redesign - see the Phase 0 summary for why. Marketplace tables added in
-- later phases use normal relational columns and indexes as usual.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_data_gin ON users USING GIN (data);

CREATE TABLE IF NOT EXISTS courses (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS courses_data_gin ON courses USING GIN (data);

CREATE TABLE IF NOT EXISTS batches (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS batches_data_gin ON batches USING GIN (data);

CREATE TABLE IF NOT EXISTS enrollments (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enrollments_data_gin ON enrollments USING GIN (data);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_data_gin ON sessions USING GIN (data);

CREATE TABLE IF NOT EXISTS lessons (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lessons_data_gin ON lessons USING GIN (data);

CREATE TABLE IF NOT EXISTS assignments (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assignments_data_gin ON assignments USING GIN (data);

CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS submissions_data_gin ON submissions USING GIN (data);

CREATE TABLE IF NOT EXISTS announcements (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS announcements_data_gin ON announcements USING GIN (data);

CREATE TABLE IF NOT EXISTS gem_events (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gem_events_data_gin ON gem_events USING GIN (data);

CREATE TABLE IF NOT EXISTS challenges (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challenges_data_gin ON challenges USING GIN (data);

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challenge_submissions_data_gin ON challenge_submissions USING GIN (data);

CREATE TABLE IF NOT EXISTS hackathons (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hackathons_data_gin ON hackathons USING GIN (data);

CREATE TABLE IF NOT EXISTS hackathon_entries (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hackathon_entries_data_gin ON hackathon_entries USING GIN (data);

CREATE TABLE IF NOT EXISTS hackathon_submissions (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hackathon_submissions_data_gin ON hackathon_submissions USING GIN (data);

CREATE TABLE IF NOT EXISTS ai_reports (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_reports_data_gin ON ai_reports USING GIN (data);

CREATE TABLE IF NOT EXISTS quests (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quests_data_gin ON quests USING GIN (data);

CREATE TABLE IF NOT EXISTS quest_submissions (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quest_submissions_data_gin ON quest_submissions USING GIN (data);

CREATE TABLE IF NOT EXISTS course_messages (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_messages_data_gin ON course_messages USING GIN (data);

CREATE TABLE IF NOT EXISTS chat_reads (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_reads_data_gin ON chat_reads USING GIN (data);

CREATE TABLE IF NOT EXISTS live_classes (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS live_classes_data_gin ON live_classes USING GIN (data);

CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attendance_data_gin ON attendance USING GIN (data);

CREATE TABLE IF NOT EXISTS quizzes (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quizzes_data_gin ON quizzes USING GIN (data);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_data_gin ON quiz_attempts USING GIN (data);

CREATE TABLE IF NOT EXISTS certificates (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS certificates_data_gin ON certificates USING GIN (data);

CREATE TABLE IF NOT EXISTS task_files (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS task_files_data_gin ON task_files USING GIN (data);

CREATE TABLE IF NOT EXISTS events (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_data_gin ON events USING GIN (data);

CREATE TABLE IF NOT EXISTS event_entries (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_entries_data_gin ON event_entries USING GIN (data);

CREATE TABLE IF NOT EXISTS event_submissions (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_submissions_data_gin ON event_submissions USING GIN (data);

CREATE TABLE IF NOT EXISTS event_comments (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_comments_data_gin ON event_comments USING GIN (data);

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS leads_data_gin ON leads USING GIN (data);

CREATE TABLE IF NOT EXISTS open_submissions (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS open_submissions_data_gin ON open_submissions USING GIN (data);

CREATE TABLE IF NOT EXISTS registrations (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS registrations_data_gin ON registrations USING GIN (data);

CREATE TABLE IF NOT EXISTS public_announcements (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS public_announcements_data_gin ON public_announcements USING GIN (data);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_data_gin ON jobs USING GIN (data);

CREATE TABLE IF NOT EXISTS job_comments (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_comments_data_gin ON job_comments USING GIN (data);

CREATE TABLE IF NOT EXISTS discount_categories (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discount_categories_data_gin ON discount_categories USING GIN (data);

CREATE TABLE IF NOT EXISTS challans (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS challans_data_gin ON challans USING GIN (data);

CREATE TABLE IF NOT EXISTS expenses (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expenses_data_gin ON expenses USING GIN (data);

CREATE TABLE IF NOT EXISTS coordinator_queries (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coordinator_queries_data_gin ON coordinator_queries USING GIN (data);

CREATE TABLE IF NOT EXISTS staff_groups (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_groups_data_gin ON staff_groups USING GIN (data);

CREATE TABLE IF NOT EXISTS staff_records (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_records_data_gin ON staff_records USING GIN (data);

CREATE TABLE IF NOT EXISTS ambassadors (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassadors_data_gin ON ambassadors USING GIN (data);

CREATE TABLE IF NOT EXISTS ambassador_gem_events (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_gem_events_data_gin ON ambassador_gem_events USING GIN (data);

CREATE TABLE IF NOT EXISTS ambassador_duties (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_duties_data_gin ON ambassador_duties USING GIN (data);

CREATE TABLE IF NOT EXISTS ambassador_duty_status (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_duty_status_data_gin ON ambassador_duty_status USING GIN (data);

CREATE TABLE IF NOT EXISTS ambassador_reports (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ambassador_reports_data_gin ON ambassador_reports USING GIN (data);

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS departments_data_gin ON departments USING GIN (data);

CREATE TABLE IF NOT EXISTS department_members (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS department_members_data_gin ON department_members USING GIN (data);

CREATE TABLE IF NOT EXISTS department_tasks (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS department_tasks_data_gin ON department_tasks USING GIN (data);

CREATE TABLE IF NOT EXISTS department_task_status (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS department_task_status_data_gin ON department_task_status USING GIN (data);

CREATE TABLE IF NOT EXISTS department_announcements (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS department_announcements_data_gin ON department_announcements USING GIN (data);

CREATE TABLE IF NOT EXISTS contracts (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contracts_data_gin ON contracts USING GIN (data);

-- Everything in store.js's data object that is not a collection of
-- id-keyed records: the per-collection id counters, the username/reg-no
-- issuance ledgers, and the single settings object. One row, always id=1.
CREATE TABLE IF NOT EXISTS store_meta (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  seq JSONB NOT NULL DEFAULT '{}'::jsonb,
  issued_usernames JSONB NOT NULL DEFAULT '[]'::jsonb,
  issued_regnos JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT store_meta_singleton CHECK (id = 1)
);
