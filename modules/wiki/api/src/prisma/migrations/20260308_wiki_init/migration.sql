-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "DatabaseView" AS ENUM ('TABLE', 'BOARD', 'GALLERY', 'CALENDAR', 'LIST');

-- CreateTable
CREATE TABLE "wiki_pages" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "parentId" TEXT,
    "slug" VARCHAR(255) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "icon" VARCHAR(50),
    "coverUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "lft" INTEGER NOT NULL DEFAULT 0,
    "rgt" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_page_contents" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "textContent" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "wiki_page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_page_versions" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "summary" VARCHAR(255),
    "authorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_page_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_databases" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "icon" VARCHAR(50),
    "schema" JSONB NOT NULL,
    "viewType" "DatabaseView" NOT NULL DEFAULT 'TABLE',
    "filters" JSONB NOT NULL DEFAULT '[]',
    "sortBy" JSONB NOT NULL DEFAULT '[]',
    "groupBy" TEXT,

    CONSTRAINT "wiki_databases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_database_rows" (
    "id" TEXT NOT NULL,
    "databaseId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_database_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wiki_templates" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "content" JSONB NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wiki_pages_projectId_idx" ON "wiki_pages"("projectId");

-- CreateIndex
CREATE INDEX "wiki_pages_workspaceId_idx" ON "wiki_pages"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_pages_workspaceId_slug_key" ON "wiki_pages"("workspaceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "wiki_page_contents_pageId_key" ON "wiki_page_contents"("pageId");

-- CreateIndex
CREATE INDEX "wiki_page_versions_pageId_idx" ON "wiki_page_versions"("pageId");

-- AddForeignKey
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "wiki_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page_contents" ADD CONSTRAINT "wiki_page_contents_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "wiki_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_page_versions" ADD CONSTRAINT "wiki_page_versions_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "wiki_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_databases" ADD CONSTRAINT "wiki_databases_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "wiki_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wiki_database_rows" ADD CONSTRAINT "wiki_database_rows_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "wiki_databases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

