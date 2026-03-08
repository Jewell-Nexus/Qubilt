import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from '../events/event-bus.service';
import { EmailService, EmailTemplate } from '../email/email.service';
import { KernelEvents } from '../events/kernel.events';

@Injectable()
export class InvitationListener implements OnModuleInit {
  private readonly logger = new Logger(InvitationListener.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.eventBus.on<{
      workspaceId: string;
      workspaceName: string;
      email: string;
      invitedBy: string;
      token: string;
    }>(KernelEvents.INVITATION_SENT, async (payload) => {
      try {
        const appUrl = this.configService.get<string>('app.url');
        const acceptUrl = `${appUrl}/invitations/${payload.token}/accept`;

        await this.emailService.sendTemplate(
          payload.email,
          EmailTemplate.INVITATION,
          {
            workspaceName: payload.workspaceName,
            acceptUrl,
          },
        );

        this.logger.log(`Invitation email sent to ${payload.email}`);
      } catch (err) {
        this.logger.error(
          `Failed to send invitation email to ${payload.email}`,
          err,
        );
      }
    });
  }
}
