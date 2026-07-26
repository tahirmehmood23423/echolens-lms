-- AlterTable
ALTER TABLE "certificates" DROP COLUMN "source_id",
ADD COLUMN     "source_id" INTEGER;

-- AlterTable
ALTER TABLE "event_submissions" DROP COLUMN "graded_by",
ADD COLUMN     "graded_by" INTEGER;

