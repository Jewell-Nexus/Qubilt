-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('OPEN', 'LOCKED', 'CLOSED');

-- CreateEnum
CREATE TYPE "VersionSharing" AS ENUM ('NONE', 'DESCENDANTS', 'HIERARCHY', 'TREE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('RELATES', 'DUPLICATES', 'DUPLICATED_BY', 'BLOCKS', 'BLOCKED_BY', 'PRECEDES', 'FOLLOWS', 'INCLUDES', 'PART_OF', 'REQUIRES', 'REQUIRED_BY');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('STRING', 'TEXT', 'INTEGER', 'FLOAT', 'BOOL', 'DATE', 'DATETIME', 'LIST', 'MULTI_LIST', 'USER', 'VERSION', 'HIERARCHY');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('MANUAL', 'STATUS', 'ASSIGNEE', 'VERSION', 'SUBPROJECT', 'PARENT_CHILD');

-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNING', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "BudgetItemType" AS ENUM ('LABOR', 'MATERIAL');

-- CreateTable
CREATE TABLE "pm_types" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pm_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_statuses" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isReadonly" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pm_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_priorities" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pm_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_work_packages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "priorityId" TEXT,
    "subject" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "lft" INTEGER NOT NULL DEFAULT 0,
    "rgt" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATE,
    "dueDate" DATE,
    "estimatedHours" DECIMAL(10,2),
    "spentHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "percentDone" INTEGER NOT NULL DEFAULT 0,
    "versionId" TEXT,
    "categoryId" TEXT,
    "storyPoints" INTEGER,
    "position" INTEGER NOT NULL DEFAULT 0,
    "scheduleManually" BOOLEAN NOT NULL DEFAULT false,
    "ignoreNonWorkingDays" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "pm_work_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "VersionStatus" NOT NULL DEFAULT 'OPEN',
    "startDate" DATE,
    "dueDate" DATE,
    "sharing" "VersionSharing" NOT NULL DEFAULT 'NONE',
    "wikiPageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_categories" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "defaultAssigneeId" TEXT,

    CONSTRAINT "pm_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_relations" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "type" "RelationType" NOT NULL,
    "delay" INTEGER,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_time_entries" (
    "id" TEXT NOT NULL,
    "workPackageId" TEXT,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "comment" TEXT,
    "spentOn" DATE NOT NULL,
    "activityId" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_time_activities" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pm_time_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_custom_fields" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "fieldFormat" "CustomFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isFilter" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "possibleValues" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_custom_values" (
    "id" TEXT NOT NULL,
    "workPackageId" TEXT NOT NULL,
    "customFieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "pm_custom_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_journals" (
    "id" TEXT NOT NULL,
    "workPackageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_journal_details" (
    "id" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "property" VARCHAR(100) NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,

    CONSTRAINT "pm_journal_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_boards" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "BoardType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_board_columns" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "query" JSONB,

    CONSTRAINT "pm_board_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_board_cards" (
    "id" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "workPackageId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pm_board_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_workflow_states" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "statusId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "allowCreate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pm_workflow_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_sprints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "status" "SprintStatus" NOT NULL DEFAULT 'PLANNING',
    "startDate" DATE,
    "endDate" DATE,
    "goal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_baselines" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "snapshotAt" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "pm_baselines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_budgets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "versionId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_budget_items" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "workPackageId" TEXT,
    "type" "BudgetItemType" NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "pm_budget_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pm_queries" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '[]',
    "sortBy" JSONB NOT NULL DEFAULT '[]',
    "groupBy" VARCHAR(100),
    "columns" JSONB NOT NULL DEFAULT '[]',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "displayType" VARCHAR(50) NOT NULL DEFAULT 'list',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pm_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pm_types_workspaceId_name_key" ON "pm_types"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "pm_statuses_workspaceId_name_key" ON "pm_statuses"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "pm_priorities_workspaceId_name_key" ON "pm_priorities"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "pm_work_packages_projectId_idx" ON "pm_work_packages"("projectId");

-- CreateIndex
CREATE INDEX "pm_work_packages_assigneeId_idx" ON "pm_work_packages"("assigneeId");

-- CreateIndex
CREATE INDEX "pm_work_packages_statusId_idx" ON "pm_work_packages"("statusId");

-- CreateIndex
CREATE INDEX "pm_work_packages_parentId_idx" ON "pm_work_packages"("parentId");

-- CreateIndex
CREATE INDEX "pm_versions_projectId_idx" ON "pm_versions"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "pm_categories_projectId_name_key" ON "pm_categories"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "pm_relations_fromId_toId_type_key" ON "pm_relations"("fromId", "toId", "type");

-- CreateIndex
CREATE INDEX "pm_time_entries_projectId_idx" ON "pm_time_entries"("projectId");

-- CreateIndex
CREATE INDEX "pm_time_entries_userId_idx" ON "pm_time_entries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pm_custom_values_workPackageId_customFieldId_key" ON "pm_custom_values"("workPackageId", "customFieldId");

-- CreateIndex
CREATE INDEX "pm_journals_workPackageId_idx" ON "pm_journals"("workPackageId");

-- CreateIndex
CREATE INDEX "pm_boards_projectId_idx" ON "pm_boards"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "pm_board_cards_columnId_workPackageId_key" ON "pm_board_cards"("columnId", "workPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "pm_workflow_states_workspaceId_typeId_statusId_roleId_key" ON "pm_workflow_states"("workspaceId", "typeId", "statusId", "roleId");

-- CreateIndex
CREATE INDEX "pm_sprints_projectId_idx" ON "pm_sprints"("projectId");

-- CreateIndex
CREATE INDEX "pm_baselines_projectId_idx" ON "pm_baselines"("projectId");

-- AddForeignKey
ALTER TABLE "pm_work_packages" ADD CONSTRAINT "pm_work_packages_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "pm_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_work_packages" ADD CONSTRAINT "pm_work_packages_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "pm_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_work_packages" ADD CONSTRAINT "pm_work_packages_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "pm_priorities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_work_packages" ADD CONSTRAINT "pm_work_packages_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "pm_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_work_packages" ADD CONSTRAINT "pm_work_packages_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "pm_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_work_packages" ADD CONSTRAINT "pm_work_packages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "pm_work_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_relations" ADD CONSTRAINT "pm_relations_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "pm_work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_relations" ADD CONSTRAINT "pm_relations_toId_fkey" FOREIGN KEY ("toId") REFERENCES "pm_work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_time_entries" ADD CONSTRAINT "pm_time_entries_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "pm_work_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_time_entries" ADD CONSTRAINT "pm_time_entries_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "pm_time_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_custom_values" ADD CONSTRAINT "pm_custom_values_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "pm_work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_custom_values" ADD CONSTRAINT "pm_custom_values_customFieldId_fkey" FOREIGN KEY ("customFieldId") REFERENCES "pm_custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_journals" ADD CONSTRAINT "pm_journals_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "pm_work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_journal_details" ADD CONSTRAINT "pm_journal_details_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "pm_journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_board_columns" ADD CONSTRAINT "pm_board_columns_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "pm_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_board_cards" ADD CONSTRAINT "pm_board_cards_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "pm_board_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_board_cards" ADD CONSTRAINT "pm_board_cards_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "pm_work_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_workflow_states" ADD CONSTRAINT "pm_workflow_states_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "pm_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_workflow_states" ADD CONSTRAINT "pm_workflow_states_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "pm_statuses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_budget_items" ADD CONSTRAINT "pm_budget_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "pm_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pm_budget_items" ADD CONSTRAINT "pm_budget_items_workPackageId_fkey" FOREIGN KEY ("workPackageId") REFERENCES "pm_work_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

