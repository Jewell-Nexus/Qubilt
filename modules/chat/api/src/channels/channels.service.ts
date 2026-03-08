import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ChatPrismaService } from '../prisma/chat-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { PresenceService } from '../presence/presence.service';
import { ChatEvents } from '@qubilt/module-sdk/chat.events';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

export interface ChannelWithMeta {
  id: string;
  name: string;
  description: string | null;
  type: string;
  icon: string | null;
  isReadonly: boolean;
  isArchived: boolean;
  createdAt: Date;
  unreadCount: number;
  lastMessage: {
    id: string;
    textContent: string;
    userId: string;
    createdAt: Date;
  } | null;
  memberCount: number;
  isOnline?: boolean;
}

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: ChatPrismaService,
    private eventBus: EventBusService,
    private presenceService: PresenceService,
  ) {}

  async create(dto: CreateChannelDto, creatorId: string) {
    // For DIRECT channels, check if DM already exists
    if (dto.type === 'DIRECT' && dto.memberIds?.length === 1) {
      const existing = await this.findExistingDm(
        dto.workspaceId,
        creatorId,
        dto.memberIds[0],
      );
      if (existing) return existing;
    }

    const channel = await this.prisma.chatChannel.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        icon: dto.icon,
        createdBy: creatorId,
        members: {
          create: [
            { userId: creatorId, role: 'OWNER' },
            ...(dto.memberIds?.map((id) => ({ userId: id, role: 'MEMBER' as const })) ?? []),
          ],
        },
      },
      include: { members: true },
    });

    if (dto.type === 'PUBLIC') {
      this.eventBus.emit(ChatEvents.CHANNEL_CREATED, {
        channelId: channel.id,
        workspaceId: dto.workspaceId,
      });
    }

    return channel;
  }

  async findAll(workspaceId: string, userId: string): Promise<ChannelWithMeta[]> {
    const memberships = await this.prisma.chatChannelMember.findMany({
      where: { userId },
      include: {
        channel: {
          include: {
            _count: { select: { members: true } },
            messages: {
              where: { deletedAt: null },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { id: true, textContent: true, userId: true, createdAt: true },
            },
            members: {
              where: { userId: { not: userId } },
              take: 1,
              select: { userId: true },
            },
          },
        },
      },
    });

    const channels: ChannelWithMeta[] = [];

    for (const membership of memberships) {
      const ch = membership.channel;
      if (ch.workspaceId !== workspaceId) continue;

      // Count unread messages since lastReadAt
      const unreadCount = await this.prisma.chatMessage.count({
        where: {
          channelId: ch.id,
          createdAt: { gt: membership.lastReadAt },
          deletedAt: null,
          userId: { not: userId },
        },
      });

      // For DM channels, check if the other user is online
      let isOnline: boolean | undefined;
      if (ch.type === 'DIRECT' && ch.members.length > 0) {
        isOnline = await this.presenceService.isOnline(ch.members[0].userId);
      }

      channels.push({
        id: ch.id,
        name: ch.name,
        description: ch.description,
        type: ch.type,
        icon: ch.icon,
        isReadonly: ch.isReadonly,
        isArchived: ch.isArchived,
        createdAt: ch.createdAt,
        unreadCount,
        lastMessage: ch.messages[0] ?? null,
        memberCount: ch._count.members,
        isOnline,
      });
    }

    return channels;
  }

  async findOne(id: string) {
    const channel = await this.prisma.chatChannel.findUnique({
      where: { id },
      include: {
        members: true,
        _count: { select: { members: true } },
      },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async findOrCreateDm(workspaceId: string, userA: string, userB: string) {
    const existing = await this.findExistingDm(workspaceId, userA, userB);
    if (existing) return existing;

    return this.prisma.chatChannel.create({
      data: {
        workspaceId,
        name: 'Direct Message',
        type: 'DIRECT',
        createdBy: userA,
        members: {
          create: [
            { userId: userA, role: 'MEMBER' },
            { userId: userB, role: 'MEMBER' },
          ],
        },
      },
      include: { members: true },
    });
  }

  async join(channelId: string, userId: string) {
    const channel = await this.findOne(channelId);
    if (channel.type !== 'PUBLIC') {
      throw new ForbiddenException('Can only join public channels');
    }

    // Check if already a member
    const existing = await this.prisma.chatChannelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (existing) return existing;

    return this.prisma.chatChannelMember.create({
      data: { channelId, userId, role: 'MEMBER' },
    });
  }

  async leave(channelId: string, userId: string) {
    await this.prisma.chatChannelMember.delete({
      where: { channelId_userId: { channelId, userId } },
    });

    // If last member, archive channel
    const remaining = await this.prisma.chatChannelMember.count({
      where: { channelId },
    });
    if (remaining === 0) {
      await this.prisma.chatChannel.update({
        where: { id: channelId },
        data: { isArchived: true },
      });
    }
  }

  async markRead(channelId: string, userId: string) {
    await this.prisma.chatChannelMember.update({
      where: { channelId_userId: { channelId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  async update(id: string, dto: UpdateChannelDto) {
    const channel = await this.prisma.chatChannel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');

    return this.prisma.chatChannel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isReadonly !== undefined && { isReadonly: dto.isReadonly }),
        ...(dto.isArchived !== undefined && { isArchived: dto.isArchived }),
      },
    });
  }

  async archive(id: string) {
    await this.prisma.chatChannel.update({
      where: { id },
      data: { isArchived: true },
    });
  }

  async getMembers(channelId: string) {
    return this.prisma.chatChannelMember.findMany({
      where: { channelId },
    });
  }

  async isMember(channelId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.chatChannelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    return !!member;
  }

  private async findExistingDm(workspaceId: string, userA: string, userB: string) {
    // Find a DIRECT channel where both users are members
    const channels = await this.prisma.chatChannel.findMany({
      where: {
        workspaceId,
        type: 'DIRECT',
        members: { some: { userId: userA } },
      },
      include: { members: true },
    });

    return channels.find((ch) =>
      ch.members.some((m) => m.userId === userB),
    ) ?? null;
  }
}
