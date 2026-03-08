import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
type Server = any;
type Socket = any;

import { ChannelsService } from './channels/channels.service';
import { MessagesService } from './messages/messages.service';
import { ReactionsService } from './reactions/reactions.service';
import { PresenceService } from './presence/presence.service';

interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
}

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly socketUserMap = new Map<string, { userId: string; userName: string }>();

  constructor(
    private channelsService: ChannelsService,
    private messagesService: MessagesService,
    private reactionsService: ReactionsService,
    private presenceService: PresenceService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.decodeToken(token);
      if (!payload?.sub) {
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      const userName = payload.name || payload.email;

      this.socketUserMap.set(client.id, { userId, userName });

      // Join personal room
      client.join(`user:${userId}`);

      // Join rooms for all channels the user is a member of
      const channels = await this.channelsService.findAll(
        client.handshake.auth?.workspaceId ?? '',
        userId,
      );
      for (const ch of channels) {
        client.join(`channel:${ch.id}`);
      }

      // Set presence
      await this.presenceService.setOnline(userId);

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (err) {
      this.logger.warn(`Connection rejected: ${(err as Error).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return;

    this.socketUserMap.delete(client.id);

    // Clear presence
    await this.presenceService.setOffline(info.userId);

    // Clear all typing indicators
    await this.presenceService.clearAllTyping(info.userId);

    // Notify workspace rooms of offline status
    client.rooms.forEach((room: string) => {
      if (room.startsWith('channel:')) {
        this.server.to(room).emit('presence:offline', { userId: info.userId });
      }
    });

    this.logger.log(`Client disconnected: ${client.id} (user: ${info.userId})`);
  }

  @SubscribeMessage('message:send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { channelId: string; content: any; textContent: string; threadId?: string; type?: string },
  ) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return { error: 'Not authenticated' };

    // Validate membership
    const isMember = await this.channelsService.isMember(dto.channelId, info.userId);
    if (!isMember) return { error: 'Not a member of this channel' };

    const message = await this.messagesService.send(
      {
        channelId: dto.channelId,
        content: dto.content,
        textContent: dto.textContent,
        threadId: dto.threadId,
        type: (dto.type as any) ?? 'TEXT',
      },
      info.userId,
    );

    // Emit to the channel room (including sender for confirmation)
    this.server.to(`channel:${dto.channelId}`).emit('message:new', {
      ...message,
      authorName: info.userName,
    });

    // Clear typing indicator
    await this.presenceService.clearTyping(dto.channelId, info.userId);

    return { success: true, data: message };
  }

  @SubscribeMessage('message:edit')
  async handleEdit(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { messageId: string; content: any; textContent: string },
  ) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return { error: 'Not authenticated' };

    const message = await this.messagesService.edit(
      dto.messageId,
      { content: dto.content, textContent: dto.textContent },
      info.userId,
    );

    // Emit to the channel room
    this.server.to(`channel:${message.channelId}`).emit('message:edited', message);

    return { success: true, data: message };
  }

  @SubscribeMessage('message:delete')
  async handleDelete(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { messageId: string },
  ) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return { error: 'Not authenticated' };

    // Get channel before delete
    const message = await this.messagesService['prisma'].chatMessage.findUnique({
      where: { id: dto.messageId },
      select: { channelId: true },
    });

    await this.messagesService.delete(dto.messageId, info.userId);

    if (message) {
      this.server.to(`channel:${message.channelId}`).emit('message:deleted', {
        messageId: dto.messageId,
        channelId: message.channelId,
      });
    }

    return { success: true };
  }

  @SubscribeMessage('reaction:toggle')
  async handleReaction(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { messageId: string; emoji: string },
  ) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return { error: 'Not authenticated' };

    const result = await this.reactionsService.toggle(
      dto.messageId,
      info.userId,
      dto.emoji,
    );

    // Get channel for the message
    const message = await this.messagesService['prisma'].chatMessage.findUnique({
      where: { id: dto.messageId },
      select: { channelId: true },
    });

    if (message) {
      this.server.to(`channel:${message.channelId}`).emit('reaction:updated', {
        messageId: dto.messageId,
        ...result,
      });
    }

    return { success: true, data: result };
  }

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { channelId: string },
  ) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return;

    await this.presenceService.setTyping(dto.channelId, info.userId, info.userName);

    const typingUsers = await this.presenceService.getTypingUsers(dto.channelId);
    client.to(`channel:${dto.channelId}`).emit('typing:update', {
      channelId: dto.channelId,
      users: typingUsers,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { channelId: string },
  ) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return;

    await this.presenceService.clearTyping(dto.channelId, info.userId);

    const typingUsers = await this.presenceService.getTypingUsers(dto.channelId);
    client.to(`channel:${dto.channelId}`).emit('typing:update', {
      channelId: dto.channelId,
      users: typingUsers,
    });
  }

  @SubscribeMessage('channel:mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { channelId: string },
  ) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return;

    await this.channelsService.markRead(dto.channelId, info.userId);

    // Notify other sessions of this user
    this.server.to(`user:${info.userId}`).emit('channel:read', {
      channelId: dto.channelId,
      readAt: new Date().toISOString(),
    });
  }

  @SubscribeMessage('presence:ping')
  async handlePresencePing(@ConnectedSocket() client: Socket) {
    const info = this.socketUserMap.get(client.id);
    if (!info) return;

    await this.presenceService.setOnline(info.userId);
    return { event: 'presence:pong' };
  }

  // Allow joining channel rooms dynamically (e.g., after creating/joining a channel)
  @SubscribeMessage('channel:join')
  handleChannelJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: { channelId: string },
  ) {
    client.join(`channel:${dto.channelId}`);
    return { success: true };
  }

  emitToChannel(channelId: string, event: string, data: any): void {
    this.server.to(`channel:${channelId}`).emit(event, data);
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      return payload;
    } catch {
      return null;
    }
  }
}
