import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { connectChatSocket, disconnectChatSocket, getChatSocket } from '../lib/chat-socket';
import { useChatStore } from './use-chat-store';
import { chatKeys, addMessageToCache, updateMessageInCache, removeMessageFromCache } from './use-chat-queries';

export function useChatSocket(workspaceId: string) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);
  const userId = useAuthStore((s) => s.user?.id);
  const activeChannelId = useChatStore((s) => s.activeChannelId);
  const setTypingUsers = useChatStore((s) => s.setTypingUsers);
  const setUserOffline = useChatStore((s) => s.setUserOffline);
  const incrementUnread = useChatStore((s) => s.incrementUnread);
  const updateUnreadCount = useChatStore((s) => s.updateUnreadCount);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!accessToken || !workspaceId) return;

    const socket = connectChatSocket(accessToken, workspaceId);
    connectedRef.current = true;

    socket.on('message:new', (msg) => {
      const currentChannel = useChatStore.getState().activeChannelId;
      if (msg.channelId === currentChannel) {
        addMessageToCache(queryClient, msg.channelId, msg);
      } else {
        incrementUnread(msg.channelId);
      }
      // Also invalidate channels to update lastMessage
      queryClient.invalidateQueries({ queryKey: chatKeys.channels(workspaceId) });
    });

    socket.on('message:edited', (msg) => {
      updateMessageInCache(queryClient, msg.channelId, msg.id, () => ({
        ...msg,
        isEdited: true,
      }));
    });

    socket.on('message:deleted', ({ messageId, channelId }) => {
      removeMessageFromCache(queryClient, channelId, messageId);
    });

    socket.on('reaction:updated', ({ messageId, counts }) => {
      // We need to find which channel this message is in — search all cached pages
      const currentChannel = useChatStore.getState().activeChannelId;
      if (currentChannel) {
        updateMessageInCache(queryClient, currentChannel, messageId, (msg) => ({
          ...msg,
          reactionCounts: counts.map((c) => ({
            emoji: c.emoji,
            count: c.count,
            userIds: c.userIds,
          })),
        }));
      }
      // Also update thread if open
      const threadId = useChatStore.getState().activeThreadId;
      if (threadId) {
        queryClient.setQueryData(
          chatKeys.thread(threadId),
          (old: { pages: Array<{ data: Array<{ id: string }>; hasMore: boolean }>; pageParams: unknown[] } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) =>
                  msg.id === messageId
                    ? { ...msg, reactionCounts: counts.map((c) => ({ emoji: c.emoji, count: c.count, userIds: c.userIds })) }
                    : msg,
                ),
              })),
            };
          },
        );
      }
    });

    socket.on('typing:update', ({ channelId, users }) => {
      // Filter out current user from typing indicators
      const filtered = users.filter((u) => u.id !== userId);
      setTypingUsers(channelId, filtered);
    });

    socket.on('presence:offline', ({ userId: offlineUserId }) => {
      setUserOffline(offlineUserId);
    });

    socket.on('channel:read', ({ channelId }) => {
      updateUnreadCount(channelId, 0);
    });

    return () => {
      if (connectedRef.current) {
        disconnectChatSocket();
        connectedRef.current = false;
      }
    };
  }, [accessToken, workspaceId, userId, queryClient, setTypingUsers, setUserOffline, incrementUnread, updateUnreadCount]);

  // Mark channel as read when switching
  useEffect(() => {
    if (!activeChannelId) return;
    const socket = getChatSocket();
    if (socket?.connected) {
      socket.emit('channel:mark-read', { channelId: activeChannelId });
    }
    updateUnreadCount(activeChannelId, 0);
  }, [activeChannelId, updateUnreadCount]);
}

export function useSendTyping(channelId: string | null) {
  const lastTypingRef = useRef(0);

  return () => {
    if (!channelId) return;
    const now = Date.now();
    if (now - lastTypingRef.current < 3000) return;
    lastTypingRef.current = now;
    const socket = getChatSocket();
    if (socket?.connected) {
      socket.emit('typing:start', { channelId });
    }
  };
}

export function useStopTyping(channelId: string | null) {
  return () => {
    if (!channelId) return;
    const socket = getChatSocket();
    if (socket?.connected) {
      socket.emit('typing:stop', { channelId });
    }
  };
}
