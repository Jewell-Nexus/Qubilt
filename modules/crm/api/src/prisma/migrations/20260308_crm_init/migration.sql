-- CRM Module Migration
-- Creates all CRM tables: contacts, pipelines, stages, deals, activities, notes

-- Enums
DO $$ BEGIN
  CREATE TYPE "ContactType" AS ENUM ('PERSON', 'ORGANIZATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'DEADLINE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Contacts
CREATE TABLE IF NOT EXISTS "crm_contacts" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "type" "ContactType" NOT NULL DEFAULT 'PERSON',
  "firstName" VARCHAR(255),
  "lastName" VARCHAR(255),
  "email" VARCHAR(255),
  "phone" VARCHAR(50),
  "jobTitle" VARCHAR(255),
  "company" VARCHAR(255),
  "organizationId" TEXT,
  "ownerId" TEXT NOT NULL,
  "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "customData" JSONB,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_contacts_workspaceId_idx" ON "crm_contacts"("workspaceId");
CREATE INDEX IF NOT EXISTS "crm_contacts_organizationId_idx" ON "crm_contacts"("organizationId");
CREATE INDEX IF NOT EXISTS "crm_contacts_ownerId_idx" ON "crm_contacts"("ownerId");
CREATE INDEX IF NOT EXISTS "crm_contacts_email_idx" ON "crm_contacts"("email");

ALTER TABLE "crm_contacts"
  ADD CONSTRAINT "crm_contacts_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "crm_contacts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Pipelines
CREATE TABLE IF NOT EXISTS "crm_pipelines" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_pipelines_workspaceId_idx" ON "crm_pipelines"("workspaceId");

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS "crm_pipeline_stages" (
  "id" TEXT NOT NULL,
  "pipelineId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "probability" INTEGER NOT NULL DEFAULT 0,
  "color" VARCHAR(20),
  "isWon" BOOLEAN NOT NULL DEFAULT false,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "crm_pipeline_stages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_pipeline_stages_pipelineId_idx" ON "crm_pipeline_stages"("pipelineId");

ALTER TABLE "crm_pipeline_stages"
  ADD CONSTRAINT "crm_pipeline_stages_pipelineId_fkey"
  FOREIGN KEY ("pipelineId") REFERENCES "crm_pipelines"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Deals
CREATE TABLE IF NOT EXISTS "crm_deals" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "pipelineId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "value" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
  "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
  "expectedCloseDate" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "ownerId" TEXT NOT NULL,
  "customData" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_deals_workspaceId_idx" ON "crm_deals"("workspaceId");
CREATE INDEX IF NOT EXISTS "crm_deals_pipelineId_idx" ON "crm_deals"("pipelineId");
CREATE INDEX IF NOT EXISTS "crm_deals_stageId_idx" ON "crm_deals"("stageId");
CREATE INDEX IF NOT EXISTS "crm_deals_contactId_idx" ON "crm_deals"("contactId");
CREATE INDEX IF NOT EXISTS "crm_deals_ownerId_idx" ON "crm_deals"("ownerId");
CREATE INDEX IF NOT EXISTS "crm_deals_status_idx" ON "crm_deals"("status");

ALTER TABLE "crm_deals"
  ADD CONSTRAINT "crm_deals_pipelineId_fkey"
  FOREIGN KEY ("pipelineId") REFERENCES "crm_pipelines"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "crm_deals"
  ADD CONSTRAINT "crm_deals_stageId_fkey"
  FOREIGN KEY ("stageId") REFERENCES "crm_pipeline_stages"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "crm_deals"
  ADD CONSTRAINT "crm_deals_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Activities
CREATE TABLE IF NOT EXISTS "crm_activities" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "type" "ActivityType" NOT NULL,
  "subject" VARCHAR(500) NOT NULL,
  "description" TEXT,
  "contactId" TEXT,
  "dealId" TEXT,
  "userId" TEXT NOT NULL,
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_activities_workspaceId_idx" ON "crm_activities"("workspaceId");
CREATE INDEX IF NOT EXISTS "crm_activities_contactId_idx" ON "crm_activities"("contactId");
CREATE INDEX IF NOT EXISTS "crm_activities_dealId_idx" ON "crm_activities"("dealId");
CREATE INDEX IF NOT EXISTS "crm_activities_userId_idx" ON "crm_activities"("userId");
CREATE INDEX IF NOT EXISTS "crm_activities_dueDate_idx" ON "crm_activities"("dueDate");

ALTER TABLE "crm_activities"
  ADD CONSTRAINT "crm_activities_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_activities"
  ADD CONSTRAINT "crm_activities_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Notes
CREATE TABLE IF NOT EXISTS "crm_notes" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "contactId" TEXT,
  "dealId" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "crm_notes_contactId_idx" ON "crm_notes"("contactId");
CREATE INDEX IF NOT EXISTS "crm_notes_dealId_idx" ON "crm_notes"("dealId");

ALTER TABLE "crm_notes"
  ADD CONSTRAINT "crm_notes_contactId_fkey"
  FOREIGN KEY ("contactId") REFERENCES "crm_contacts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_notes"
  ADD CONSTRAINT "crm_notes_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "crm_deals"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
