ALTER TABLE "event_submissions" ADD COLUMN IF NOT EXISTS "render_link" TEXT;
ALTER TABLE "event_submissions" ADD COLUMN IF NOT EXISTS "vercel_link" TEXT;
