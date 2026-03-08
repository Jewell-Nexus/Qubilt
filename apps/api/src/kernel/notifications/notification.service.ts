import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { EventBusService } from '../events/event-bus.service';

export interface CreateNotificationDto {
  recipientId: string;
  moduleId: string;
  reason: string;
  title: string;
  body?: string;
  resourceType: string;
  resourceId: string;
  link?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    @InjectQueue('notifications') private readonly notificationQueue: Bull.Queue,
  ) {}

  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        moduleId: dto.moduleId,
        reason: dto.reason,
        title: dto.title,
        body: dto.body,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        link: dto.link,
      },
    });

    // Emit real-time event via event bus
    this.eventBus.emit('notification.created', {
      recipientId: dto.recipientId,
      notification,
    });

    // Check notification preferences for email
    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_moduleId_event: {
          userId: dto.recipientId,
          moduleId: dto.moduleId,
          event: dto.reason,
        },
      },
    });

    if (!pref || pref.email) {
      await this.notificationQueue.add('send-email', {
        notificationId: notification.id,
        recipientId: dto.recipientId,
        title: dto.title,
        body: dto.body,
      });
    }

    return notification;
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string, workspaceId?: string) {
    const where: any = {
      recipientId: userId,
      readAt: null,
    };

    if (workspaceId) {
      // Filter by notifications from modules enabled in this workspace
      const modules = await this.prisma.workspaceModule.findMany({
        where: { workspaceId, enabled: true },
        include: { installedModule: true },
      });
      const moduleIds = modules.map((m) => m.installedModule.moduleId);
      where.moduleId = { in: [...moduleIds, 'kernel'] };
    }

    await this.prisma.notification.updateMany({
      where,
      data: { readAt: new Date() },
    });
  }

  async list(
    userId: string,
    pagination: { page: number; limit: number },
    filters?: { read?: boolean; moduleId?: string },
  ) {
    const where: any = { recipientId: userId };

    if (filters?.read === true) {
      where.readAt = { not: null };
    } else if (filters?.read === false) {
      where.readAt = null;
    }

    if (filters?.moduleId) {
      where.moduleId = filters.moduleId;
    }

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, readAt: null },
    });
  }
}
