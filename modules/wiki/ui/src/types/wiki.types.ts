export interface WikiPage {
  id: string;
  projectId: string | null;
  workspaceId: string;
  parentId: string | null;
  slug: string;
  title: string;
  icon: string | null;
  coverUrl: string | null;
  position: number;
  lft: number;
  rgt: number;
  isLocked: boolean;
  isTemplate: boolean;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: WikiPageContent | null;
  children?: WikiPageChild[];
}

export interface WikiPageChild {
  id: string;
  title: string;
  icon: string | null;
  slug: string;
}

export interface WikiPageContent {
  id: string;
  pageId: string;
  content: unknown;
  textContent: string;
  wordCount: number;
  updatedAt: string;
  updatedBy: string;
}

export interface WikiPageVersion {
  id: string;
  pageId: string;
  content: unknown;
  summary: string | null;
  authorId: string;
  version: number;
  createdAt: string;
}

export interface WikiPageTreeNode {
  id: string;
  title: string;
  icon: string | null;
  slug: string;
  parentId: string | null;
  position: number;
  childCount: number;
  children: WikiPageTreeNode[];
}

export interface WikiDatabase {
  id: string;
  pageId: string;
  name: string;
  icon: string | null;
  schema: DatabaseSchema;
  viewType: DatabaseView;
  filters: unknown[];
  sortBy: unknown[];
  groupBy: string | null;
  rows?: WikiDatabaseRow[];
}

export interface DatabaseSchema {
  columns: DatabaseColumn[];
}

export interface DatabaseColumn {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[];
}

export type ColumnType = 'text' | 'number' | 'select' | 'multi-select' | 'date' | 'checkbox' | 'url' | 'relation';
export type DatabaseView = 'TABLE' | 'BOARD' | 'GALLERY' | 'CALENDAR' | 'LIST';

export interface WikiDatabaseRow {
  id: string;
  databaseId: string;
  data: Record<string, unknown>;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface WikiTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  icon: string | null;
  content: unknown;
  category: string;
  isBuiltIn: boolean;
  createdAt: string;
}

export interface PageDiff {
  added: number;
  removed: number;
  changed: boolean;
}

export interface PaginatedVersions {
  data: WikiPageVersion[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePageDto {
  workspaceId: string;
  projectId?: string;
  parentId?: string;
  title?: string;
  icon?: string;
  templateId?: string;
}

export interface UpdatePageDto {
  title?: string;
  icon?: string;
  coverUrl?: string;
  isLocked?: boolean;
}

export interface MovePageDto {
  newParentId?: string | null;
  afterId?: string | null;
}
