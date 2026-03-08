import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { PmEvents } from '@qubilt/module-sdk/pm.events';
import { CreateWorkPackageDto } from './dto/create-work-package.dto';
import { UpdateWorkPackageDto } from './dto/update-work-package.dto';
import { FilterWorkPackagesDto } from './dto/filter-work-packages.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { CustomValuesService } from '../custom-fields/custom-values.service';

const WP_INCLUDE_LIST = {
  type: { select: { id: true, name: true, color: true } },
  status: { select: { id: true, name: true, color: true, isClosed: true } },
  priority: { select: { id: true, name: true, color: true } },
} as const;

const WP_INCLUDE_DETAIL = {
  ...WP_INCLUDE_LIST,
  version: { select: { id: true, name: true, status: true } },
  category: { select: { id: true, name: true } },
  parent: { select: { id: true, subject: true } },
  children: { select: { id: true, subject: true, statusId: true } },
  journals: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    include: { details: true },
  },
  customValues: {
    include: { customField: true },
  },
} as const;

// Fields tracked in journal entries
const TRACKED_FIELDS = [
  'subject',
  'typeId',
  'statusId',
  'priorityId',
  'assigneeId',
  'description',
  'startDate',
  'dueDate',
  'estimatedHours',
  'versionId',
  'categoryId',
  'storyPoints',
  'percentDone',
  'parentId',
] as const;

@Injectable()
export class WorkPackagesService {
  constructor(
    private prisma: PmPrismaService,
    private eventBus: EventBusService,
    private customValuesService: CustomValuesService,
  ) {}

