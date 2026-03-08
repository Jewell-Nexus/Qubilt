import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CrmPrismaService } from '../prisma/crm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { CrmEvents } from '@qubilt/module-sdk/crm.events';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { FilterDealsDto } from './dto/filter-deals.dto';
import { ActivitiesService } from '../activities/activities.service';
import type { PaginatedResult } from '@qubilt/shared/types';

@Injectable()
export class DealsService {
  constructor(
    private prisma: CrmPrismaService,
    private eventBus: EventBusService,
    private activitiesService: ActivitiesService,
  ) {}

  async create(dto: CreateDealDto, userId: string) {
    // Find the first stage of the pipeline
    const firstStage = await this.prisma.crmPipelineStage.findFirst({
      where: { pipelineId: dto.pipelineId },
      orderBy: { position: 'asc' },
    });
    if (!firstStage) {
      throw new NotFoundException('Pipeline has no stages');
    }

    const deal = await this.prisma.crmDeal.create({
      data: {
        workspaceId: dto.workspaceId,
        pipelineId: dto.pipelineId,
        stageId: firstStage.id,
        contactId: dto.contactId,
        name: dto.name,
        value: dto.value ?? 0,
        currency: dto.currency ?? 'USD',
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        ownerId: dto.ownerId,
        customData: dto.customData ?? undefined,
      },
      include: {
        stage: true,
        contact: true,
        pipeline: true,
      },
    });

    // Auto-create "Deal created" activity
    await this.activitiesService.create({
      workspaceId: dto.workspaceId,
      type: 'NOTE',
      subject: `Deal created: ${deal.name}`,
      contactId: dto.contactId,
      dealId: deal.id,
      userId,
    });

    this.eventBus.emit(CrmEvents.DEAL_CREATED, {
      dealId: deal.id,
      workspaceId: deal.workspaceId,
      contactId: deal.contactId,
      value: Number(deal.value),
    });

    return deal;
  }

  async findAll(filters: FilterDealsDto): Promise<PaginatedResult<any>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId: filters.workspaceId,
    };

    if (filters.pipelineId) where.pipelineId = filters.pipelineId;
    if (filters.stageId) where.stageId = filters.stageId;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.status) where.status = filters.status;
    if (filters.contactId) where.contactId = filters.contactId;

    if (filters.valueMin !== undefined || filters.valueMax !== undefined) {
      where.value = {};
      if (filters.valueMin !== undefined) where.value.gte = filters.valueMin;
      if (filters.valueMax !== undefined) where.value.lte = filters.valueMax;
    }

    if (filters.closeDateFrom || filters.closeDateTo) {
      where.expectedCloseDate = {};
      if (filters.closeDateFrom) where.expectedCloseDate.gte = new Date(filters.closeDateFrom);
      if (filters.closeDateTo) where.expectedCloseDate.lte = new Date(filters.closeDateTo);
    }

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.crmDeal.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          stage: { select: { id: true, name: true, color: true, probability: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
          pipeline: { select: { id: true, name: true } },
        },
      }),
      this.prisma.crmDeal.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByPipeline(pipelineId: string) {
    const pipeline = await this.prisma.crmPipeline.findUnique({
      where: { id: pipelineId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: {
            deals: {
              where: { status: 'OPEN' },
              include: {
                contact: { select: { id: true, firstName: true, lastName: true, company: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!pipeline) throw new NotFoundException('Pipeline not found');

    return {
      pipeline: { id: pipeline.id, name: pipeline.name },
      stages: pipeline.stages.map((s) => ({
        stage: {
          id: s.id,
          name: s.name,
          position: s.position,
          probability: s.probability,
          color: s.color,
          isWon: s.isWon,
          isClosed: s.isClosed,
        },
        deals: s.deals,
      })),
    };
  }

  async findOne(id: string) {
    const deal = await this.prisma.crmDeal.findUnique({
      where: { id },
      include: {
        stage: true,
        pipeline: { include: { stages: { orderBy: { position: 'asc' } } } },
        contact: true,
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
        notes: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }

  async moveStage(dealId: string, targetStageId: string, userId: string) {
    const deal = await this.prisma.crmDeal.findUnique({
      where: { id: dealId },
      include: { stage: true },
    });
    if (!deal) throw new NotFoundException('Deal not found');

    const targetStage = await this.prisma.crmPipelineStage.findUnique({
      where: { id: targetStageId },
    });
    if (!targetStage) throw new NotFoundException('Target stage not found');

    const updateData: any = { stageId: targetStageId };

    if (targetStage.isWon) {
      updateData.status = 'WON';
      updateData.closedAt = new Date();
    } else if (targetStage.isClosed && !targetStage.isWon) {
      updateData.status = 'LOST';
      updateData.closedAt = new Date();
    }

    const updated = await this.prisma.crmDeal.update({
      where: { id: dealId },
      data: updateData,
      include: { stage: true, contact: true },
    });

    // Auto-create stage change activity
    await this.activitiesService.create({
      workspaceId: deal.workspaceId,
      type: 'NOTE',
      subject: `Stage changed: ${deal.stage.name} → ${targetStage.name}`,
      contactId: deal.contactId,
      dealId: deal.id,
      userId,
    });

    // Emit events
    this.eventBus.emit(CrmEvents.DEAL_STAGE_CHANGED, {
      dealId: deal.id,
      workspaceId: deal.workspaceId,
      fromStageId: deal.stageId,
      toStageId: targetStageId,
      fromStageName: deal.stage.name,
      toStageName: targetStage.name,
    });

    if (targetStage.isWon) {
      this.eventBus.emit(CrmEvents.DEAL_CLOSED_WON, {
        dealId: deal.id,
        workspaceId: deal.workspaceId,
        contactId: deal.contactId,
        value: Number(deal.value),
      });
    } else if (targetStage.isClosed) {
      this.eventBus.emit(CrmEvents.DEAL_CLOSED_LOST, {
        dealId: deal.id,
        workspaceId: deal.workspaceId,
        contactId: deal.contactId,
        value: Number(deal.value),
      });
    }

    return updated;
  }

  async update(id: string, dto: UpdateDealDto) {
    const deal = await this.prisma.crmDeal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException('Deal not found');

    return this.prisma.crmDeal.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.expectedCloseDate !== undefined && { expectedCloseDate: new Date(dto.expectedCloseDate) }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.contactId !== undefined && { contactId: dto.contactId }),
        ...(dto.customData !== undefined && { customData: dto.customData }),
      },
      include: { stage: true, contact: true },
    });
  }

  async delete(id: string) {
    const deal = await this.prisma.crmDeal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException('Deal not found');
    await this.prisma.crmDeal.delete({ where: { id } });
  }
}
