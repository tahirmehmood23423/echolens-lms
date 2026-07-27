-- CreateTable
CREATE TABLE "showcase_posts" (
    "id" SERIAL NOT NULL,
    "author_user_id" INTEGER NOT NULL,
    "caption" TEXT NOT NULL,
    "quest_submission_id" INTEGER,
    "course_id" INTEGER,
    "batch_id" INTEGER,
    "visibility" TEXT NOT NULL DEFAULT 'BATCH',
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "removed_at" TIMESTAMP(3),
    "removed_by_user_id" INTEGER,
    "removal_reason" TEXT,

    CONSTRAINT "showcase_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_images" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "r2_key" TEXT NOT NULL,
    "thumb_key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "byte_size" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL,

    CONSTRAINT "showcase_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_likes" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showcase_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_comments" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "author_user_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL,
    "removed_at" TIMESTAMP(3),
    "removed_by_user_id" INTEGER,

    CONSTRAINT "showcase_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showcase_reports" (
    "id" SERIAL NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER NOT NULL,
    "reporter_user_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolved_by_user_id" INTEGER,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "showcase_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "showcase_posts_status_created_at_idx" ON "showcase_posts"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "showcase_posts_author_user_id_idx" ON "showcase_posts"("author_user_id");

-- CreateIndex
CREATE INDEX "showcase_images_post_id_idx" ON "showcase_images"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "showcase_likes_post_id_user_id_key" ON "showcase_likes"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "showcase_comments_post_id_created_at_idx" ON "showcase_comments"("post_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "showcase_reports_target_type_target_id_reporter_user_id_key" ON "showcase_reports"("target_type", "target_id", "reporter_user_id");

-- AddForeignKey
ALTER TABLE "showcase_posts" ADD CONSTRAINT "showcase_posts_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_posts" ADD CONSTRAINT "showcase_posts_quest_submission_id_fkey" FOREIGN KEY ("quest_submission_id") REFERENCES "quest_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_posts" ADD CONSTRAINT "showcase_posts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_posts" ADD CONSTRAINT "showcase_posts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_images" ADD CONSTRAINT "showcase_images_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "showcase_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_likes" ADD CONSTRAINT "showcase_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "showcase_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_likes" ADD CONSTRAINT "showcase_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_comments" ADD CONSTRAINT "showcase_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "showcase_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_comments" ADD CONSTRAINT "showcase_comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showcase_reports" ADD CONSTRAINT "showcase_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: gem_events predates this migration (see the init migration) -
-- both columns are nullable with no default, so this is metadata-only in
-- Postgres (no table rewrite, no row touched). Every existing gem_events
-- row gets NULL/NULL for these two, which is exactly what the unique index
-- below needs: Postgres never treats two NULLs as equal in a unique index,
-- so 2,242 existing rows all sharing NULL/NULL causes no conflict.
ALTER TABLE "gem_events" ADD COLUMN "reference_type" TEXT;
ALTER TABLE "gem_events" ADD COLUMN "reference_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "gem_events_user_id_reference_type_reference_id_key" ON "gem_events"("user_id", "reference_type", "reference_id");
