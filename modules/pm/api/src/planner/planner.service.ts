import { Injectable } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';

export interface TeamPlannerWp {
  id: string;
  subject: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  percentDone: number;
  typeName: string;
  typeColor: string;
  statusName: string;
  statusColor: string;
}

export interface TeamPlannerMember {
  userId: string;
  workPackages: TeamPlannerWp[];
}

@Injectable()
export class TeamPlannerService {
  constructor(private prisma: PmPrismaService) {}

  async getPlanner(
    projectId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<TeamPlannerMember[]> {
    const where: any = {
      projectId,
      deletedAt: null,
      assigneeId: { not: null },
    };

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      where.OR = [
        {
          startDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        },
        {
          dueDate: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        },
        // WPs that span the entire range
        ...(dateFrom && dateTo
          ? [{
              startDate: { lte: new Date(dateFrom) },
              dueDate: { gte: new Date(dateTo) },
            }]
          : []),
      ];
    }

    const wps = await this.prisma.pmWorkPackage.findMany({
      where,
      include: {
        type: { select: { name: true, color: true } },
        status: { select: { name: true, color: true } },
      },
      orderBy: [{ startDate: 'asc' }, { dueDate: 'asc' }],
    });

    // Group by assignee
    const grouped = new Map<string, TeamPlannerWp[]>();

    for (const wp of wps) {
      const userId = wp.assigneeId!;
      if (!grouped.has(userId)) {
        grouped.set(userId, []);
      }

      grouped.get(userId)!.push({
        id: wp.id,
        subject: wp.subject,
        startDate: wp.startDate?.toISOString().split('T')[0] ?? null,
        dueDate: wp.dueDate?.toISOString().split('T')[0] ?? null,
        estimatedHours: wp.estimatedHours ? Number(wp.estimatedHours) : null,
        percentDone: wp.percentDone,
        typeName: wp.type.name,
        typeColor: wp.type.color,
        statusName: wp.status.name,
        statusColor: wp.status.color,
      });
    }

    return Array.from(grouped.entries()).map(([userId, workPackages]) => ({
      userId,
      workPackages,
    }));
  }
}
