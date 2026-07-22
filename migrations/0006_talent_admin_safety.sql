-- 0006: Talent Marketplace, Phase 6 (admin, safety, analytics)

ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS unpublished_reason TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id BIGINT,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile', 'project')),
  target_id BIGINT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by BIGINT
);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
