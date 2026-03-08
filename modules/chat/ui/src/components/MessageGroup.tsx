import { useMemo } from 'react';
import type { ChatMessage } from '../types/chat.types';

export interface MessageGroupData {
  userId: string;
  authorName: string;
  messages: ChatMessage[];
  timestamp: string;
}

export function groupMessages(messages: ChatMessage[]): MessageGroupData[] {
  const groups: MessageGroupData[] = [];
  const FIVE_MINUTES = 5 * 60 * 1000;

  for (const msg of messages) {
    const lastGroup = groups[groups.length - 1];
    const lastMsg = lastGroup?.messages[lastGroup.messages.length - 1];

    if (
      lastGroup &&
      lastGroup.userId === msg.userId &&
      lastMsg &&
      Math.abs(new Date(msg.createdAt).getTime() - new Date(lastMsg.createdAt).getTime()) < FIVE_MINUTES
    ) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({
        userId: msg.userId,
        authorName: msg.authorName ?? msg.userId.slice(0, 8),
        messages: [msg],
        timestamp: msg.createdAt,
      });
    }
  }

  return groups;
}

export function useMessageGroups(messages: ChatMessage[]): MessageGroupData[] {
  return useMemo(() => groupMessages(messages), [messages]);
}
