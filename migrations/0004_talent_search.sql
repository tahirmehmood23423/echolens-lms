-- 0004: Talent Marketplace, Phase 4 (search and filtering)
--
-- Free text: a generated tsvector + GIN index on talent_profiles
-- (headline/about) and on projects (title/summary/tech_stack) separately -
-- Postgres GENERATED columns can only reference their own table, and a
-- profile's searchable text genuinely spans two tables, so the search
-- query below unions both rather than faking a single generated column.
--
-- Skills: talent_profiles.skill_ids is a denormalized BIGINT[] mirror of
-- student_skills, kept in sync by a trigger (not application code, so it
-- can never drift) - this is what "a normalised student_skills join table
-- with a GIN index" becomes in practice: the join table stays the source
-- of truth for CRUD, this array is purely a query-performance cache with
-- its own GIN index for fast @>/&& (AND/OR) skill filtering.
--
-- Gems/level/completed-courses/certificates live in the legacy store
-- (JSON file or JSONB-blob tables, never plain relational Postgres - see
-- store.js), which cannot be joined against in a single SQL query or
-- keyset-paginated over. talent.js's refreshSearchCache() mirrors exactly
-- these fields into the columns below whenever they plausibly changed
-- (profile fetch, course-project publish) and on a periodic sweep - see
-- the Phase 4 summary for the staleness trade-off this implies. Every
-- other filter (skills, city, remote, availability, work type, verified
-- projects, education/grad year) is genuinely live, since that data is
-- already in Postgres.

ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(headline, '') || ' ' || coalesce(about, ''))) STORED;
CREATE INDEX IF NOT EXISTS talent_profiles_search_idx ON talent_profiles USING GIN (search_vector);

ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS skill_ids BIGINT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS talent_profiles_skill_ids_gin ON talent_profiles USING GIN (skill_ids);

ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS gems_cache INT NOT NULL DEFAULT 0;
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS level_cache TEXT;
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS completed_course_titles TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS certificate_titles TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS talent_profiles_gems_idx ON talent_profiles (gems_cache);
CREATE INDEX IF NOT EXISTS talent_profiles_completed_courses_gin ON talent_profiles USING GIN (completed_course_titles);
CREATE INDEX IF NOT EXISTS talent_profiles_certs_gin ON talent_profiles USING GIN (certificate_titles);

-- Postgres's built-in array_to_string() is marked STABLE (not IMMUTABLE),
-- so it cannot appear in a STORED generated column expression even though
-- a plain space-join of a text[] is deterministic in practice - this
-- thin wrapper just re-declares that fact.
CREATE OR REPLACE FUNCTION immutable_array_to_string(text[], text) RETURNS text AS
$$ SELECT array_to_string($1, $2); $$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || immutable_array_to_string(tech_stack, ' '))) STORED;
CREATE INDEX IF NOT EXISTS projects_search_idx ON projects USING GIN (search_vector);

CREATE TABLE IF NOT EXISTS saved_searches (
  id BIGSERIAL PRIMARY KEY,
  recruiter_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  notify_weekly BOOLEAN NOT NULL DEFAULT false,
  last_notified_at TIMESTAMPTZ,
  last_result_ids BIGINT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_searches_recruiter_idx ON saved_searches (recruiter_id);

-- Every search run is logged (recruiter_id nullable so nothing else ever
-- has to change if search is opened up later) - this is what Phase 6's
-- "searches run" and "top searched skills" dashboard tiles read from.
CREATE TABLE IF NOT EXISTS search_log (
  id BIGSERIAL PRIMARY KEY,
  recruiter_id BIGINT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS search_log_created_idx ON search_log (created_at);

CREATE OR REPLACE FUNCTION sync_talent_profile_skill_ids() RETURNS trigger AS $$
DECLARE
  target_user_id BIGINT;
BEGIN
  target_user_id := COALESCE(NEW.user_id, OLD.user_id);
  UPDATE talent_profiles
  SET skill_ids = COALESCE((SELECT array_agg(skill_id ORDER BY skill_id) FROM student_skills WHERE user_id = target_user_id), '{}')
  WHERE user_id = target_user_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS student_skills_sync_ids ON student_skills;
CREATE TRIGGER student_skills_sync_ids
AFTER INSERT OR UPDATE OR DELETE ON student_skills
FOR EACH ROW EXECUTE FUNCTION sync_talent_profile_skill_ids();

-- The trigger only fires on future changes - any student_skills rows
-- already there from before this migration (Phase 2 shipped first) need
-- a one-time backfill or their skill_ids stays '{}' until they next
-- add/remove a skill.
UPDATE talent_profiles tp
SET skill_ids = COALESCE((SELECT array_agg(skill_id ORDER BY skill_id) FROM student_skills WHERE user_id = tp.user_id), '{}');
