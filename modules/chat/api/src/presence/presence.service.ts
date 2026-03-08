import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class PresenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);
  private readonly redis: Redis;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('redis.url', 'redis://localhost:6379');
    this.redis = new Redis(redisUrl, { lazyConnect: true });
  }

  async onModuleInit() {
    await this.redis.connect();
    this.logger.log('Presence service connected to Redis');
  }

  async onModuleDestroy() {
    this.redis.disconnect();
  }

  async setOnline(userId: string, ttl = 30): Promise<void> {
    await this.redis.set(`user:${userId}:online`, '1', 'EX', ttl);
  }

  async setOffline(userId: string): Promise<void> {
    await this.redis.del(`user:${userId}:online`);
  }

  async isOnline(userId: string): Promise<boolean> {
    const result = await this.redis.exists(`user:${userId}:online`);
    return result === 1;
  }

  async getOnlineUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];

    const pipeline = this.redis.pipeline();
    for (const userId of userIds) {
      pipeline.exists(`user:${userId}:online`);
    }
    const results = await pipeline.exec();
    if (!results) return [];

    return userIds.filter((_, i) => results[i]?.[1] === 1);
  }

  async setTyping(channelId: string, userId: string, username: string): Promise<void> {
    await this.redis.set(`typing:${channelId}:${userId}`, username, 'EX', 5);
  }

  async clearTyping(channelId: string, userId: string): Promise<void> {
    await this.redis.del(`typing:${channelId}:${userId}`);
  }

  async getTypingUsers(channelId: string): Promise<{ userId: string; username: string }[]> {
    const keys = await this.redis.keys(`typing:${channelId}:*`);
    if (keys.length === 0) return [];

    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();
    if (!results) return [];

    return keys
      .map((key, i) => {
        const userId = key.split(':')[2];
        const username = results[i]?.[1] as string | null;
        return username ? { userId, username } : null;
      })
      .filter(Boolean) as { userId: string; username: string }[];
  }

  async clearAllTyping(userId: string): Promise<void> {
    const keys = await this.redis.keys(`typing:*:${userId}`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
