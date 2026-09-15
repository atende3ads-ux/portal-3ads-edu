-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('invited', 'active', 'blocked');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('agency', 'client', 'partner');

-- CreateEnum
CREATE TYPE "OrganizationStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('admin', 'ops', 'trainer', 'client_focal', 'client_learner');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('training', 'consulting', 'mentoring', 'lecture', 'hybrid');

-- CreateEnum
CREATE TYPE "ProjectFormat" AS ENUM ('online', 'in_person', 'hybrid');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled', 'archived');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('not_started', 'in_progress', 'waiting_client', 'waiting_3ads', 'blocked', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "ActivityPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TimeEntryType" AS ENUM ('class_hour', 'preparation', 'meeting', 'material_production', 'backoffice');

-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('running', 'submitted', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "TimeEntrySource" AS ENUM ('timer', 'manual');

-- CreateEnum
CREATE TYPE "UpdateType" AS ENUM ('note', 'class_report', 'decision', 'alert');

-- CreateEnum
CREATE TYPE "UpdateVisibility" AS ENUM ('internal', 'published');

-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('document', 'image', 'video', 'link');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('private', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "NoticeAudience" AS ENUM ('all', 'trainers', 'clients', 'project');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('draft', 'scheduled', 'published', 'expired');

-- CreateEnum
CREATE TYPE "FeedbackTarget" AS ENUM ('project', 'agency');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('new', 'triaged', 'assigned', 'resolved');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" UUID,
    "anonymized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_seen_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "document" TEXT,
    "status" "OrganizationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "invites" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "MemberRole" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "project_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "client_organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "format" "ProjectFormat" NOT NULL,
    "description" TEXT,
    "scope" TEXT,
    "objectives" TEXT,
    "deliverables" TEXT,
    "notes" TEXT,
    "planned_hours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "start_date" DATE,
    "end_date" DATE,
    "status" "ProjectStatus" NOT NULL DEFAULT 'draft',
    "current_stage" TEXT,
    "client_focal_user_id" UUID,
    "created_by" UUID NOT NULL,
    "completed_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MemberRole" NOT NULL,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responsibility" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stages" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "start_date" DATE,
    "end_date" DATE,

    CONSTRAINT "stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "stage_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'not_started',
    "priority" "ActivityPriority" NOT NULL DEFAULT 'medium',
    "owner_user_id" UUID,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_entries" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "activity_id" UUID,
    "user_id" UUID NOT NULL,
    "type" "TimeEntryType" NOT NULL,
    "description" TEXT,
    "observation" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "source" "TimeEntrySource" NOT NULL DEFAULT 'manual',
    "status" "TimeEntryStatus" NOT NULL DEFAULT 'submitted',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "updates" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "activity_id" UUID,
    "author_user_id" UUID NOT NULL,
    "type" "UpdateType" NOT NULL DEFAULT 'note',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "observation" TEXT,
    "visibility" "UpdateVisibility" NOT NULL DEFAULT 'internal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "activity_id" UUID,
    "update_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL,
    "mime_type" TEXT,
    "size_bytes" BIGINT,
    "storage_key" TEXT,
    "link_url" TEXT,
    "status" "MaterialStatus" NOT NULL DEFAULT 'private',
    "downloadable" BOOLEAN NOT NULL DEFAULT true,
    "scan_status" TEXT DEFAULT 'pending',
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience_type" "NoticeAudience" NOT NULL DEFAULT 'all',
    "project_id" UUID,
    "image_url" TEXT,
    "link_url" TEXT,
    "publish_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" "NoticeStatus" NOT NULL DEFAULT 'draft',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "author_user_id" UUID NOT NULL,
    "audience_role" "MemberRole" NOT NULL,
    "target" "FeedbackTarget" NOT NULL DEFAULT 'project',
    "score" INTEGER,
    "message" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'new',
    "topic" TEXT,
    "assigned_to" UUID,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "context" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "invites_email_idx" ON "invites"("email");

-- CreateIndex
CREATE INDEX "invites_expires_at_idx" ON "invites"("expires_at");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_client_organization_id_idx" ON "projects"("client_organization_id");

-- CreateIndex
CREATE INDEX "project_members_user_id_removed_at_idx" ON "project_members"("user_id", "removed_at");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_project_id_user_id_key" ON "project_members"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "stages_project_id_position_key" ON "stages"("project_id", "position");

-- CreateIndex
CREATE INDEX "activities_project_id_status_idx" ON "activities"("project_id", "status");

-- CreateIndex
CREATE INDEX "activities_owner_user_id_idx" ON "activities"("owner_user_id");

-- CreateIndex
CREATE INDEX "time_entries_project_id_status_idx" ON "time_entries"("project_id", "status");

-- CreateIndex
CREATE INDEX "time_entries_user_id_started_at_idx" ON "time_entries"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "updates_project_id_created_at_idx" ON "updates"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "updates_project_id_visibility_idx" ON "updates"("project_id", "visibility");

-- CreateIndex
CREATE INDEX "materials_project_id_status_idx" ON "materials"("project_id", "status");

-- CreateIndex
CREATE INDEX "notices_status_publish_at_idx" ON "notices"("status", "publish_at");

-- CreateIndex
CREATE INDEX "feedbacks_project_id_status_idx" ON "feedbacks"("project_id", "status");

-- CreateIndex
CREATE INDEX "feedbacks_status_created_at_idx" ON "feedbacks"("status", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_organization_id_fkey" FOREIGN KEY ("client_organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_focal_user_id_fkey" FOREIGN KEY ("client_focal_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stages" ADD CONSTRAINT "stages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "updates" ADD CONSTRAINT "updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "updates" ADD CONSTRAINT "updates_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "updates" ADD CONSTRAINT "updates_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "updates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
