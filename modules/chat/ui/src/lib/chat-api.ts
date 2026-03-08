import { get, post, patch } from '@/lib/api';
import type {
  ChannelWithMeta,
  ChatChannel,
  ChatMessage,
  MessagePage,
  ChannelMember,
  CreateChannelDto,
  UpdateChannelDto,
} from '../types/chat.types';

// Channels
export function getChannels(workspaceId: string) {
  return get<{ success: boolean; data: ChannelWithMeta[] }>('/chat/channels', { workspaceId });
}

export function getChannel(id: string) {
  return get<{ success: boolean; data: ChatChannel }>(`/chat/channels/${id}`);
}

export function createChannel(dto: CreateChannelDto) {
  return post<{ success: boolean; data: ChatChannel }>('/chat/channels', dto);
}

export function updateChannel(id: string, dto: UpdateChannelDto) {
  return patch<{ success: boolean; data: ChatChannel }>(`/chat/channels/${id}`, dto);
}

export function joinChannel(id: string) {
  return post<{ success: boolean }>(`/chat/channels/${id}/join`);
}

export function leaveChannel(id: string) {
  return post<{ success: boolean }>(`/chat/channels/${id}/leave`);
}

export function findOrCreateDm(workspaceId: string, targetUserId: string) {
  return post<{ success: boolean; data: ChatChannel }>('/chat/dm', { workspaceId, targetUserId });
}

export function getMembers(channelId: string) {
  return get<{ success: boolean; data: ChannelMember[] }>(`/chat/channels/${channelId}/members`);
}

// Messages
export function getMessages(channelId: string, params?: { before?: string; after?: string; limit?: number }) {
  return get<{ success: boolean } & MessagePage>(`/chat/channels/${channelId}/messages`, params);
}

export function getThread(threadId: string, params?: { before?: string; limit?: number }) {
  return get<{ success: boolean } & MessagePage>(`/chat/messages/${threadId}/thread`, params);
}

export function getPinnedMessages(channelId: string) {
  return get<{ success: boolean; data: ChatMessage[] }>(`/chat/channels/${channelId}/pinned`);
}

export function pinMessage(id: string) {
  return post<{ success: boolean }>(`/chat/messages/${id}/pin`);
}

export function unpinMessage(id: string) {
  return post<{ success: boolean }>(`/chat/messages/${id}/unpin`);
}

export function bookmarkMessage(id: string, note?: string) {
  return post<{ success: boolean }>(`/chat/messages/${id}/bookmark`, { note });
}

export function searchMessages(workspaceId: string, q: string, channelId?: string) {
  return get<{ success: boolean; data: ChatMessage[] }>('/chat/search', { workspaceId, q, channelId });
}

// Users (for mention search / DM creation)
export function getWorkspaceUsers(workspaceId: string) {
  return get<{ success: boolean; data: Array<{ id: string; displayName: string; email: string; avatarUrl?: string }> }>(
    `/workspaces/${workspaceId}/members`,
  );
}
