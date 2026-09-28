ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "series_kind" TEXT;
ALTER TABLE "event_entries" ADD COLUMN IF NOT EXISTS "team_details" JSONB;
ALTER TABLE "event_entries" ADD COLUMN IF NOT EXISTS "challenge_pid" INTEGER;
ALTER TABLE "event_entries" ADD COLUMN IF NOT EXISTS "registration_id" INTEGER;
ALTER TABLE "event_submissions" ADD COLUMN IF NOT EXISTS "github_link" TEXT;
ALTER TABLE "event_submissions" ADD COLUMN IF NOT EXISTS "deployment_link" TEXT;
