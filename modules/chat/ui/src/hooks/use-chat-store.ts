import { create } from 'zustand';
import type { ChannelWithMeta, TypingUser } from '../types/chat.types';

interface ChatState {
  activeChannelId: string | null;
  activeThreadId: string | null;
  channels: ChannelWithMeta[];
  typingUsers: Record<string, TypingUser[]>;
  onlineUsers: Set<string>;
}

interface ChatActions {
  setActiveChannel: (id: string | null) => void;
  setActiveThread: (id: string | null) => void;
  setChannels: (channels: ChannelWithMeta[]) => void;
  updateUnreadCount: (channelId: string, count: number) => void;
  incrementUnread: (channelId: string) => void;
  setTypingUsers: (channelId: string, users: TypingUser[]) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
}

export const useChatStore = create<ChatState & ChatActions>()((set) => ({
  activeChannelId: null,
  activeThreadId: null,
  channels: [],
  typingUsers: {},
  onlineUsers: new Set<string>(),

  setActiveChannel: (id) => set({ activeChannelId: id, activeThreadId: null }),
  setActiveThread: (id) => set({ activeThreadId: id }),
  setChannels: (channels) => set({ channels }),

  updateUnreadCount: (channelId, count) =>
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.id === channelId ? { ...ch, unreadCount: count } : ch,
      ),
    })),

  incrementUnread: (channelId) =>
    set((state) => ({
      channels: state.channels.map((ch) =>
        ch.id === channelId ? { ...ch, unreadCount: ch.unreadCount + 1 } : ch,
      ),
    })),

  setTypingUsers: (channelId, users) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [channelId]: users },
    })),

  setUserOnline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    }),

  setUserOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),
}));
