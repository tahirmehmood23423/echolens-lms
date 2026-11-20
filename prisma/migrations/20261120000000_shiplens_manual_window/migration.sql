-- ShipLens competition window is now set manually by an admin, independent
-- of the registration close. Same raw "YYYY-MM-DDTHH:MM" text shape.
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "shiplens_task_opens_at" TEXT;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "shiplens_results_due_at" TEXT;
