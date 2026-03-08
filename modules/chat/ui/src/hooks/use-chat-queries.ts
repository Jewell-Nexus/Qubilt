import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatApi from '../lib/chat-api';
import type { ChatMessage, CreateChannelDto, UpdateChannelDto } from '../types/chat.types';

export const chatKeys = {
  all: ['chat'] as const,
  channels: (workspaceId: string) => ['chat', 'channels', workspaceId] as const,
  channel: (id: string) => ['chat', 'channel', id] as const,
  messages: (channelId: string) => ['chat', 'messages', channelId] as const,
  thread: (threadId: string) => ['chat', 'thread', threadId] as const,
  members: (channelId: string) => ['chat', 'members', channelId] as const,
  pinned: (channelId: string) => ['chat', 'pinned', channelId] as const,
  search: (workspaceId: string, query: string) => ['chat', 'search', workspaceId, query] as const,
  users: (workspaceId: string) => ['chat', 'users', workspaceId] as const,
};

export function useChannels(workspaceId: string) {
  return useQuery({
    queryKey: chatKeys.channels(workspaceId),
    queryFn: async () => {
      const res = await chatApi.getChannels(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
    refetchInterval: 30000,
  });
}

export function useMessages(channelId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(channelId),
    queryFn: async ({ pageParam }) => {
      const res = await chatApi.getMessages(channelId, {
        before: pageParam as string | undefined,
        limit: 50,
      });
      return { data: res.data, hasMore: res.hasMore };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || lastPage.data.length === 0) return undefined;
      return lastPage.data[0]?.id;
    },
    enabled: !!channelId,
    refetchOnWindowFocus: false,
  });
}

export function useThread(threadId: string | null) {
  return useInfiniteQuery({
    queryKey: chatKeys.thread(threadId ?? ''),
    queryFn: async ({ pageParam }) => {
      const res = await chatApi.getThread(threadId!, {
        before: pageParam as string | undefined,
        limit: 50,
      });
      return { data: res.data, hasMore: res.hasMore };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore || lastPage.data.length <= 1) return undefined;
      return lastPage.data[1]?.id;
    },
    enabled: !!threadId,
    refetchOnWindowFocus: false,
  });
}

export function useMembers(channelId: string) {
  return useQuery({
    queryKey: chatKeys.members(channelId),
    queryFn: async () => {
      const res = await chatApi.getMembers(channelId);
      return res.data;
    },
    enabled: !!channelId,
  });
}

export function usePinnedMessages(channelId: string) {
  return useQuery({
    queryKey: chatKeys.pinned(channelId),
    queryFn: async () => {
      const res = await chatApi.getPinnedMessages(channelId);
      return res.data;
    },
    enabled: !!channelId,
  });
}

export function useSearchMessages(workspaceId: string, query: string, channelId?: string) {
  return useQuery({
    queryKey: chatKeys.search(workspaceId, query),
    queryFn: async () => {
      const res = await chatApi.searchMessages(workspaceId, query, channelId);
      return res.data;
    },
    enabled: !!workspaceId && query.length >= 2,
  });
}

export function useWorkspaceUsers(workspaceId: string) {
  return useQuery({
    queryKey: chatKeys.users(workspaceId),
    queryFn: async () => {
      const res = await chatApi.getWorkspaceUsers(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateChannelDto) => chatApi.createChannel(dto),
    onSuccess: (_data, dto) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels(dto.workspaceId) });
    },
  });
}

export function useUpdateChannel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateChannelDto }) =>
      chatApi.updateChannel(id, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'channels'] });
    },
  });
}

export function useJoinChannel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => chatApi.joinChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels(workspaceId) });
    },
  });
}

export function useLeaveChannel(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => chatApi.leaveChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels(workspaceId) });
    },
  });
}

export function useFindOrCreateDm(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetUserId: string) => chatApi.findOrCreateDm(workspaceId, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels(workspaceId) });
    },
  });
}

export function usePinMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => chatApi.pinMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.pinned(channelId) });
    },
  });
}

export function useUnpinMessage(channelId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => chatApi.unpinMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.pinned(channelId) });
    },
  });
}

// Helper to optimistically add a message to the cache
export function addMessageToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  channelId: string,
  message: ChatMessage,
) {
  queryClient.setQueryData(
    chatKeys.messages(channelId),
    (old: { pages: Array<{ data: ChatMessage[]; hasMore: boolean }>; pageParams: unknown[] } | undefined) => {
      if (!old) return old;
      const lastPage = old.pages[old.pages.length - 1];
      if (!lastPage) return old;
      // Avoid duplicates
      const exists = lastPage.data.some((m) => m.id === message.id);
      if (exists) return old;
      return {
        ...old,
        pages: [
          ...old.pages.slice(0, -1),
          { ...lastPage, data: [...lastPage.data, message] },
        ],
      };
    },
  );
}

export function updateMessageInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  channelId: string,
  messageId: string,
  updater: (msg: ChatMessage) => ChatMessage,
) {
  queryClient.setQueryData(
    chatKeys.messages(channelId),
    (old: { pages: Array<{ data: ChatMessage[]; hasMore: boolean }>; pageParams: unknown[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          data: page.data.map((msg) => (msg.id === messageId ? updater(msg) : msg)),
        })),
      };
    },
  );
}

export function removeMessageFromCache(
  queryClient: ReturnType<typeof useQueryClient>,
  channelId: string,
  messageId: string,
) {
  updateMessageInCache(queryClient, channelId, messageId, (msg) => ({
    ...msg,
    deletedAt: new Date().toISOString(),
    content: {},
    textContent: '',
  }));
}
