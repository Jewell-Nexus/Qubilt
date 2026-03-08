import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { JobQueueService } from './job-queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('redis.url', 'redis://localhost:6379'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'email' },
      { name: 'storage' },
      { name: 'search-index' },
    ),
  ],
  providers: [JobQueueService],
  exports: [JobQueueService, BullModule],
})
export class JobsModule {}
