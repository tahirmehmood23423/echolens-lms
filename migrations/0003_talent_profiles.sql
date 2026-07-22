-- 0003: Talent Marketplace, Phases 2-3 (student hireable profile + projects)
-- Unlike the legacy tables in 0001/0002, these are genuinely new data with
-- no JSON-file history to translate, so they use ordinary relational
-- columns and indexes directly (no JSONB-payload-per-row wrapper). They
-- are looked up by user_id, a plain integer matching the id already
-- assigned to that student in the `users` table (see store.js) - there is
-- no foreign key to `users` because that table lives in a different
-- table-per-collection shape (0001) and, in JSON-file mode, may not be in
-- Postgres at all; the application enforces the relationship instead.
-- These tables therefore only exist/matter when DATABASE_URL is set - see
-- talent.js, which refuses every route with a clear error otherwise.

CREATE TABLE IF NOT EXISTS skills (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_lower TEXT GENERATED ALWAYS AS (lower(name)) STORED,
  source TEXT NOT NULL DEFAULT 'catalogue' CHECK (source IN ('catalogue', 'admin', 'freetext')),
  needs_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS skills_name_lower_uidx ON skills (name_lower);

CREATE TABLE IF NOT EXISTS talent_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  headline TEXT,
  about TEXT,
  city TEXT,
  remote_pref TEXT CHECK (remote_pref IN ('remote', 'onsite', 'hybrid')),
  availability TEXT CHECK (availability IN ('immediately', 'within_month', 'after_graduation', 'not_looking')),
  work_type TEXT[] NOT NULL DEFAULT '{}',
  salary_band TEXT,
  salary_visible BOOLEAN NOT NULL DEFAULT false,
  links JSONB NOT NULL DEFAULT '{}'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  resume_filename TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS talent_profiles_published_idx ON talent_profiles (published);

CREATE TABLE IF NOT EXISTS student_skills (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  skill_id BIGINT NOT NULL REFERENCES skills (id),
  source TEXT NOT NULL DEFAULT 'catalogue' CHECK (source IN ('catalogue', 'freetext')),
  needs_review BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, skill_id)
);
CREATE INDEX IF NOT EXISTS student_skills_user_idx ON student_skills (user_id);
CREATE INDEX IF NOT EXISTS student_skills_skill_idx ON student_skills (skill_id);

CREATE TABLE IF NOT EXISTS projects (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('course', 'manual')),
  verified BOOLEAN NOT NULL DEFAULT false,
  title TEXT NOT NULL,
  summary TEXT,
  description_markdown TEXT,
  tech_stack TEXT[] NOT NULL DEFAULT '{}',
  cover_image TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  repo_url TEXT,
  demo_url TEXT,
  role_played TEXT,
  team_size INT,
  completed_month INT,
  completed_year INT,
  visible BOOLEAN NOT NULL DEFAULT true,
  -- Snapshotted verbatim at publish time from the graded quest submission -
  -- never re-derived later, so it stays accurate even if the course
  -- content, grade, or submission is later changed or removed. NULL for
  -- source='manual'.
  course_name TEXT,
  task_title TEXT,
  instructor_grade NUMERIC,
  submission_date TEXT,
  source_submission_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_user_idx ON projects (user_id);
CREATE INDEX IF NOT EXISTS projects_visible_idx ON projects (visible);
-- A given graded submission can only ever back one published project.
CREATE UNIQUE INDEX IF NOT EXISTS projects_source_submission_uidx ON projects (source_submission_id) WHERE source_submission_id IS NOT NULL;

-- Controlled vocabulary seeded from the course catalogue's actual subject
-- matter (see tracks/*.js) - free-text additions from students land here
-- too, flagged source='freetext', needs_review=true (see talent.js).
INSERT INTO skills (name, source) VALUES
  ('Python', 'catalogue'), ('JavaScript', 'catalogue'), ('TypeScript', 'catalogue'),
  ('HTML', 'catalogue'), ('CSS', 'catalogue'), ('React', 'catalogue'), ('Next.js', 'catalogue'),
  ('Node.js', 'catalogue'), ('SQL', 'catalogue'), ('Power BI', 'catalogue'), ('Excel', 'catalogue'),
  ('NumPy', 'catalogue'), ('Pandas', 'catalogue'), ('Matplotlib', 'catalogue'), ('scikit-learn', 'catalogue'),
  ('Machine Learning', 'catalogue'), ('Data Analysis', 'catalogue'), ('Data Structures', 'catalogue'),
  ('Algorithms', 'catalogue'), ('C', 'catalogue'), ('C++', 'catalogue'), ('Java', 'catalogue'),
  ('Git', 'catalogue'), ('GitHub', 'catalogue'), ('Prompt Engineering', 'catalogue'),
  ('ChatGPT', 'catalogue'), ('Claude', 'catalogue'), ('AI Automation', 'catalogue'), ('n8n', 'catalogue'),
  ('Make.com', 'catalogue'), ('Graphic Design', 'catalogue'), ('Canva', 'catalogue'),
  ('UI/UX Design', 'catalogue'), ('Video Editing', 'catalogue'), ('Content Writing', 'catalogue'),
  ('Digital Marketing', 'catalogue'), ('Freelancing', 'catalogue'), ('Flutter', 'catalogue'),
  ('WordPress', 'catalogue'), ('Networking', 'catalogue'), ('Cybersecurity', 'catalogue'),
  ('Cloud Computing', 'catalogue'), ('Regex', 'catalogue'), ('Linux', 'catalogue'),
  ('Web Development', 'catalogue')
ON CONFLICT (name_lower) DO NOTHING;
