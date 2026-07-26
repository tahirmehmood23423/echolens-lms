-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "source_track_key" TEXT;

-- AlterTable
ALTER TABLE "event_submissions" ADD COLUMN     "graded_by_ai" BOOLEAN NOT NULL DEFAULT false;

