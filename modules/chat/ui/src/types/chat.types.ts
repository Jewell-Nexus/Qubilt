export type ChannelType = 'PUBLIC' | 'PRIVATE' | 'DIRECT';
export type ChannelRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MessageType = 'TEXT' | 'SYSTEM' | 'FILE';

export interface ChatChannel {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  type: ChannelType;
  icon: string | null;
  isReadonly: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelWithMeta {
  id: string;
  name: string;
  description: string | null;
  type: ChannelType;
  icon: string | null;
  isReadonly: boolean;
  isArchived: boolean;
  createdAt: string;
  unreadCount: number;
  lastMessage: {
    id: string;
    textContent: string;
    userId: string;
    createdAt: string;
  } | null;
  memberCount: number;
  isOnline?: boolean;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  threadId: string | null;
  content: unknown;
  textContent: string;
  type: MessageType;
  isPinned: boolean;
  isEdited: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  authorName?: string;
  threadReplyCount?: number;
  reactionCounts?: ReactionCount[];
  attachments?: ChatAttachment[];
}

export interface MessagePage {
  data: ChatMessage[];
  hasMore: boolean;
}

export interface ChannelMember {
  id: string;
  channelId: string;
  userId: string;
  role: ChannelRole;
  lastReadAt: string;
  joinedAt: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface CreateChannelDto {
  workspaceId: string;
  name: string;
  description?: string;
  type: ChannelType;
  icon?: string;
  memberIds?: string[];
}

export interface UpdateChannelDto {
  name?: string;
  description?: string;
  icon?: string;
  isReadonly?: boolean;
  isArchived?: boolean;
}

export interface TypingUser {
  id: string;
  name: string;
}
