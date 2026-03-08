import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as pmApi from '../lib/pm-api';
import type {
  CreateWorkPackageDto,
  UpdateWorkPackageDto,
  FilterWorkPackagesParams,
  CreateRelationDto,
  LogTimeDto,
  WorkPackage,
  PaginatedResult,
} from '../types/pm.types';

// Query key factories
export const pmKeys = {
  all: ['pm'] as const,
  workPackages: (projectId: string, params?: FilterWorkPackagesParams) =>
    ['pm', 'work-packages', projectId, params] as const,
  workPackage: (id: string) => ['pm', 'work-package', id] as const,
  activity: (wpId: string) => ['pm', 'activity', wpId] as const,
  relations: (wpId: string) => ['pm', 'relations', wpId] as const,
  types: (workspaceId: string) => ['pm', 'types', workspaceId] as const,
  statuses: (workspaceId: string) => ['pm', 'statuses', workspaceId] as const,
  priorities: (workspaceId: string) => ['pm', 'priorities', workspaceId] as const,
  versions: (projectId: string) => ['pm', 'versions', projectId] as const,
  categories: (projectId: string) => ['pm', 'categories', projectId] as const,
  sprints: (projectId: string) => ['pm', 'sprints', projectId] as const,
  queries: (projectId?: string) => ['pm', 'queries', projectId] as const,
  timeActivities: (projectId: string) => ['pm', 'time-activities', projectId] as const,
  members: (workspaceId: string) => ['pm', 'members', workspaceId] as const,
  boards: (projectId: string) => ['pm', 'boards', projectId] as const,
  board: (id: string) => ['pm', 'board', id] as const,
  baselines: (projectId: string) => ['pm', 'baselines', projectId] as const,
  baselineCompare: (id: string) => ['pm', 'baseline-compare', id] as const,
  timeEntries: (params?: Record<string, unknown>) => ['pm', 'time-entries', params] as const,
};

// Work Packages
export function useWorkPackages(projectId: string, params?: FilterWorkPackagesParams) {
  return useQuery({
    queryKey: pmKeys.workPackages(projectId, params),
    queryFn: () => pmApi.getWorkPackages(projectId, params),
    enabled: !!projectId,
  });
}

export function useWorkPackage(id: string) {
  return useQuery({
    queryKey: pmKeys.workPackage(id),
    queryFn: () => pmApi.getWorkPackage(id),
    enabled: !!id,
  });
}

export function useCreateWorkPackage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateWorkPackageDto) => pmApi.createWorkPackage(projectId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages', projectId] });
    },
  });
}

export function useUpdateWorkPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateWorkPackageDto }) =>
      pmApi.updateWorkPackage(id, dto),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: pmKeys.workPackage(id) });
      const previous = queryClient.getQueryData<WorkPackage>(pmKeys.workPackage(id));
      if (previous) {
        queryClient.setQueryData<WorkPackage>(pmKeys.workPackage(id), { ...previous, ...dto });
      }
      return { previous };
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(pmKeys.workPackage(id), context.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: pmKeys.workPackage(id) });
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages'] });
    },
  });
}

export function useDeleteWorkPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pmApi.deleteWorkPackage(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages'] });
    },
  });
}

// Activity
export function useActivity(wpId: string) {
  return useQuery({
    queryKey: pmKeys.activity(wpId),
    queryFn: () => pmApi.getActivity(wpId),
    enabled: !!wpId,
  });
}

export function useAddNote(wpId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes: string) => pmApi.addNote(wpId, notes),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.activity(wpId) });
    },
  });
}

// Relations
export function useRelations(wpId: string) {
  return useQuery({
    queryKey: pmKeys.relations(wpId),
    queryFn: () => pmApi.getRelations(wpId),
    enabled: !!wpId,
  });
}

export function useCreateRelation(wpId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRelationDto) => pmApi.createRelation(wpId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.relations(wpId) });
    },
  });
}

export function useDeleteRelation(wpId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pmApi.deleteRelation(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.relations(wpId) });
    },
  });
}

