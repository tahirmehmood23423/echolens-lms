-- 0005: Talent Marketplace, Phase 5 (contact gating, shortlists, messaging)

CREATE TABLE IF NOT EXISTS contact_requests (
  id BIGSERIAL PRIMARY KEY,
  recruiter_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS contact_requests_recruiter_idx ON contact_requests (recruiter_id);
CREATE INDEX IF NOT EXISTS contact_requests_student_idx ON contact_requests (student_id);
CREATE INDEX IF NOT EXISTS contact_requests_created_idx ON contact_requests (created_at);
-- One ACTIVE (not yet declined) request per recruiter/student pair - a
-- declined request doesn't block trying again later.
CREATE UNIQUE INDEX IF NOT EXISTS contact_requests_active_uidx ON contact_requests (recruiter_id, student_id) WHERE status <> 'declined';

-- Written once, on accept, and never updated again - the permanent audit
-- record spelled out in the spec (recruiter id, student id, timestamp,
-- message), independent of whatever later happens to the request row.
CREATE TABLE IF NOT EXISTS contact_reveals (
  id BIGSERIAL PRIMARY KEY,
  contact_request_id BIGINT NOT NULL,
  recruiter_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_reveals_recruiter_idx ON contact_reveals (recruiter_id);
CREATE INDEX IF NOT EXISTS contact_reveals_student_idx ON contact_reveals (student_id);

CREATE TABLE IF NOT EXISTS shortlists (
  id BIGSERIAL PRIMARY KEY,
  recruiter_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS shortlists_recruiter_idx ON shortlists (recruiter_id);

CREATE TABLE IF NOT EXISTS shortlist_candidates (
  id BIGSERIAL PRIMARY KEY,
  shortlist_id BIGINT NOT NULL REFERENCES shortlists (id) ON DELETE CASCADE,
  student_id BIGINT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (shortlist_id, student_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  contact_request_id BIGINT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('recruiter', 'student')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_thread_idx ON messages (contact_request_id, created_at);

CREATE TABLE IF NOT EXISTS blocked_companies (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  company_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, company_id)
);
CREATE INDEX IF NOT EXISTS blocked_companies_student_idx ON blocked_companies (student_id);
