export const ChatEvents = {
  MESSAGE_NEW: 'chat.message.new',
  CHANNEL_CREATED: 'chat.channel.created',
  DM_RECEIVED: 'chat.dm.received',
} as const;

export interface ChatEventPayloads {
  'chat.message.new': {
    messageId: string;
    channelId: string;
    userId: string;
    mentionedIds: string[];
  };
  'chat.channel.created': {
    channelId: string;
    workspaceId: string;
  };
  'chat.dm.received': {
    messageId: string;
    channelId: string;
    senderId: string;
    recipientId: string;
  };
}