  async create(projectId: string, dto: CreateWorkPackageDto, authorId: string) {
    // Find workspace defaults if not specified
    // We need the project's workspaceId from the kernel DB, but since PM schema
    // doesn't have projects, we trust the caller provides valid IDs
    const statusId = dto.statusId ?? (await this.getDefaultStatusId(projectId));
    const priorityId = dto.priorityId ?? (await this.getDefaultPriorityId(projectId));

    if (!statusId) {
      throw new BadRequestException('No default status configured');
    }

    const maxPos = await this.prisma.pmWorkPackage.aggregate({
      where: { projectId, parentId: dto.parentId ?? null, deletedAt: null },
      _max: { position: true },
    });

    const wp = await this.prisma.pmWorkPackage.create({
      data: {
        projectId,
        typeId: dto.typeId,
        statusId,
        priorityId,
        subject: dto.subject,
        description: dto.description,
        assigneeId: dto.assigneeId,
        authorId,
        parentId: dto.parentId,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        estimatedHours: dto.estimatedHours,
        versionId: dto.versionId,
        storyPoints: dto.storyPoints,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: WP_INCLUDE_LIST,
    });

    // Write "created" journal entry
    const details: { property: string; oldValue: string | null; newValue: string }[] = [
      { property: 'subject', oldValue: null, newValue: wp.subject },
      { property: 'typeId', oldValue: null, newValue: wp.typeId },
      { property: 'statusId', oldValue: null, newValue: wp.statusId },
    ];
    if (wp.priorityId) details.push({ property: 'priorityId', oldValue: null, newValue: wp.priorityId });
    if (wp.assigneeId) details.push({ property: 'assigneeId', oldValue: null, newValue: wp.assigneeId });
    if (wp.description) details.push({ property: 'description', oldValue: null, newValue: wp.description });

    await this.prisma.pmJournal.create({
      data: {
        workPackageId: wp.id,
        userId: authorId,
        notes: 'Work package created',
        details: { create: details },
      },
    });

    this.eventBus.emit(PmEvents.WORK_PACKAGE_CREATED, {
      workPackageId: wp.id,
      projectId,
      typeId: wp.typeId,
      authorId,
    });

    return wp;
  }

  async findAll(projectId: string, filters: FilterWorkPackagesDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    // If queryId provided, load saved query and apply its filters
    let savedFilters: Record<string, any> = {};
    let savedSort: any[] = [];
    if (filters.queryId) {
      const query = await this.prisma.pmQuery.findUnique({
        where: { id: filters.queryId },
      });
      if (query) {
        savedFilters = query.filters as Record<string, any>;
        savedSort = query.sortBy as any[];
      }
    }

    const where: any = {
      projectId,
      deletedAt: null,
    };

    // Apply filters (explicit filters override saved query)
    if (filters.statusId || savedFilters.statusId) {
      where.statusId = filters.statusId ?? savedFilters.statusId;
    }
    if (filters.typeId || savedFilters.typeId) {
      where.typeId = filters.typeId ?? savedFilters.typeId;
    }
    if (filters.priorityId || savedFilters.priorityId) {
      where.priorityId = filters.priorityId ?? savedFilters.priorityId;
    }
    if (filters.assigneeId || savedFilters.assigneeId) {
      where.assigneeId = filters.assigneeId ?? savedFilters.assigneeId;
    }
    if (filters.versionId || savedFilters.versionId) {
      where.versionId = filters.versionId ?? savedFilters.versionId;
    }
    if (filters.categoryId || savedFilters.categoryId) {
      where.categoryId = filters.categoryId ?? savedFilters.categoryId;
    }
    if (filters.overdue) {
      where.dueDate = { lt: new Date() };
      where.status = { isClosed: false };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.subject = { contains: filters.search, mode: 'insensitive' };
    }

    // Build orderBy
    let orderBy: any = { position: 'asc' };
    if (filters.sortBy) {
      orderBy = { [filters.sortBy]: filters.sortOrder ?? 'asc' };
    } else if (savedSort.length > 0) {
      orderBy = savedSort.reduce(
        (acc: any, s: any) => ({ ...acc, [s.field]: s.direction }),
        {},
      );
    }

    const [data, total] = await Promise.all([
      this.prisma.pmWorkPackage.findMany({
        where,
        include: WP_INCLUDE_LIST,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.pmWorkPackage.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const wp = await this.prisma.pmWorkPackage.findFirst({
      where: { id, deletedAt: null },
      include: WP_INCLUDE_DETAIL,
    });
    if (!wp) throw new NotFoundException('Work package not found');
    return wp;
  }

  async update(id: string, dto: UpdateWorkPackageDto, userId: string) {
    const existing = await this.prisma.pmWorkPackage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Work package not found');

    // Compare old vs new for journal
    const changes: { property: string; oldValue: string | null; newValue: string | null }[] = [];
    const changedFields: string[] = [];

    for (const field of TRACKED_FIELDS) {
      if (field in dto) {
        const oldVal = existing[field as keyof typeof existing];
        const newVal = (dto as any)[field];
        const oldStr = oldVal != null ? String(oldVal) : null;
        const newStr = newVal != null ? String(newVal) : null;
        if (oldStr !== newStr) {
          changes.push({ property: field, oldValue: oldStr, newValue: newStr });
          changedFields.push(field);
        }
      }
    }

    // Build update data, converting date strings
    const { customValues, ...dtoWithoutCustom } = dto;
    const updateData: any = { ...dtoWithoutCustom };
    if (dto.startDate !== undefined) {
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    // If status changed, handle closedAt and emit events
    let statusChangedToClosed = false;
    let statusChangedFromClosed = false;
    if (dto.statusId && dto.statusId !== existing.statusId) {
      const [newStatus, oldStatus] = await Promise.all([
        this.prisma.pmStatus.findUnique({ where: { id: dto.statusId } }),
        this.prisma.pmStatus.findUnique({ where: { id: existing.statusId } }),
      ]);
      if (newStatus?.isClosed) {
        updateData.closedAt = new Date();
        statusChangedToClosed = true;
      } else {
        updateData.closedAt = null;
        if (oldStatus?.isClosed) {
          statusChangedFromClosed = true;
        }
      }
    }

    const wp = await this.prisma.pmWorkPackage.update({
      where: { id },
      data: updateData,
      include: WP_INCLUDE_LIST,
    });

    // Write journal entry if anything changed
    if (changes.length > 0) {
      await this.prisma.pmJournal.create({
        data: {
          workPackageId: id,
          userId,
          details: { create: changes },
        },
      });
    }

    // Set custom values if provided (writes its own journal)
    if (customValues && customValues.length > 0) {
      await this.customValuesService.setValues(id, customValues, userId);
    }

    // Emit events
    if (changedFields.length > 0) {
      this.eventBus.emit(PmEvents.WORK_PACKAGE_UPDATED, {
        workPackageId: id,
        changes: changedFields,
      });
    }

    if (
      changedFields.includes('assigneeId') &&
      dto.assigneeId
    ) {
      this.eventBus.emit(PmEvents.WORK_PACKAGE_ASSIGNED, {
        workPackageId: id,
        assigneeId: dto.assigneeId,
        subject: wp.subject,
      });
    }

    if (statusChangedToClosed) {
      this.eventBus.emit(PmEvents.WORK_PACKAGE_CLOSED, {
        workPackageId: id,
        projectId: existing.projectId,
      });
    }

    if (statusChangedFromClosed) {
      this.eventBus.emit(PmEvents.WORK_PACKAGE_REOPENED, {
        workPackageId: id,
        projectId: existing.projectId,
      });
    }

    return wp;
  }

  async delete(id: string) {
    const wp = await this.prisma.pmWorkPackage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!wp) throw new NotFoundException('Work package not found');

    // Check no children
    const childCount = await this.prisma.pmWorkPackage.count({
      where: { parentId: id, deletedAt: null },
    });
    if (childCount > 0) {
      throw new ConflictException(
        'Cannot delete work package with children. Delete or move children first.',
      );
    }

    // Soft-delete
    await this.prisma.pmWorkPackage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.eventBus.emit(PmEvents.WORK_PACKAGE_DELETED, {
      workPackageId: id,
      projectId: wp.projectId,
    });
  }

  async move(id: string, newParentId: string | null, newPosition: number) {
    const wp = await this.prisma.pmWorkPackage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!wp) throw new NotFoundException('Work package not found');

    // Prevent setting parent to self or own descendant
    if (newParentId) {
      if (newParentId === id) {
        throw new BadRequestException('Cannot set parent to self');
      }
      // Check newParentId isn't a descendant
      let parent = await this.prisma.pmWorkPackage.findUnique({
        where: { id: newParentId },
        select: { parentId: true },
      });
      while (parent?.parentId) {
        if (parent.parentId === id) {
          throw new BadRequestException('Cannot move to own descendant');
        }
        parent = await this.prisma.pmWorkPackage.findUnique({
          where: { id: parent.parentId },
          select: { parentId: true },
        });
      }
    }

    await this.prisma.pmWorkPackage.update({
      where: { id },
      data: { parentId: newParentId, position: newPosition },
    });
  }

  async bulkUpdate(dto: BulkUpdateDto) {
    const updateData: any = {};
    if (dto.statusId) updateData.statusId = dto.statusId;
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;
    if (dto.priorityId) updateData.priorityId = dto.priorityId;
    if (dto.versionId !== undefined) updateData.versionId = dto.versionId;

    const result = await this.prisma.pmWorkPackage.updateMany({
      where: { id: { in: dto.ids }, deletedAt: null },
      data: updateData,
    });

    return { updated: result.count };
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private async getDefaultStatusId(projectId: string): Promise<string | null> {
    // Get workspaceId from an existing type (since project's workspace lives in kernel)
    // We look for a default status in any workspace that has statuses
    const defaultStatus = await this.prisma.pmStatus.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });
    return defaultStatus?.id ?? null;
  }

  private async getDefaultPriorityId(projectId: string): Promise<string | null> {
    const defaultPriority = await this.prisma.pmPriority.findFirst({
      where: { isDefault: true },
      select: { id: true },
    });
    return defaultPriority?.id ?? null;
  }
}
