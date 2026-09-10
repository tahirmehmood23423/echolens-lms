-- Legacy JSONB store only. Normalized deployments use the Prisma migration instead.
CREATE TABLE IF NOT EXISTS open_attempts (id INTEGER PRIMARY KEY, data JSONB NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS open_attempts_request_unique ON open_attempts ((data->>'user_id'), (data->>'request_key'));
CREATE UNIQUE INDEX IF NOT EXISTS registrations_prospective_unique ON registrations (lower(trim(data->>'email')), upper(trim(data->>'course_code'))) WHERE data->'status'->>'dedup_guard' = 'v1';
