-- 0002: Talent Marketplace, Phase 1 (recruiter role and verification)
-- Same id + JSONB-payload pattern as 0001 - see that file's header for why.
-- Recruiter accounts themselves are NOT a new table: a recruiter is a row
-- in the existing `users` table with role='recruiter', so the app's
-- existing auth (JWT cookie, /api/auth/login, role-check middleware) just
-- works for them unchanged. These two tables hold what genuinely doesn't
-- fit a user record: the shared company a recruiter_seats group of
-- recruiters belongs to, and a generic audit trail (recruiter approvals
-- today; contact reveals, unpublish and admin overrides in later phases).

CREATE TABLE IF NOT EXISTS companies (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS companies_data_gin ON companies USING GIN (data);
-- One company per work-email domain - this is the "recruiter_seats" link:
-- every recruiter whose work email shares a domain attaches to the same
-- company row instead of creating a duplicate.
CREATE UNIQUE INDEX IF NOT EXISTS companies_domain_uidx ON companies ((data->>'domain'));

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_data_gin ON audit_log USING GIN (data);
