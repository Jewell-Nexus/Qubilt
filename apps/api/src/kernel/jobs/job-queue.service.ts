import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Cron } from '@nestjs/schedule';
import * as Bull from 'bull';
import { PrismaService } from '../../database/prisma.service';

export interface NotificationJobData {
  notificationId: string;
  recipientId: string;
  title: string;
  body?: string;
}

export interface EmailJobData {
  to: string;
  subject: string;
  template?: string;
  context?: Record<string, any>;
  html?: string;
}

export interface SearchIndexJobData {
  entityType: string;
  entityId: string;
  action: 'index' | 'delete';
}

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Bull.Queue,
    @InjectQueue('email') private readonly emailQueue: Bull.Queue,
    @InjectQueue('storage') private readonly storageQueue: Bull.Queue,
    @InjectQueue('search-index') private readonly searchIndexQueue: Bull.Queue,
    private readonly prisma: PrismaService,
  ) {}

  async addNotificationJob(data: NotificationJobData, options?: Bull.JobOptions) {
    return this.notificationsQueue.add('send-email', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      ...options,
    });
  }

  async addEmailJob(data: EmailJobData, options?: Bull.JobOptions) {
    return this.emailQueue.add('send', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      ...options,
    });
  }

  addSearchIndexJob(
    entityType: string,
    entityId: string,
    action: 'index' | 'delete',
  ): void {
    this.searchIndexQueue
      .add('process', { entityType, entityId, action } as SearchIndexJobData, {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
      })
      .catch((err) => {
        this.logger.error(`Failed to queue search index job: ${err}`);
      });
  }

  @Cron('0 8 * * *')
  async sendDailyDigests() {
    this.logger.log('Queueing daily notification digests');

    const users = await this.prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        notifications: { some: { readAt: null } },
      },
      select: { id: true },
    });

    for (const user of users) {
      await this.notificationsQueue.add('send-digest', { userId: user.id }, {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      });
    }

    this.logger.log(`Queued digest jobs for ${users.length} users`);
  }
}
