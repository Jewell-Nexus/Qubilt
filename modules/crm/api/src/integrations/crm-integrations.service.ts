import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBusService } from '@kernel/events/event-bus.service';
import { CrmPrismaService } from '../prisma/crm-prisma.service';
import { ActivitiesService } from '../activities/activities.service';
import { PmEvents } from '@qubilt/module-sdk/pm.events';

@Injectable()
export class CrmIntegrationsService implements OnModuleInit {
  private readonly logger = new Logger(CrmIntegrationsService.name);

  constructor(
    private eventBus: EventBusService,
    private prisma: CrmPrismaService,
    private activitiesService: ActivitiesService,
  ) {}

  onModuleInit() {
    // Listen for PM work_package.created events
    this.eventBus.on<any>(PmEvents.WORK_PACKAGE_CREATED, async (payload) => {
      try {
        await this.handleWorkPackageCreated(payload);
      } catch (err) {
        this.logger.error('Failed to handle PM work_package.created event', err);
      }
    });
  }

  private async handleWorkPackageCreated(payload: {
    workPackageId: string;
    projectId: string;
    typeId: string;
    authorId: string;
    metadata?: { linkedDealId?: string };
  }) {
    const linkedDealId = payload.metadata?.linkedDealId;
    if (!linkedDealId) return;

    // Verify the deal exists
    const deal = await this.prisma.crmDeal.findUnique({
      where: { id: linkedDealId },
    });
    if (!deal) return;

    await this.activitiesService.create({
      workspaceId: deal.workspaceId,
      type: 'TASK',
      subject: `Work package created: ${payload.workPackageId}`,
      dealId: linkedDealId,
      contactId: deal.contactId,
      userId: payload.authorId,
    });

    this.logger.log(`Created CRM activity for linked WP ${payload.workPackageId} → Deal ${linkedDealId}`);
  }
}