// Lookups
export function useTypes(workspaceId: string) {
  return useQuery({
    queryKey: pmKeys.types(workspaceId),
    queryFn: () => pmApi.getTypes(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatuses(workspaceId: string) {
  return useQuery({
    queryKey: pmKeys.statuses(workspaceId),
    queryFn: () => pmApi.getStatuses(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePriorities(workspaceId: string) {
  return useQuery({
    queryKey: pmKeys.priorities(workspaceId),
    queryFn: () => pmApi.getPriorities(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVersions(projectId: string) {
  return useQuery({
    queryKey: pmKeys.versions(projectId),
    queryFn: () => pmApi.getVersions(projectId),
    enabled: !!projectId,
  });
}

export function useCategories(projectId: string) {
  return useQuery({
    queryKey: pmKeys.categories(projectId),
    queryFn: () => pmApi.getCategories(projectId),
    enabled: !!projectId,
  });
}

export function useSprints(projectId: string) {
  return useQuery({
    queryKey: pmKeys.sprints(projectId),
    queryFn: () => pmApi.getSprints(projectId),
    enabled: !!projectId,
  });
}

export function useQueries(projectId?: string) {
  return useQuery({
    queryKey: pmKeys.queries(projectId),
    queryFn: () => pmApi.getQueries(projectId ? { projectId } : undefined),
  });
}

export function useTimeActivities(projectId: string) {
  return useQuery({
    queryKey: pmKeys.timeActivities(projectId),
    queryFn: () => pmApi.getTimeActivities(projectId),
    enabled: !!projectId,
  });
}

export function useLogTime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: LogTimeDto) => pmApi.logTime(dto),
    onSettled: (_data, _err, dto) => {
      if (dto.workPackageId) {
        queryClient.invalidateQueries({ queryKey: pmKeys.workPackage(dto.workPackageId) });
      }
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages'] });
    },
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: pmKeys.members(workspaceId),
    queryFn: () => pmApi.getWorkspaceMembers(workspaceId),
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

// Boards
export function useBoards(projectId: string) {
  return useQuery({
    queryKey: pmKeys.boards(projectId),
    queryFn: () => pmApi.getBoards(projectId),
    enabled: !!projectId,
  });
}

export function useBoard(id: string) {
  return useQuery({
    queryKey: pmKeys.board(id),
    queryFn: () => pmApi.getBoard(id),
    enabled: !!id,
  });
}

export function useCreateBoard(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; type: string }) => pmApi.createBoard(projectId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.boards(projectId) });
    },
  });
}

export function useMoveBoardCard(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, columnId, position }: { cardId: string; columnId: string; position: number }) =>
      pmApi.moveBoardCard(cardId, { columnId, position }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.board(boardId) });
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages'] });
    },
  });
}

// Baselines
export function useBaselines(projectId: string) {
  return useQuery({
    queryKey: pmKeys.baselines(projectId),
    queryFn: () => pmApi.getBaselines(projectId),
    enabled: !!projectId,
  });
}

export function useBaselineComparison(id: string) {
  return useQuery({
    queryKey: pmKeys.baselineCompare(id),
    queryFn: () => pmApi.compareBaseline(id),
    enabled: !!id,
  });
}

// Time Entries (paginated)
export function useTimeEntries(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: pmKeys.timeEntries(params),
    queryFn: () => pmApi.getTimeEntries(params),
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pmApi.deleteTimeEntry(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pm', 'time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages'] });
    },
  });
}

// Sprints
export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; startDate?: string; endDate?: string; goal?: string }) =>
      pmApi.createSprint(projectId, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.sprints(projectId) });
    },
  });
}

export function useCompleteSprint(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      pmApi.completeSprint(id, { action }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.sprints(projectId) });
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages'] });
    },
  });
}

// Optimistic update helper for list mutations
export function useOptimisticListUpdate(projectId: string) {
  const queryClient = useQueryClient();

  return {
    optimisticCreate: async (tempWp: WorkPackage) => {
      await queryClient.cancelQueries({ queryKey: ['pm', 'work-packages', projectId] });

      // Update all matching queries
      queryClient.setQueriesData<PaginatedResult<WorkPackage>>(
        { queryKey: ['pm', 'work-packages', projectId] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [...old.data, tempWp],
            total: old.total + 1,
          };
        },
      );
    },

    rollback: () => {
      queryClient.invalidateQueries({ queryKey: ['pm', 'work-packages', projectId] });
    },
  };
}
