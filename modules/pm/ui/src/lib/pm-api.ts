import { get, post, patch, del } from '@/lib/api';
import type {
  WorkPackage,
  PmType,
  PmStatus,
  PmPriority,
  PmVersion,
  PmCategory,
  PmRelation,
  PmQuery,
  Journal,
  TimeEntry,
  TimeActivity,
  PmSprint,
  PmBoard,
  PmBaseline,
  PmBudget,
  PmCustomField,
  PaginatedResult,
  CreateWorkPackageDto,
  UpdateWorkPackageDto,
  FilterWorkPackagesParams,
  CreateRelationDto,
  LogTimeDto,
  User,
} from '../types/pm.types';

// Work Packages
export function getWorkPackages(projectId: string, params?: FilterWorkPackagesParams) {
  return get<PaginatedResult<WorkPackage>>(`/pm/projects/${projectId}/work-packages`, params as Record<string, unknown>);
}

export function getWorkPackage(id: string) {
  return get<WorkPackage>(`/pm/work-packages/${id}`);
}

export function createWorkPackage(projectId: string, dto: CreateWorkPackageDto) {
  return post<WorkPackage>(`/pm/projects/${projectId}/work-packages`, dto);
}

export function updateWorkPackage(id: string, dto: UpdateWorkPackageDto) {
  return patch<WorkPackage>(`/pm/work-packages/${id}`, dto);
}

export function deleteWorkPackage(id: string) {
  return del<void>(`/pm/work-packages/${id}`);
}

// Activity / Journals
export function getActivity(wpId: string, params?: { page?: number; limit?: number }) {
  return get<PaginatedResult<Journal>>(`/pm/work-packages/${wpId}/activity`, params as Record<string, unknown>);
}

export function addNote(wpId: string, notes: string) {
  return post<Journal>(`/pm/work-packages/${wpId}/activity`, { notes });
}

// Relations
export function getRelations(wpId: string) {
  return get<PmRelation[]>(`/pm/work-packages/${wpId}/relations`);
}

export function createRelation(wpId: string, dto: CreateRelationDto) {
  return post<PmRelation>(`/pm/work-packages/${wpId}/relations`, dto);
}

export function deleteRelation(id: string) {
  return del<void>(`/pm/relations/${id}`);
}

// Types, Statuses, Priorities
export function getTypes(workspaceId: string) {
  return get<PmType[]>('/pm/types', { workspaceId });
}

export function getStatuses(workspaceId: string) {
  return get<PmStatus[]>('/pm/statuses', { workspaceId });
}

export function getPriorities(workspaceId: string) {
  return get<PmPriority[]>('/pm/priorities', { workspaceId });
}

// Versions
export function getVersions(projectId: string) {
  return get<PmVersion[]>(`/pm/projects/${projectId}/versions`);
}

// Categories
export function getCategories(projectId: string) {
  return get<PmCategory[]>(`/pm/projects/${projectId}/categories`);
}

// Sprints
export function getSprints(projectId: string) {
  return get<PmSprint[]>(`/pm/projects/${projectId}/sprints`);
}

// Queries
export function getQueries(params?: { projectId?: string; userId?: string }) {
  return get<PmQuery[]>('/pm/queries', params as Record<string, unknown>);
}

export function applyQuery(id: string) {
  return get<PmQuery>(`/pm/queries/${id}`);
}

// Time Entries
export function logTime(dto: LogTimeDto) {
  return post<TimeEntry>('/pm/time', dto);
}

export function getTimeEntries(params?: Record<string, unknown>) {
  return get<PaginatedResult<TimeEntry>>('/pm/time', params);
}

export function getTimeActivities(projectId: string) {
  return get<TimeActivity[]>(`/pm/projects/${projectId}/time-activities`);
}

// Boards
export function getBoards(projectId: string) {
  return get<PmBoard[]>(`/pm/projects/${projectId}/boards`);
}

export function getBoard(id: string) {
  return get<PmBoard>(`/pm/boards/${id}`);
}

// Baselines
export function getBaselines(projectId: string) {
  return get<PmBaseline[]>(`/pm/projects/${projectId}/baselines`);
}

// Budgets
export function getBudgets(projectId: string) {
  return get<PmBudget[]>(`/pm/projects/${projectId}/budgets`);
}

// Custom Fields
export function getCustomFields(workspaceId: string) {
  return get<PmCustomField[]>('/pm/custom-fields', { workspaceId });
}

// Workspace Members (kernel endpoint)
export function getWorkspaceMembers(workspaceId: string) {
  return get<User[]>(`/workspaces/${workspaceId}/members`);
}
