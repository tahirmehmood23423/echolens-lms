-- How a ShipLens project reached the organisers: 'portal' (null for older
-- rows) or 'email' when an admin records and grades it on the team's behalf.
ALTER TABLE "event_submissions" ADD COLUMN IF NOT EXISTS "submitted_via" TEXT;
