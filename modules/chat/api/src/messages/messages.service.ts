import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ChatPrismaService } from '../prisma/chat-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { NotificationService } from '@kernel/notifications/notification.service';
import { ChatEvents } from '@qubilt/module-sdk/chat.events';
import { ChatIndexerService } from '../search/chat-indexer.service';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';

export interface CursorPagination {
  before?: string;
  after?: string;
  limit: number;
}

export interface MessagePage {
  data: any[];
  hasMore: boolean;
}

@Injectable()
export class MessagesService {
  constructor(
    private prisma: ChatPrismaService,
    private eventBus: EventBusService,
    private notificationService: NotificationService,
    private chatIndexer: ChatIndexerService,
  ) {}

  async send(dto: SendMessageDto, userId: string) {
    // Validate thread parent is in the same channel
    if (dto.threadId) {
      const parent = await this.prisma.chatMessage.findUnique({
        where: { id: dto.threadId },
      });
      if (!parent || parent.channelId !== dto.channelId) {
        throw new NotFoundException('Thread parent message not found in this channel');
      }
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        channelId: dto.channelId,
        userId,
        threadId: dto.threadId,
        content: dto.content,
        textContent: dto.textContent,
        type: dto.type ?? 'TEXT',
      },
    });

    // Extract @mentions from textContent (pattern: @[userId])
    const mentionRegex = /@\[([a-z0-9]+)\]/gi;
    const mentionedIds: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(dto.textContent)) !== null) {
      mentionedIds.push(match[1]);
    }

    // Emit event bus event
    this.eventBus.emit(ChatEvents.MESSAGE_NEW, {
      messageId: message.id,
      channelId: dto.channelId,
      userId,
      mentionedIds,
    });

    // Create notifications for mentioned users
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: dto.channelId },
    });

    for (const mentionedId of mentionedIds) {
      if (mentionedId !== userId) {
        this.notificationService.createNotification({
          recipientId: mentionedId,
          moduleId: '@qubilt/chat',
          reason: 'mention',
          title: `You were mentioned in #${channel?.name ?? 'chat'}`,
          body: dto.textContent.substring(0, 200),
          resourceType: 'chat_message',
          resourceId: message.id,
          link: `/chat/channels/${dto.channelId}?messageId=${message.id}`,
        });
      }
    }

    // Emit DM notification for DIRECT channels
    if (channel?.type === 'DIRECT') {
      const members = await this.prisma.chatChannelMember.findMany({
        where: { channelId: dto.channelId },
      });
      const recipient = members.find((m) => m.userId !== userId);
      if (recipient) {
        this.eventBus.emit(ChatEvents.DM_RECEIVED, {
          messageId: message.id,
          channelId: dto.channelId,
          senderId: userId,
          recipientId: recipient.userId,
        });
      }
    }

    // Index in Meilisearch
    if (this.chatIndexer.enabled) {
      this.chatIndexer.indexMessage({
        id: message.id,
        workspaceId: channel?.workspaceId ?? '',
        channelId: dto.channelId,
        userId,
        authorName: '', // Will be enriched by the gateway/controller
        textContent: dto.textContent,
        createdAt: message.createdAt.toISOString(),
      });
    }

    return message;
  }

  async findMessages(channelId: string, pagination: CursorPagination): Promise<MessagePage> {
    const limit = Math.min(pagination.limit || 50, 100);
    const where: any = { channelId, deletedAt: null };

    if (pagination.before) {
      const cursor = await this.prisma.chatMessage.findUnique({
        where: { id: pagination.before },
        select: { createdAt: true },
      });
      if (cursor) {
        where.createdAt = { lt: cursor.createdAt };
      }
    } else if (pagination.after) {
      const cursor = await this.prisma.chatMessage.findUnique({
        where: { id: pagination.after },
        select: { createdAt: true },
      });
      if (cursor) {
        where.createdAt = { gt: cursor.createdAt };
      }
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: pagination.after ? 'asc' : 'desc' },
      take: limit + 1,
      include: {
        reactions: true,
        attachments: true,
        _count: { select: { replies: true } },
      },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;

    // Reverse if paginating forward (after cursor) so newest is last
    if (!pagination.after) {
      data.reverse();
    }

    return {
      data: data.map((msg) => ({
        ...msg,
        isEdited: msg.editedAt !== null,
        threadReplyCount: msg._count.replies,
        reactionCounts: this.aggregateReactions(msg.reactions),
      })),
      hasMore,
    };
  }

  async findThread(threadId: string, pagination: CursorPagination): Promise<MessagePage> {
    // Load parent message
    const parent = await this.prisma.chatMessage.findUnique({
      where: { id: threadId },
      include: {
        reactions: true,
        attachments: true,
        _count: { select: { replies: true } },
      },
    });
    if (!parent) throw new NotFoundException('Thread not found');

    const limit = Math.min(pagination.limit || 50, 100);
    const where: any = { threadId, deletedAt: null };

    if (pagination.before) {
      const cursor = await this.prisma.chatMessage.findUnique({
        where: { id: pagination.before },
        select: { createdAt: true },
      });
      if (cursor) {
        where.createdAt = { lt: cursor.createdAt };
      }
    }

    const replies = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      include: {
        reactions: true,
        attachments: true,
      },
    });

    const hasMore = replies.length > limit;
    const data = hasMore ? replies.slice(0, limit) : replies;

    return {
      data: [
        {
          ...parent,
          isEdited: parent.editedAt !== null,
          threadReplyCount: parent._count.replies,
          reactionCounts: this.aggregateReactions(parent.reactions),
        },
        ...data.map((msg) => ({
          ...msg,
          isEdited: msg.editedAt !== null,
          reactionCounts: this.aggregateReactions(msg.reactions),
        })),
      ],
      hasMore,
    };
  }

  async edit(id: string, dto: EditMessageDto, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.userId !== userId) {
      throw new ForbiddenException('Can only edit your own messages');
    }

    const updated = await this.prisma.chatMessage.update({
      where: { id },
      data: {
        content: dto.content,
        textContent: dto.textContent,
        editedAt: new Date(),
      },
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.userId !== userId) {
      throw new ForbiddenException('Can only delete your own messages');
    }

    await this.prisma.chatMessage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        content: {},
        textContent: '',
      },
    });

    if (this.chatIndexer.enabled) {
      this.chatIndexer.deleteMessage(id);
    }
  }

  async pin(messageId: string, userId: string) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');

    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: true },
    });
  }

  async unpin(messageId: string) {
    await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: false },
    });
  }

  async getPinned(channelId: string) {
    return this.prisma.chatMessage.findMany({
      where: { channelId, isPinned: true, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { reactions: true, attachments: true },
    });
  }

  async bookmark(messageId: string, userId: string, note?: string) {
    await this.prisma.chatBookmark.upsert({
      where: { messageId_userId: { messageId, userId } },
      update: { note },
      create: { messageId, userId, note },
    });
  }

  async getBookmarks(userId: string) {
    return this.prisma.chatBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: { attachments: true },
        },
      },
    });
  }

  async search(workspaceId: string, query: string, userId: string, channelId?: string) {
    // Use Meilisearch if available
    if (this.chatIndexer.enabled) {
      const hits = await this.chatIndexer.search(workspaceId, query, channelId);

      // Filter: only return messages from channels the user is a member of
      const channelIds = (
        await this.prisma.chatChannelMember.findMany({
          where: { userId },
          select: { channelId: true },
        })
      ).map((m) => m.channelId);

      return hits.filter((h) => channelIds.includes(h.channelId));
    }

    // Fallback to ILIKE search
    const channelIds = (
      await this.prisma.chatChannelMember.findMany({
        where: { userId },
        select: { channelId: true },
      })
    ).map((m) => m.channelId);

    const where: any = {
      channelId: { in: channelIds },
      deletedAt: null,
      textContent: { contains: query, mode: 'insensitive' },
    };

    if (channelId) {
      where.channelId = channelId;
    }

    return this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { attachments: true },
    });
  }

  private aggregateReactions(
    reactions: { emoji: string; userId: string }[],
  ): { emoji: string; count: number; userIds: string[] }[] {
    const map = new Map<string, string[]>();
    for (const r of reactions) {
      if (!map.has(r.emoji)) map.set(r.emoji, []);
      map.get(r.emoji)!.push(r.userId);
    }
    return Array.from(map.entries()).map(([emoji, userIds]) => ({
      emoji,
      count: userIds.length,
      userIds,
    }));
  }
}
