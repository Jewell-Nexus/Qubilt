import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as wikiApi from '../lib/wiki-api';
import type {
  WikiPage,
  CreatePageDto,
  UpdatePageDto,
  MovePageDto,
} from '../types/wiki.types';

// Query key factories
export const wikiKeys = {
  all: ['wiki'] as const,
  pages: (workspaceId: string, projectId?: string) =>
    ['wiki', 'pages', workspaceId, projectId] as const,
  page: (id: string) => ['wiki', 'page', id] as const,
  versions: (pageId: string, page?: number) => ['wiki', 'versions', pageId, page] as const,
  search: (workspaceId: string, query: string) => ['wiki', 'search', workspaceId, query] as const,
  databases: (pageId: string) => ['wiki', 'databases', pageId] as const,
  databaseRows: (databaseId: string) => ['wiki', 'database-rows', databaseId] as const,
  templates: (workspaceId: string) => ['wiki', 'templates', workspaceId] as const,
};

// Pages
export function usePages(workspaceId: string, projectId?: string) {
  return useQuery({
    queryKey: wikiKeys.pages(workspaceId, projectId),
    queryFn: () => wikiApi.getPages(workspaceId, projectId),
    enabled: !!workspaceId,
  });
}

export function usePage(id: string) {
  return useQuery({
    queryKey: wikiKeys.page(id),
    queryFn: () => wikiApi.getPage(id),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePageDto) => wikiApi.createPage(dto),
    onSuccess: (_data, dto) => {
      queryClient.invalidateQueries({ queryKey: ['wiki', 'pages', dto.workspaceId] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePageDto }) =>
      wikiApi.updatePage(id, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: wikiKeys.page(id) });
      const previous = queryClient.getQueryData<WikiPage>(wikiKeys.page(id));
      if (previous) {
        queryClient.setQueryData<WikiPage>(wikiKeys.page(id), { ...previous, ...dto });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wikiKeys.page(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.page(id) });
      queryClient.invalidateQueries({ queryKey: ['wiki', 'pages'] });
    },
  });
}

export function useMovePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: MovePageDto }) =>
      wikiApi.movePage(id, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki', 'pages'] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wikiApi.deletePage(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wiki', 'pages'] });
    },
  });
}

// Versions
export function useVersions(pageId: string, page = 1) {
  return useQuery({
    queryKey: wikiKeys.versions(pageId, page),
    queryFn: () => wikiApi.getVersions(pageId, page),
    enabled: !!pageId,
  });
}

export function useRestoreVersion(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => wikiApi.restoreVersion(versionId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.page(pageId) });
      queryClient.invalidateQueries({ queryKey: ['wiki', 'versions', pageId] });
    },
  });
}

// Search
export function useSearchPages(workspaceId: string, query: string) {
  return useQuery({
    queryKey: wikiKeys.search(workspaceId, query),
    queryFn: () => wikiApi.searchPages(workspaceId, query),
    enabled: !!workspaceId && query.length >= 2,
  });
}

// Databases
export function useDatabases(pageId: string) {
  return useQuery({
    queryKey: wikiKeys.databases(pageId),
    queryFn: () => wikiApi.getDatabases(pageId),
    enabled: !!pageId,
  });
}

export function useCreateDatabase(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; icon?: string; schema?: unknown }) =>
      wikiApi.createDatabase(pageId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.databases(pageId) });
    },
  });
}

export function useUpdateDatabaseSchema(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ databaseId, schema }: { databaseId: string; schema: unknown }) =>
      wikiApi.updateDatabaseSchema(databaseId, schema),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.databases(pageId) });
    },
  });
}

export function useCreateDatabaseRow(databaseId: string, pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: Record<string, unknown>) =>
      wikiApi.createDatabaseRow(databaseId, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.databases(pageId) });
    },
  });
}

export function useUpdateDatabaseRow(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rowId, data }: { rowId: string; data: Record<string, unknown> }) =>
      wikiApi.updateDatabaseRow(rowId, data),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.databases(pageId) });
    },
  });
}

export function useDeleteDatabaseRow(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rowId: string) => wikiApi.deleteDatabaseRow(rowId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.databases(pageId) });
    },
  });
}

// Templates
export function useTemplates(workspaceId: string) {
  return useQuery({
    queryKey: wikiKeys.templates(workspaceId),
    queryFn: () => wikiApi.getTemplates(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplyTemplate(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => wikiApi.applyTemplate(pageId, templateId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.page(pageId) });
    },
  });
}
