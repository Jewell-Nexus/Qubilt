import { io, type Socket } from 'socket.io-client';
import type { ChatMessage, TypingUser } from '../types/chat.types';

interface ServerToClientEvents {
  'message:new': (msg: ChatMessage & { authorName: string }) => void;
  'message:edited': (msg: ChatMessage) => void;
  'message:deleted': (data: { messageId: string; channelId: string }) => void;
  'reaction:updated': (data: {
    messageId: string;
    action: 'added' | 'removed';
    counts: Array<{ emoji: string; count: number; userIds: string[]; hasReacted: boolean }>;
  }) => void;
  'typing:update': (data: { channelId: string; users: TypingUser[] }) => void;
  'presence:offline': (data: { userId: string }) => void;
  'channel:read': (data: { channelId: string; readAt: string }) => void;
  'presence:pong': () => void;
}

interface ClientToServerEvents {
  'message:send': (
    dto: { channelId: string; content: unknown; textContent: string; threadId?: string; type?: string },
    cb?: (res: { success?: boolean; data?: ChatMessage; error?: string }) => void,
  ) => void;
  'message:edit': (
    dto: { messageId: string; content: unknown; textContent: string },
    cb?: (res: { success?: boolean; data?: ChatMessage; error?: string }) => void,
  ) => void;
  'message:delete': (
    dto: { messageId: string },
    cb?: (res: { success?: boolean; error?: string }) => void,
  ) => void;
  'reaction:toggle': (
    dto: { messageId: string; emoji: string },
    cb?: (res: { success?: boolean; error?: string }) => void,
  ) => void;
  'typing:start': (dto: { channelId: string }) => void;
  'typing:stop': (dto: { channelId: string }) => void;
  'channel:mark-read': (dto: { channelId: string }) => void;
  'channel:join': (dto: { channelId: string }) => void;
  'presence:ping': () => void;
}

type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

export function getChatSocket(): ChatSocket | null {
  return socket;
}

export function connectChatSocket(token: string, workspaceId: string): ChatSocket {
  if (socket?.connected) return socket;

  const baseUrl = import.meta.env.VITE_API_URL || '';
  const wsUrl = baseUrl.replace('/api/v1', '');

  socket = io(`${wsUrl}/chat`, {
    auth: { token, workspaceId },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  }) as ChatSocket;

  // Keep-alive ping every 25s
  const pingInterval = setInterval(() => {
    if (socket?.connected) {
      socket.emit('presence:ping');
    }
  }, 25000);

  socket.on('disconnect', () => {
    clearInterval(pingInterval);
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
