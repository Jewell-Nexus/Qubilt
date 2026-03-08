import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly webhookQueue: Bull.Queue,
  ) {}

  async create(workspaceId: string, dto: CreateWebhookDto) {
    return this.prisma.webhook.create({
      data: {
        workspaceId,
        name: dto.name,
        url: dto.url,
        events: dto.events,
        secret: dto.secret || crypto.randomBytes(32).toString('hex'),
      },
    });
  }

  async update(id: string, dto: UpdateWebhookDto) {
    return this.prisma.webhook.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.prisma.webhook.delete({ where: { id } });
  }

  async list(workspaceId: string) {
    return this.prisma.webhook.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listDeliveries(
    webhookId: string,
    pagination: { page: number; limit: number },
  ) {
    const [data, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where: { webhookId },
        orderBy: { deliveredAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.webhookDelivery.count({ where: { webhookId } }),
    ]);

    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async dispatch(
    workspaceId: string,
    event: string,
    payload: Record<string, any>,
  ) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        workspaceId,
        active: true,
        events: { has: event },
      },
    });

    for (const webhook of webhooks) {
      this.webhookQueue
        .add(
          'webhook-deliver',
          {
            webhookId: webhook.id,
            url: webhook.url,
            secret: webhook.secret,
            event,
            payload,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        )
        .catch((err) => {
          this.logger.error(`Failed to queue webhook delivery: ${err}`);
        });
    }
  }

  signPayload(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }
}
