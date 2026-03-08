import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import * as Bull from 'bull';
import { PrismaService } from '../../database/prisma.service';
import { EmailService, EmailTemplate } from '../email/email.service';

@Processor('notifications')
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Process('send-email')
  async handleSendEmail(
    job: Bull.Job<{ notificationId: string; recipientId: string; title: string; body?: string }>,
  ) {
    const { notificationId, recipientId } = job.data;

    const user = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { email: true, displayName: true },
    });

    if (!user) {
      this.logger.warn(`User ${recipientId} not found for notification email`);
      return;
    }

    try {
      await this.emailService.sendRaw(
        user.email,
        job.data.title,
        `<p>${job.data.body || job.data.title}</p>`,
      );

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { emailSent: true },
      });
    } catch (err) {
      this.logger.error(`Failed to send notification email: ${err}`);
      throw err;
    }
  }

  @Process('send-digest')
  async handleSendDigest(
    job: Bull.Job<{ userId: string }>,
  ) {
    const { userId } = job.data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true },
    });

    if (!user) return;

    const unread = await this.prisma.notification.findMany({
      where: { recipientId: userId, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (unread.length === 0) return;

    const digestContent = unread
      .map((n) => `- ${n.title}`)
      .join('<br/>');

    await this.emailService.sendTemplate(user.email, EmailTemplate.NOTIFICATION_DIGEST, {
      displayName: user.displayName,
      unreadCount: unread.length,
      digestContent,
    });
  }
}
