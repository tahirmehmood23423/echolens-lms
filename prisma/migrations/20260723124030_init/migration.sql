-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "reg_no" TEXT,
    "password_hash" TEXT,
    "profile" JSONB NOT NULL DEFAULT '{}',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "best_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL,
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "signature" TEXT,
    "google_sub" TEXT,
    "is_deleted_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "company_id" INTEGER,
    "designation" TEXT,
    "city" TEXT,
    "hiring_note" TEXT,
    "status" TEXT,
    "status_reason" TEXT,
    "override_requested" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,
    "approved_by" INTEGER,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issued_usernames" (
    "value" TEXT NOT NULL,

    CONSTRAINT "issued_usernames_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "issued_regnos" (
    "value" TEXT NOT NULL,

    CONSTRAINT "issued_regnos_pkey" PRIMARY KEY ("value")
);

-- CreateTable
CREATE TABLE "seq" (
    "name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,

    CONSTRAINT "seq_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "size_band" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" INTEGER,
    "detail" JSONB,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "tier" TEXT,
    "level" TEXT,
    "weeks" INTEGER,
    "hours" DOUBLE PRECISION,
    "price_pkr" INTEGER,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "badges" JSONB,
    "free_mode" TEXT,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "instructor_ids" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "is_deleted_placeholder" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "week_no" INTEGER,
    "title" TEXT NOT NULL,
    "session_date" TEXT NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "room" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "started_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quests" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "track_key" TEXT NOT NULL,
    "no" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "session" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "problems" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "deadline" TEXT,

    CONSTRAINT "quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quest_submissions" (
    "id" SERIAL NOT NULL,
    "quest_id" INTEGER NOT NULL,
    "pid" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_url" TEXT,
    "note" TEXT,
    "grade" INTEGER,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "graded_at" TIMESTAMP(3),
    "graded_by" INTEGER,
    "code" TEXT,
    "language" TEXT,
    "ai_review" JSONB,
    "review_shared" BOOLEAN,
    "review_shared_at" TIMESTAMP(3),
    "late" BOOLEAN,
    "integrity" JSONB,
    "late_deduction" INTEGER,

    CONSTRAINT "quest_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "open_submissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "track_key" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "pid" INTEGER NOT NULL,
    "problem_title" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "code" TEXT,
    "language" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "score" INTEGER,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "feedback" TEXT,
    "graded_at" TIMESTAMP(3),
    "attempts" INTEGER,
    "files" JSONB,

    CONSTRAINT "open_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gem_events" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "note" TEXT,
    "by" INTEGER,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gem_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" SERIAL NOT NULL,
    "serial" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "student_name" TEXT NOT NULL,
    "reg_no" TEXT NOT NULL,
    "batch_id" INTEGER,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "completion_date" TEXT NOT NULL,
    "instructor_name" TEXT,
    "instructor_sig" TEXT,
    "issued_by" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "concepts" JSONB NOT NULL DEFAULT '[]',
    "final_project" TEXT,
    "source_kind" TEXT,
    "source_id" TEXT,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_classes" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "started_by" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "date" TEXT NOT NULL,

    CONSTRAINT "live_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "last_seen" TIMESTAMP(3),

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_messages" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "staff_role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "mentions" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "course_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_reads" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER,
    "author_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_announcements" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "link_label" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_reports" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "batch_id" INTEGER,
    "scope" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "by" INTEGER NOT NULL,

    CONSTRAINT "ai_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "entry" TEXT NOT NULL,
    "fee_pkr" INTEGER NOT NULL,
    "pay_instructions" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "deadline" TEXT,
    "duration_minutes" INTEGER,
    "pass_mark" INTEGER NOT NULL DEFAULT 0,
    "auto_grade" BOOLEAN NOT NULL DEFAULT false,
    "auto_certificate" BOOLEAN NOT NULL DEFAULT false,
    "compiler" TEXT,
    "dataset_url" TEXT,
    "files" JSONB NOT NULL DEFAULT '[]',
    "problems" JSONB NOT NULL DEFAULT '[]',
    "prizes" JSONB NOT NULL DEFAULT '{}',
    "meeting_link" TEXT,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_entries" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "reg_no" TEXT,
    "tier" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL,
    "payment_shot" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_submissions" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "entry_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "pid" INTEGER,
    "code" TEXT,
    "language" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "link" TEXT,
    "note" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "ai_score" INTEGER,
    "score" INTEGER,
    "ai_feedback" TEXT,
    "graded_by" TEXT,
    "graded_at" TIMESTAMP(3),
    "certified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "event_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_comments" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "source" TEXT NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "city" TEXT,
    "course_code" TEXT,
    "course_title" TEXT,
    "note" TEXT,
    "status" JSONB NOT NULL,
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "payment_stage" TEXT NOT NULL,
    "discount_category_id" INTEGER,
    "challan_serial" TEXT,
    "enrolled_user_id" INTEGER,
    "enrolled_batch_id" INTEGER,
    "cleared_by" INTEGER,
    "cleared_at" TIMESTAMP(3),
    "ambassador_code" TEXT,
    "ambassador_name" TEXT,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challans" (
    "id" SERIAL NOT NULL,
    "serial" TEXT NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "course_code" TEXT,
    "course_title" TEXT NOT NULL,
    "student_name" TEXT NOT NULL,
    "student_email" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "gross_fee" INTEGER NOT NULL,
    "fee_parts" JSONB NOT NULL,
    "discount_category_id" INTEGER,
    "discounts" JSONB NOT NULL,
    "discount_label" TEXT,
    "discount_amount" INTEGER NOT NULL,
    "net_fee" INTEGER NOT NULL,
    "deadline" TEXT,
    "bank_snapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "generated_by" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "paid_confirmed_by" INTEGER,
    "paid_confirmed_at" TIMESTAMP(3),

    CONSTRAINT "challans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "added_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_records" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "employment_type" TEXT NOT NULL,
    "group_id" INTEGER,
    "status" TEXT NOT NULL,
    "joined_at" TEXT NOT NULL,
    "instructions" JSONB NOT NULL,
    "follow_ups" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_groups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "head_user_id" INTEGER,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_members" (
    "id" SERIAL NOT NULL,
    "department_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "added_by" INTEGER,
    "added_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_tasks" (
    "id" SERIAL NOT NULL,
    "department_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "attachment" JSONB,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_task_status" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "proof_attachment" JSONB,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "department_task_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_announcements" (
    "id" SERIAL NOT NULL,
    "department_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinator_queries" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "student_name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coordinator_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "pdf_filename" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "deadline_at" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "submission_zip_filename" TEXT,
    "offer_letter_filename" TEXT,
    "offer_letter_sent_at" TIMESTAMP(3),

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassadors" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "university" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassadors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_gem_events" (
    "id" SERIAL NOT NULL,
    "ambassador_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "course_tier" TEXT,
    "registration_id" INTEGER,
    "batch_id" INTEGER,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_gem_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_duties" (
    "id" SERIAL NOT NULL,
    "ambassador_id" INTEGER,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "due_at" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_duties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_duty_status" (
    "id" SERIAL NOT NULL,
    "duty_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_duty_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambassador_reports" (
    "id" SERIAL NOT NULL,
    "ambassador_id" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "student_count" INTEGER NOT NULL,
    "total_paid" INTEGER NOT NULL,
    "total_commission" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambassador_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "job_type" TEXT NOT NULL,
    "experience_level" TEXT,
    "salary_range" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "apply_url" TEXT,
    "apply_email" TEXT,
    "deadline" TEXT,
    "status" TEXT NOT NULL,
    "posted_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_comments" (
    "id" SERIAL NOT NULL,
    "job_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "user_avatar" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "week_no" INTEGER,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'resource',
    "url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TEXT,
    "points" INTEGER NOT NULL DEFAULT 100,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "file_url" TEXT,
    "note" TEXT,
    "grade" INTEGER,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "graded_at" TIMESTAMP(3),
    "graded_by" INTEGER,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'Beginner',
    "gems" INTEGER NOT NULL,
    "due_date" TEXT,
    "open" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenge_submissions" (
    "id" SERIAL NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "remarks" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" INTEGER,

    CONSTRAINT "challenge_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathons" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "theme" TEXT,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'solo',
    "team_max" INTEGER NOT NULL DEFAULT 4,
    "entry" TEXT NOT NULL DEFAULT 'free',
    "fee_pkr" INTEGER NOT NULL DEFAULT 0,
    "pay_instructions" TEXT,
    "prizes" JSONB NOT NULL,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_entries" (
    "id" SERIAL NOT NULL,
    "hackathon_id" INTEGER NOT NULL,
    "team_name" TEXT NOT NULL,
    "member_ids" JSONB NOT NULL,
    "registered_by" INTEGER NOT NULL,
    "payment_status" TEXT NOT NULL,
    "payment_ref" TEXT,
    "payment_by" INTEGER,
    "registered_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hackathon_submissions" (
    "id" SERIAL NOT NULL,
    "hackathon_id" INTEGER NOT NULL,
    "entry_id" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "note" TEXT,
    "score" INTEGER,
    "remarks" TEXT,
    "judged_by" INTEGER,
    "judged_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" SERIAL NOT NULL,
    "batch_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "allow_ide" BOOLEAN NOT NULL DEFAULT false,
    "opened_at" TIMESTAMP(3),
    "closes_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "correct" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "score_pct" INTEGER NOT NULL,
    "gems" INTEGER NOT NULL,
    "taken_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_files" (
    "id" SERIAL NOT NULL,
    "quest_id" INTEGER NOT NULL,
    "pid" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_reg_no_key" ON "users"("reg_no");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "companies_domain_key" ON "companies"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "batches_code_key" ON "batches"("code");

-- CreateIndex
CREATE INDEX "batches_course_id_idx" ON "batches"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_batch_id_key" ON "enrollments"("user_id", "batch_id");

-- CreateIndex
CREATE INDEX "quests_batch_id_track_key_idx" ON "quests"("batch_id", "track_key");

-- CreateIndex
CREATE INDEX "quest_submissions_user_id_idx" ON "quest_submissions"("user_id");

-- CreateIndex
CREATE INDEX "quest_submissions_quest_id_pid_idx" ON "quest_submissions"("quest_id", "pid");

-- CreateIndex
CREATE INDEX "open_submissions_user_id_track_key_idx" ON "open_submissions"("user_id", "track_key");

-- CreateIndex
CREATE INDEX "gem_events_user_id_idx" ON "gem_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_serial_key" ON "certificates"("serial");

-- CreateIndex
CREATE INDEX "certificates_reg_no_idx" ON "certificates"("reg_no");

-- CreateIndex
CREATE INDEX "attendance_user_id_idx" ON "attendance"("user_id");

-- CreateIndex
CREATE INDEX "course_messages_batch_id_created_at_idx" ON "course_messages"("batch_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "chat_reads_user_id_batch_id_key" ON "chat_reads"("user_id", "batch_id");

-- CreateIndex
CREATE INDEX "event_entries_event_id_idx" ON "event_entries"("event_id");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "leads"("email");

-- CreateIndex
CREATE INDEX "registrations_email_idx" ON "registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "challans_serial_key" ON "challans"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "staff_records_user_id_key" ON "staff_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_members_department_id_user_id_key" ON "department_members"("department_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_user_id_key" ON "ambassadors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ambassadors_code_key" ON "ambassadors"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quests" ADD CONSTRAINT "quests_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_submissions" ADD CONSTRAINT "quest_submissions_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_submissions" ADD CONSTRAINT "quest_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_submissions" ADD CONSTRAINT "quest_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "open_submissions" ADD CONSTRAINT "open_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gem_events" ADD CONSTRAINT "gem_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gem_events" ADD CONSTRAINT "gem_events_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_classes" ADD CONSTRAINT "live_classes_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entries" ADD CONSTRAINT "event_entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_entries" ADD CONSTRAINT "event_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "event_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_submissions" ADD CONSTRAINT "event_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_comments" ADD CONSTRAINT "event_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_discount_category_id_fkey" FOREIGN KEY ("discount_category_id") REFERENCES "discount_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challans" ADD CONSTRAINT "challans_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challans" ADD CONSTRAINT "challans_discount_category_id_fkey" FOREIGN KEY ("discount_category_id") REFERENCES "discount_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_records" ADD CONSTRAINT "staff_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_records" ADD CONSTRAINT "staff_records_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "staff_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_members" ADD CONSTRAINT "department_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_tasks" ADD CONSTRAINT "department_tasks_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_task_status" ADD CONSTRAINT "department_task_status_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "department_tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_announcements" ADD CONSTRAINT "department_announcements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_gem_events" ADD CONSTRAINT "ambassador_gem_events_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "ambassadors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_gem_events" ADD CONSTRAINT "ambassador_gem_events_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_gem_events" ADD CONSTRAINT "ambassador_gem_events_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_duties" ADD CONSTRAINT "ambassador_duties_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "ambassadors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_duty_status" ADD CONSTRAINT "ambassador_duty_status_duty_id_fkey" FOREIGN KEY ("duty_id") REFERENCES "ambassador_duties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ambassador_reports" ADD CONSTRAINT "ambassador_reports_ambassador_id_fkey" FOREIGN KEY ("ambassador_id") REFERENCES "ambassadors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_comments" ADD CONSTRAINT "job_comments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_comments" ADD CONSTRAINT "job_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "challenge_submissions" ADD CONSTRAINT "challenge_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_entries" ADD CONSTRAINT "hackathon_entries_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "hackathons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hackathon_submissions" ADD CONSTRAINT "hackathon_submissions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "hackathon_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_files" ADD CONSTRAINT "task_files_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "quests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

