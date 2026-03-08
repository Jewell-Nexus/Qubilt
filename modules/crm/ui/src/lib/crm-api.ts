import { get, post, patch, del } from '@/lib/api';
import type {
  CrmContact,
  ContactDetail,
  CrmPipeline,
  CrmDeal,
  DealDetail,
  PipelineBoardData,
  CrmActivity,
  CrmNote,
  ForecastData,
  FunnelStage,
  RevenueTrend,
  OwnerStats,
  CreateContactDto,
  UpdateContactDto,
  CreateDealDto,
  UpdateDealDto,
  CreateActivityDto,
  CreateNoteDto,
  CreatePipelineDto,
  ImportResult,
  CrmPipelineStage,
} from '../types/crm.types';

type Resp<T> = { success: boolean; data: T };
type PageResp<T> = { success: boolean; data: T[]; meta: { total: number; page: number; limit: number } };

// Contacts
export function getContacts(params: Record<string, unknown>) {
  return get<PageResp<CrmContact>>('/crm/contacts', params);
}

export function getContact(id: string) {
  return get<Resp<ContactDetail>>(`/crm/contacts/${id}`);
}

export function createContact(dto: CreateContactDto) {
  return post<Resp<CrmContact>>('/crm/contacts', dto);
}

export function updateContact(id: string, dto: UpdateContactDto) {
  return patch<Resp<CrmContact>>(`/crm/contacts/${id}`, dto);
}

export function deleteContact(id: string) {
  return del<Resp<void>>(`/crm/contacts/${id}`);
}

export function mergeContacts(primaryId: string, duplicateId: string) {
  return post<Resp<CrmContact>>(`/crm/contacts/${primaryId}/merge`, { duplicateId });
}

export function importContacts(workspaceId: string, file: File, fieldMapping: Record<string, string>) {
  const form = new FormData();
  form.append('file', file);
  form.append('workspaceId', workspaceId);
  form.append('fieldMapping', JSON.stringify(fieldMapping));
  return post<Resp<ImportResult>>('/crm/contacts/import', form);
}

export function exportContactsUrl(workspaceId: string) {
  return `/crm/contacts/export?workspaceId=${workspaceId}`;
}

// Pipelines
export function getPipelines(workspaceId: string) {
  return get<Resp<CrmPipeline[]>>('/crm/pipelines', { workspaceId });
}

export function getPipeline(id: string) {
  return get<Resp<CrmPipeline>>(`/crm/pipelines/${id}`);
}

export function createPipeline(dto: CreatePipelineDto) {
  return post<Resp<CrmPipeline>>('/crm/pipelines', dto);
}

export function addStage(pipelineId: string, dto: { name: string; probability?: number; color?: string }) {
  return post<Resp<CrmPipelineStage>>(`/crm/pipelines/${pipelineId}/stages`, dto);
}

export function reorderStages(pipelineId: string, orderedIds: string[]) {
  return post<Resp<void>>(`/crm/pipelines/${pipelineId}/stages/reorder`, { orderedIds });
}

export function deleteStage(stageId: string) {
  return del<Resp<void>>(`/crm/pipeline-stages/${stageId}`);
}

// Deals
export function getDeals(params: Record<string, unknown>) {
  return get<PageResp<CrmDeal>>('/crm/deals', params);
}

export function getDeal(id: string) {
  return get<Resp<DealDetail>>(`/crm/deals/${id}`);
}

export function createDeal(dto: CreateDealDto) {
  return post<Resp<CrmDeal>>('/crm/deals', dto);
}

export function updateDeal(id: string, dto: UpdateDealDto) {
  return patch<Resp<CrmDeal>>(`/crm/deals/${id}`, dto);
}

export function moveDealStage(dealId: string, targetStageId: string) {
  return post<Resp<CrmDeal>>(`/crm/deals/${dealId}/move-stage`, { targetStageId });
}

export function deleteDeal(id: string) {
  return del<Resp<void>>(`/crm/deals/${id}`);
}

export function getPipelineBoard(pipelineId: string) {
  return get<Resp<PipelineBoardData>>(`/crm/pipelines/${pipelineId}/board`);
}

// Reports
export function getForecast(workspaceId: string, period: 'month' | 'quarter' | 'year') {
  return get<Resp<ForecastData>>('/crm/reports/forecast', { workspaceId, period });
}

export function getFunnel(pipelineId: string) {
  return get<Resp<FunnelStage[]>>('/crm/reports/funnel', { pipelineId });
}

export function getRevenueTrend(workspaceId: string, months = 12) {
  return get<Resp<RevenueTrend[]>>('/crm/reports/revenue-trend', { workspaceId, months });
}

export function getLeaderboard(workspaceId: string, period?: string) {
  return get<Resp<OwnerStats[]>>('/crm/reports/leaderboard', { workspaceId, period });
}

// Activities
export function getActivities(params: Record<string, unknown>) {
  return get<PageResp<CrmActivity>>('/crm/activities', params);
}

export function getUpcomingActivities(days = 7) {
  return get<Resp<CrmActivity[]>>('/crm/activities/upcoming', { days });
}

export function createActivity(dto: CreateActivityDto) {
  return post<Resp<CrmActivity>>('/crm/activities', dto);
}

export function updateActivity(id: string, dto: Partial<CreateActivityDto>) {
  return patch<Resp<CrmActivity>>(`/crm/activities/${id}`, dto);
}

export function completeActivity(id: string) {
  return post<Resp<CrmActivity>>(`/crm/activities/${id}/complete`);
}

export function deleteActivity(id: string) {
  return del<Resp<void>>(`/crm/activities/${id}`);
}

// Notes
export function getNotes(params: Record<string, unknown>) {
  return get<PageResp<CrmNote>>('/crm/notes', params);
}

export function createNote(dto: CreateNoteDto) {
  return post<Resp<CrmNote>>('/crm/notes', dto);
}

export function updateNote(id: string, content: string) {
  return patch<Resp<CrmNote>>(`/crm/notes/${id}`, { content });
}

export function deleteNote(id: string) {
  return del<Resp<void>>(`/crm/notes/${id}`);
}
