import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as crmApi from '../lib/crm-api';
import type {
  CreateContactDto,
  UpdateContactDto,
  CreateDealDto,
  UpdateDealDto,
  CreateActivityDto,
  CreateNoteDto,
  CreatePipelineDto,
} from '../types/crm.types';

export const crmKeys = {
  all: ['crm'] as const,
  contacts: (workspaceId: string) => ['crm', 'contacts', workspaceId] as const,
  contact: (id: string) => ['crm', 'contact', id] as const,
  pipelines: (workspaceId: string) => ['crm', 'pipelines', workspaceId] as const,
  pipeline: (id: string) => ['crm', 'pipeline', id] as const,
  pipelineBoard: (id: string) => ['crm', 'pipeline-board', id] as const,
  deals: (workspaceId: string) => ['crm', 'deals', workspaceId] as const,
  deal: (id: string) => ['crm', 'deal', id] as const,
  activities: (params: Record<string, unknown>) => ['crm', 'activities', params] as const,
  upcoming: () => ['crm', 'upcoming'] as const,
  forecast: (workspaceId: string, period: string) => ['crm', 'forecast', workspaceId, period] as const,
  funnel: (pipelineId: string) => ['crm', 'funnel', pipelineId] as const,
  revenueTrend: (workspaceId: string) => ['crm', 'revenue-trend', workspaceId] as const,
  leaderboard: (workspaceId: string) => ['crm', 'leaderboard', workspaceId] as const,
  notes: (params: Record<string, unknown>) => ['crm', 'notes', params] as const,
};

// Contacts
export function useContacts(workspaceId: string, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...crmKeys.contacts(workspaceId), filters],
    queryFn: async () => {
      const res = await crmApi.getContacts({ workspaceId, ...filters });
      return { data: res.data, meta: res.meta };
    },
    enabled: !!workspaceId,
  });
}

export function useContact(id: string | null) {
  return useQuery({
    queryKey: crmKeys.contact(id ?? ''),
    queryFn: async () => {
      const res = await crmApi.getContact(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateContactDto) => crmApi.createContact(dto),
    onSuccess: (_d, dto) => {
      qc.invalidateQueries({ queryKey: crmKeys.contacts(dto.workspaceId) });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateContactDto }) => crmApi.updateContact(id, dto),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
      qc.invalidateQueries({ queryKey: ['crm', 'contact'] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteContact(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
    },
  });
}

export function useMergeContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ primaryId, duplicateId }: { primaryId: string; duplicateId: string }) =>
      crmApi.mergeContacts(primaryId, duplicateId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
    },
  });
}

export function useImportContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, file, fieldMapping }: { workspaceId: string; file: File; fieldMapping: Record<string, string> }) =>
      crmApi.importContacts(workspaceId, file, fieldMapping),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'contacts'] });
    },
  });
}

// Pipelines
export function usePipelines(workspaceId: string) {
  return useQuery({
    queryKey: crmKeys.pipelines(workspaceId),
    queryFn: async () => {
      const res = await crmApi.getPipelines(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function usePipelineBoard(pipelineId: string) {
  return useQuery({
    queryKey: crmKeys.pipelineBoard(pipelineId),
    queryFn: async () => {
      const res = await crmApi.getPipelineBoard(pipelineId);
      return res.data;
    },
    enabled: !!pipelineId,
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePipelineDto) => crmApi.createPipeline(dto),
    onSuccess: (_d, dto) => {
      qc.invalidateQueries({ queryKey: crmKeys.pipelines(dto.workspaceId) });
    },
  });
}

export function useMoveDealStage(pipelineId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dealId, targetStageId }: { dealId: string; targetStageId: string }) =>
      crmApi.moveDealStage(dealId, targetStageId),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: crmKeys.pipelineBoard(pipelineId) });
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
    },
  });
}

// Deals
export function useDeals(workspaceId: string, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...crmKeys.deals(workspaceId), filters],
    queryFn: async () => {
      const res = await crmApi.getDeals({ workspaceId, ...filters });
      return { data: res.data, meta: res.meta };
    },
    enabled: !!workspaceId,
  });
}

export function useDeal(id: string | null) {
  return useQuery({
    queryKey: crmKeys.deal(id ?? ''),
    queryFn: async () => {
      const res = await crmApi.getDeal(id!);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateDealDto) => crmApi.createDeal(dto),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
      qc.invalidateQueries({ queryKey: ['crm', 'pipeline-board'] });
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateDealDto }) => crmApi.updateDeal(id, dto),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
      qc.invalidateQueries({ queryKey: ['crm', 'deal'] });
      qc.invalidateQueries({ queryKey: ['crm', 'pipeline-board'] });
    },
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteDeal(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'deals'] });
      qc.invalidateQueries({ queryKey: ['crm', 'pipeline-board'] });
    },
  });
}

// Reports
export function useForecast(workspaceId: string, period: 'month' | 'quarter' | 'year') {
  return useQuery({
    queryKey: crmKeys.forecast(workspaceId, period),
    queryFn: async () => {
      const res = await crmApi.getForecast(workspaceId, period);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useFunnel(pipelineId: string) {
  return useQuery({
    queryKey: crmKeys.funnel(pipelineId),
    queryFn: async () => {
      const res = await crmApi.getFunnel(pipelineId);
      return res.data;
    },
    enabled: !!pipelineId,
  });
}

export function useRevenueTrend(workspaceId: string) {
  return useQuery({
    queryKey: crmKeys.revenueTrend(workspaceId),
    queryFn: async () => {
      const res = await crmApi.getRevenueTrend(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useLeaderboard(workspaceId: string) {
  return useQuery({
    queryKey: crmKeys.leaderboard(workspaceId),
    queryFn: async () => {
      const res = await crmApi.getLeaderboard(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

// Activities
export function useActivities(params: Record<string, unknown>) {
  return useQuery({
    queryKey: crmKeys.activities(params),
    queryFn: async () => {
      const res = await crmApi.getActivities(params);
      return { data: res.data, meta: res.meta };
    },
    enabled: !!params['workspaceId'],
  });
}

export function useUpcomingActivities(days = 7) {
  return useQuery({
    queryKey: crmKeys.upcoming(),
    queryFn: async () => {
      const res = await crmApi.getUpcomingActivities(days);
      return res.data;
    },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateActivityDto) => crmApi.createActivity(dto),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'activities'] });
      qc.invalidateQueries({ queryKey: ['crm', 'upcoming'] });
      qc.invalidateQueries({ queryKey: ['crm', 'contact'] });
      qc.invalidateQueries({ queryKey: ['crm', 'deal'] });
    },
  });
}

export function useCompleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.completeActivity(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'activities'] });
      qc.invalidateQueries({ queryKey: ['crm', 'upcoming'] });
    },
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteActivity(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'activities'] });
    },
  });
}

// Notes
export function useNotes(params: Record<string, unknown>) {
  return useQuery({
    queryKey: crmKeys.notes(params),
    queryFn: async () => {
      const res = await crmApi.getNotes(params);
      return { data: res.data, meta: res.meta };
    },
    enabled: !!(params['contactId'] || params['dealId']),
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateNoteDto) => crmApi.createNote(dto),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'notes'] });
      qc.invalidateQueries({ queryKey: ['crm', 'contact'] });
      qc.invalidateQueries({ queryKey: ['crm', 'deal'] });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteNote(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['crm', 'notes'] });
    },
  });
}
