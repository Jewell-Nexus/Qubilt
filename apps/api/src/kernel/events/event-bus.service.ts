import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const CHANNEL = 'qubilt:events';

interface EventEnvelope {
  event: string;
  payload: unknown;
  timestamp: number;
}

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private readonly publisher: Redis;
  private readonly subscriber: Redis;
  private readonly handlers = new Map<string, Set<(payload: any) => void | Promise<void>>>();
  private readonly anyHandlers = new Set<(event: string, payload: unknown) => void>();

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('redis.url', 'redis://localhost:6379');
    this.publisher = new Redis(redisUrl, { lazyConnect: true });
    this.subscriber = new Redis(redisUrl, { lazyConnect: true });
  }

  async onModuleInit() {
    await Promise.all([this.publisher.connect(), this.subscriber.connect()]);
    await this.subscriber.subscribe(CHANNEL);

    this.subscriber.on('message', (_channel: string, message: string) => {
      try {
        const envelope: EventEnvelope = JSON.parse(message);
        this.dispatch(envelope.event, envelope.payload);
      } catch (err) {
        this.logger.error('Failed to parse event message', err);
      }
    });

    this.logger.log('Event bus connected to Redis');
  }

  async onModuleDestroy() {
    await this.subscriber.unsubscribe(CHANNEL);
    this.publisher.disconnect();
    this.subscriber.disconnect();
  }

  emit<T>(event: string, payload: T): void {
    const envelope: EventEnvelope = { event, payload, timestamp: Date.now() };
    this.publisher.publish(CHANNEL, JSON.stringify(envelope)).catch((err) => {
      this.logger.error(`Failed to publish event ${event}`, err);
    });
  }

  on<T>(event: string, handler: (payload: T) => void | Promise<void>): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: Function): void {
    this.handlers.get(event)?.delete(handler as any);
  }

  onAny(handler: (event: string, payload: unknown) => void): void {
    this.anyHandlers.add(handler);
  }

  private dispatch(event: string, payload: unknown): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      for (const handler of eventHandlers) {
        try {
          const result = handler(payload);
          if (result instanceof Promise) {
            result.catch((err) =>
              this.logger.error(`Handler error for ${event}`, err),
            );
          }
        } catch (err) {
          this.logger.error(`Handler error for ${event}`, err);
        }
      }
    }

    for (const handler of this.anyHandlers) {
      try {
        handler(event, payload);
      } catch (err) {
        this.logger.error('onAny handler error', err);
      }
    }
  }
}
