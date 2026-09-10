ALTER TABLE open_submissions
  ADD COLUMN IF NOT EXISTS assessment_kind TEXT NOT NULL DEFAULT 'assignment',
  ADD COLUMN IF NOT EXISTS evidence JSONB;

