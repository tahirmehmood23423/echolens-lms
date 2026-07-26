-- DropForeignKey
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_session_id_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "override_requested" DROP NOT NULL,
ALTER COLUMN "override_requested" DROP DEFAULT;

-- AlterTable
ALTER TABLE "certificates" ALTER COLUMN "detail" DROP NOT NULL,
ALTER COLUMN "detail" DROP DEFAULT,
ALTER COLUMN "concepts" DROP NOT NULL,
ALTER COLUMN "concepts" DROP DEFAULT;

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "class_id" INTEGER,
ALTER COLUMN "session_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "course_messages" ALTER COLUMN "mentions" DROP NOT NULL,
ALTER COLUMN "mentions" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

