import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateAuditLogDto {
  workspaceId: string;
  userId?: string;
  moduleId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  log(dto: CreateAuditLogDto): void {
    // Fire-and-forget: don't block the request path
    setImmediate(() => {
      this.prisma.auditLog
        .create({
          data: {
            workspaceId: dto.workspaceId,
            userId: dto.userId,
            moduleId: dto.moduleId,
            action: dto.action,
            resourceType: dto.resourceType,
            resourceId: dto.resourceId,
            changes: dto.changes ?? undefined,
            ipAddress: dto.ipAddress,
            userAgent: dto.userAgent,
          },
        })
        .catch((err) => {
          this.logger.error(`Failed to write audit log: ${err}`);
        });
    });
  }

  async list(
    workspaceId: string,
    filters: {
      userId?: string;
      moduleId?: string;
      action?: string;
      resourceType?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    pagination: { page: number; limit: number },
  ) {
    const where: any = { workspaceId };

    if (filters.userId) where.userId = filters.userId;
    if (filters.moduleId) where.moduleId = filters.moduleId;
    if (filters.action) where.action = filters.action;
    if (filters.resourceType) where.resourceType = filters.resourceType;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page: pagination.page, limit: pagination.limit };
  }
}
