-- Bring the existing public-feedback JSONB table into the normalized Prisma
-- runtime. IF NOT EXISTS keeps this compatible with installations that
-- already created the same table through migrations/0007_feedback.sql.
CREATE TABLE IF NOT EXISTS "feedback" (
  "id" BIGINT NOT NULL,
  "data" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "feedback_data_gin" ON "feedback" USING GIN ("data");
