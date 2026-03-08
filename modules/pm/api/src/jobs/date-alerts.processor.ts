import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { NotificationService } from '@kernel/notifications/notification.service';

const PM_MODULE_ID = '@qubilt/pm';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class DateAlertsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DateAlertsProcessor.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private prisma: PmPrismaService,
    private notifications: NotificationService,
  ) {}

  onModuleInit() {
    // Schedule daily at 7am — calculate ms until next 7am, then repeat every 24h
    const now = new Date();
    const next7am = new Date(now);
    next7am.setHours(7, 0, 0, 0);
    if (next7am <= now) next7am.setDate(next7am.getDate() + 1);

    const msUntilFirst = next7am.getTime() - now.getTime();

    setTimeout(() => {
      this.checkDateAlerts();
      this.intervalId = setInterval(() => this.checkDateAlerts(), ONE_DAY_MS);
    }, msUntilFirst);

    this.logger.log(`Date alerts scheduled, first run in ${Math.round(msUntilFirst / 60000)}m`);
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  async checkDateAlerts() {
    this.logger.log('Running PM date alerts check');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    try {
      // WPs due today
      const dueToday = await this.prisma.pmWorkPackage.findMany({
        where: {
          dueDate: { gte: today, lt: tomorrow },
          deletedAt: null,
          assigneeId: { not: null },
          status: { isClosed: false },
        },
        select: { id: true, subject: true, assigneeId: true, projectId: true },
      });

      for (const wp of dueToday) {
        if (!wp.assigneeId) continue;
        await this.notify(
          wp.assigneeId,
          `Due today: ${wp.subject}`,
          wp.id,
          wp.projectId,
        );
      }

      // WPs due tomorrow
      const dueTomorrow = await this.prisma.pmWorkPackage.findMany({
        where: {
          dueDate: { gte: tomorrow, lt: dayAfterTomorrow },
          deletedAt: null,
          assigneeId: { not: null },
          status: { isClosed: false },
        },
        select: { id: true, subject: true, assigneeId: true, projectId: true },
      });

      for (const wp of dueTomorrow) {
        if (!wp.assigneeId) continue;
        await this.notify(
          wp.assigneeId,
          `Due tomorrow: ${wp.subject}`,
          wp.id,
          wp.projectId,
        );
      }

      // Overdue WPs (past due date, not closed)
      const overdue = await this.prisma.pmWorkPackage.findMany({
        where: {
          dueDate: { lt: today },
          deletedAt: null,
          assigneeId: { not: null },
          status: { isClosed: false },
        },
        select: { id: true, subject: true, assigneeId: true, projectId: true },
      });

      for (const wp of overdue) {
        if (!wp.assigneeId) continue;
        await this.notify(
          wp.assigneeId,
          `Overdue: ${wp.subject}`,
          wp.id,
          wp.projectId,
        );
      }

      this.logger.log(
        `Date alerts: ${dueToday.length} due today, ${dueTomorrow.length} due tomorrow, ${overdue.length} overdue`,
      );
    } catch (err) {
      this.logger.error(`Date alerts check failed: ${err}`);
    }
  }

  private async notify(
    recipientId: string,
    title: string,
    workPackageId: string,
    projectId: string,
  ) {
    try {
      await this.notifications.createNotification({
        recipientId,
        moduleId: PM_MODULE_ID,
        reason: 'date_alert',
        title,
        resourceType: 'work_package',
        resourceId: workPackageId,
        link: `/projects/${projectId}/work-packages/${workPackageId}`,
      });
    } catch (err) {
      this.logger.error(`Failed to create date alert notification: ${err}`);
    }
  }
}
