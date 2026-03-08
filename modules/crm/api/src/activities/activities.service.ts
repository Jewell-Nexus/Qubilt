import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmPrismaService } from '../prisma/crm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { CrmEvents } from '@qubilt/module-sdk/crm.events';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: CrmPrismaService,
    private eventBus: EventBusService,
  ) {}

  async create(dto: CreateActivityDto) {
    const activity = await this.prisma.crmActivity.create({
      data: {
        workspaceId: dto.workspaceId,
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        contactId: dto.contactId,
        dealId: dto.dealId,
        userId: dto.userId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });

    this.eventBus.emit(CrmEvents.ACTIVITY_CREATED, {
      activityId: activity.id,
      workspaceId: activity.workspaceId,
      type: activity.type,
      dealId: activity.dealId,
      contactId: activity.contactId,
    });

    return activity;
  }

  async findAll(
    filters: {
      contactId?: string;
      dealId?: string;
      userId?: string;
      type?: string;
      completed?: boolean;
      workspaceId?: string;
    },
    pagination?: { page?: number; limit?: number },
  ) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.workspaceId) where.workspaceId = filters.workspaceId;
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.dealId) where.dealId = filters.dealId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.type) where.type = filters.type;
    if (filters.completed !== undefined) {
      where.completedAt = filters.completed ? { not: null } : null;
    }

    const [data, total] = await Promise.all([
      this.prisma.crmActivity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: { select: { id: true, firstName: true, lastName: true } },
          deal: { select: { id: true, name: true } },
        },
      }),
      this.prisma.crmActivity.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async update(id: string, dto: UpdateActivityDto) {
    const activity = await this.prisma.crmActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');

    return this.prisma.crmActivity.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueDate !== undefined && { dueDate: new Date(dto.dueDate) }),
      },
    });
  }

  async complete(id: string) {
    const activity = await this.prisma.crmActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');

    return this.prisma.crmActivity.update({
      where: { id },
      data: { completedAt: new Date() },
    });
  }

  async delete(id: string) {
    const activity = await this.prisma.crmActivity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    await this.prisma.crmActivity.delete({ where: { id } });
  }

  async getUpcoming(userId: string, days: number) {
    const until = new Date();
    until.setDate(until.getDate() + days);

    return this.prisma.crmActivity.findMany({
      where: {
        userId,
        completedAt: null,
        dueDate: { lte: until, gte: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, name: true } },
      },
    });
  }
}
