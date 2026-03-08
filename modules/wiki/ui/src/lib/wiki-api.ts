import { get, post, patch, del } from '@/lib/api';
import type {
  WikiPage,
  WikiPageTreeNode,
  WikiDatabase,
  WikiDatabaseRow,
  WikiTemplate,
  PaginatedVersions,
  CreatePageDto,
  UpdatePageDto,
  MovePageDto,
} from '../types/wiki.types';

// Pages
export function getPages(workspaceId: string, projectId?: string) {
  return get<WikiPageTreeNode[]>('/wiki/pages', { workspaceId, projectId });
}

export function getPage(id: string) {
  return get<WikiPage>(`/wiki/pages/${id}`);
}

export function getPageBySlug(workspaceId: string, slug: string) {
  return get<WikiPage>(`/wiki/pages/by-slug/${slug}`, { workspaceId });
}

export function createPage(dto: CreatePageDto) {
  return post<WikiPage>('/wiki/pages', dto);
}

export function updatePage(id: string, dto: UpdatePageDto) {
  return patch<WikiPage>(`/wiki/pages/${id}`, dto);
}

export function movePage(id: string, dto: MovePageDto) {
  return post<void>(`/wiki/pages/${id}/move`, dto);
}

export function deletePage(id: string) {
  return del<void>(`/wiki/pages/${id}`);
}

// Versions
export function getVersions(pageId: string, page?: number, limit?: number) {
  return get<PaginatedVersions>(`/wiki/pages/${pageId}/versions`, { page, limit });
}

export function restoreVersion(versionId: string) {
  return post<void>(`/wiki/pages/versions/${versionId}/restore`);
}

// Search
export function searchPages(workspaceId: string, query: string) {
  return get<WikiPage[]>('/wiki/search', { workspaceId, q: query });
}

// Databases
export function getDatabases(pageId: string) {
  return get<WikiDatabase[]>(`/wiki/pages/${pageId}/databases`);
}

export function createDatabase(pageId: string, dto: { name: string; icon?: string; schema?: unknown }) {
  return post<WikiDatabase>(`/wiki/pages/${pageId}/databases`, dto);
}

export function updateDatabaseSchema(databaseId: string, schema: unknown) {
  return patch<WikiDatabase>(`/wiki/databases/${databaseId}/schema`, { schema });
}

export function updateDatabaseView(databaseId: string, dto: { viewType?: string; filters?: unknown[]; sortBy?: unknown[]; groupBy?: string }) {
  return patch<WikiDatabase>(`/wiki/databases/${databaseId}/view`, dto);
}

export function createDatabaseRow(databaseId: string, data?: Record<string, unknown>) {
  return post<WikiDatabaseRow>(`/wiki/databases/${databaseId}/rows`, { data });
}

export function updateDatabaseRow(rowId: string, data: Record<string, unknown>) {
  return patch<WikiDatabaseRow>(`/wiki/database-rows/${rowId}`, { data });
}

export function deleteDatabaseRow(rowId: string) {
  return del<void>(`/wiki/database-rows/${rowId}`);
}

export function getDatabaseRows(databaseId: string) {
  return get<WikiDatabaseRow[]>(`/wiki/databases/${databaseId}/rows`);
}

export function reorderDatabaseRows(databaseId: string, orderedIds: string[]) {
  return post<void>(`/wiki/databases/${databaseId}/rows/reorder`, { orderedIds });
}

// Templates
export function getTemplates(workspaceId: string) {
  return get<WikiTemplate[]>('/wiki/templates', { workspaceId });
}

export function createTemplate(dto: { workspaceId: string; name: string; description?: string; icon?: string; category: string; content: unknown }) {
  return post<WikiTemplate>('/wiki/templates', dto);
}

export function deleteTemplate(id: string) {
  return del<void>(`/wiki/templates/${id}`);
}

export function applyTemplate(pageId: string, templateId: string) {
  return post<void>(`/wiki/pages/${pageId}/apply-template`, { templateId });
}
