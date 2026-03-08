import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { PmEvents } from '@qubilt/module-sdk/pm.events';
import { LogTimeDto } from './dto/log-time.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { FilterTimeEntriesDto } from './dto/filter-time-entries.dto';

@Injectable()
export class TimeEntriesService {
  constructor(
    private prisma: PmPrismaService,
    private eventBus: EventBusService,
  ) {}

  async log(dto: LogTimeDto, userId: string) {
    const entry = await this.prisma.pmTimeEntry.create({
      data: {
        projectId: dto.projectId,
        workPackageId: dto.workPackageId,
        userId,
        hours: dto.hours,
        spentOn: new Date(dto.spentOn),
        comment: dto.comment,
        activityId: dto.activityId,
        billable: dto.billable ?? true,
      },
      include: {
        activity: { select: { id: true, name: true } },
      },
    });

    // Increment spentHours on work package
    if (dto.workPackageId) {
      await this.prisma.pmWorkPackage.update({
        where: { id: dto.workPackageId },
        data: {
          spentHours: { increment: dto.hours },
        },
      });
    }

    this.eventBus.emit(PmEvents.TIME_ENTRY_CREATED, {
      userId,
      hours: dto.hours,
      projectId: dto.projectId,
      workPackageId: dto.workPackageId ?? null,
    });

    return entry;
  }

  async update(id: string, dto: UpdateTimeEntryDto, userId: string, hasViewAll: boolean) {
    const existing = await this.prisma.pmTimeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Time entry not found');

    // Only own entries or users with view_all permission
    if (existing.userId !== userId && !hasViewAll) {
      throw new ForbiddenException('You can only edit your own time entries');
    }

    // Recalculate spentHours delta on work package
    if (existing.workPackageId && dto.hours !== undefined) {
      const oldHours = Number(existing.hours);
      const delta = dto.hours - oldHours;
      if (delta !== 0) {
        await this.prisma.pmWorkPackage.update({
          where: { id: existing.workPackageId },
          data: {
            spentHours: { increment: delta },
          },
        });
      }
    }

    const updateData: any = { ...dto };
    if (dto.spentOn) {
      updateData.spentOn = new Date(dto.spentOn);
    }

    return this.prisma.pmTimeEntry.update({
      where: { id },
      data: updateData,
      include: {
        activity: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string, userId: string, hasViewAll: boolean) {
    const existing = await this.prisma.pmTimeEntry.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Time entry not found');

    if (existing.userId !== userId && !hasViewAll) {
      throw new ForbiddenException('You can only delete your own time entries');
    }

    // Subtract from spentHours
    if (existing.workPackageId) {
      await this.prisma.pmWorkPackage.update({
        where: { id: existing.workPackageId },
        data: {
          spentHours: { decrement: Number(existing.hours) },
        },
      });
    }

    return this.prisma.pmTimeEntry.delete({ where: { id } });
  }

  async list(filters: FilterTimeEntriesDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.workPackageId) where.workPackageId = filters.workPackageId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.activityId) where.activityId = filters.activityId;
    if (filters.billable !== undefined) where.billable = filters.billable;
    if (filters.dateFrom || filters.dateTo) {
      where.spentOn = {};
      if (filters.dateFrom) where.spentOn.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.spentOn.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.pmTimeEntry.findMany({
        where,
        include: {
          activity: { select: { id: true, name: true } },
          workPackage: { select: { id: true, subject: true } },
        },
        orderBy: { spentOn: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.pmTimeEntry.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async report(
    projectId: string,
    groupBy: 'user' | 'activity' | 'date' | 'work-package',
  ) {
    const where = { projectId };

    // Get totals
    const totals = await this.prisma.pmTimeEntry.aggregate({
      where,
      _sum: { hours: true },
    });

    const billableTotals = await this.prisma.pmTimeEntry.aggregate({
      where: { ...where, billable: true },
      _sum: { hours: true },
    });

    // Group by the specified dimension
    let groupByField: string;
    switch (groupBy) {
      case 'user':
        groupByField = 'userId';
        break;
      case 'activity':
        groupByField = 'activityId';
        break;
      case 'date':
        groupByField = 'spentOn';
        break;
      case 'work-package':
        groupByField = 'workPackageId';
        break;
    }

    const groups = await this.prisma.pmTimeEntry.groupBy({
      by: [groupByField as any],
      where,
      _sum: { hours: true },
      _count: { _all: true },
      orderBy: {
        _sum: { hours: 'desc' },
      },
    });

    return {
      totalHours: Number(totals._sum.hours ?? 0),
      billableHours: Number(billableTotals._sum.hours ?? 0),
      groups,
    };
  }

  async findActivities(workspaceId: string) {
    return this.prisma.pmTimeActivity.findMany({
      where: { workspaceId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
