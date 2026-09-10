CREATE TABLE "open_attempts" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "submission_id" INTEGER NOT NULL,
  "request_key" TEXT NOT NULL,
  "track_key" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "pid" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "open_attempts_user_id_request_key_key" ON "open_attempts"("user_id", "request_key");
CREATE INDEX "open_attempts_status_idx" ON "open_attempts"("status");
CREATE INDEX "open_attempts_user_id_track_key_idx" ON "open_attempts"("user_id", "track_key");
-- Prospective guard: historical duplicates must be reviewed, never deleted by migration.
CREATE UNIQUE INDEX "registrations_prospective_unique" ON "registrations" (lower(trim(email)), upper(trim(course_code))) WHERE status->>'dedup_guard' = 'v1';
