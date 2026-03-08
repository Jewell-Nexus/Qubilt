import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatPrismaService } from '../prisma/chat-prisma.service';

export interface ReactionCount {
  emoji: string;
  count: number;
  userIds: string[];
  hasReacted: boolean;
}

export interface ReactionResult {
  action: 'added' | 'removed';
  counts: ReactionCount[];
}

@Injectable()
export class ReactionsService {
  constructor(private prisma: ChatPrismaService) {}

  async toggle(messageId: string, userId: string, emoji: string): Promise<ReactionResult> {
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    const existing = await this.prisma.chatReaction.findUnique({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
    });

    let action: 'added' | 'removed';

    if (existing) {
      await this.prisma.chatReaction.delete({
        where: { id: existing.id },
      });
      action = 'removed';
    } else {
      await this.prisma.chatReaction.create({
        data: { messageId, userId, emoji },
      });
      action = 'added';
    }

    const counts = await this.getReactions(messageId, userId);
    return { action, counts };
  }

  async getReactions(messageId: string, currentUserId?: string): Promise<ReactionCount[]> {
    const reactions = await this.prisma.chatReaction.findMany({
      where: { messageId },
    });

    const map = new Map<string, string[]>();
    for (const r of reactions) {
      if (!map.has(r.emoji)) map.set(r.emoji, []);
      map.get(r.emoji)!.push(r.userId);
    }

    return Array.from(map.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds,
      hasReacted: currentUserId ? userIds.includes(currentUserId) : false,
    }));
  }
}
