import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.APP_URL || 'http://localhost:3000',
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly redis: Redis;
  private readonly socketUserMap = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const redisUrl = this.configService.get<string>(
      'redis.url',
      'redis://localhost:6379',
    );
    this.redis = new Redis(redisUrl);
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth as any)?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store mapping
      this.socketUserMap.set(client.id, userId);

      // Join user and workspace rooms
      client.join(`user:${userId}`);

      // If workspace info is provided in auth
      const workspaceId = (client.handshake.auth as any)?.workspaceId;
      if (workspaceId) {
        client.join(`workspace:${workspaceId}`);
      }

      // Set presence in Redis
      await this.redis.set(`user:${userId}:online`, '1', 'EX', 30);

      this.logger.log(`Client connected: ${userId}`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.socketUserMap.delete(client.id);
      await this.redis.del(`user:${userId}:online`);

      // Notify workspace rooms of offline status
      client.rooms.forEach((room) => {
        if (room.startsWith('workspace:')) {
          this.server.to(room).emit('user:offline', { userId });
        }
      });

      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  @SubscribeMessage('join:project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    client.join(`project:${projectId}`);
    return { event: 'join:project', data: { projectId } };
  }

  @SubscribeMessage('leave:project')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    client.leave(`project:${projectId}`);
    return { event: 'leave:project', data: { projectId } };
  }

  @SubscribeMessage('presence:ping')
  async handlePresencePing(@ConnectedSocket() client: Socket) {
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      await this.redis.set(`user:${userId}:online`, '1', 'EX', 30);
    }
    return { event: 'presence:pong' };
  }

  emitToUser(userId: string, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToWorkspace(workspaceId: string, event: string, data: any): void {
    this.server.to(`workspace:${workspaceId}`).emit(event, data);
  }
}
