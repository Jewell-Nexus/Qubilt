import { Injectable, NotFoundException } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';

// Human-readable labels for journal detail properties
const PROPERTY_LABELS: Record<string, string> = {
  subject: 'Subject',
  typeId: 'Type',
  statusId: 'Status',
  priorityId: 'Priority',
  assigneeId: 'Assignee',
  description: 'Description',
  startDate: 'Start date',
  dueDate: 'Due date',
  estimatedHours: 'Estimated hours',
  versionId: 'Version',
  categoryId: 'Category',
  storyPoints: 'Story points',
  percentDone: 'Progress',
  parentId: 'Parent',
};

@Injectable()
export class JournalsService {
  constructor(private prisma: PmPrismaService) {}

  async findForWorkPackage(
    workPackageId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.pmJournal.findMany({
        where: { workPackageId },
        include: { details: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.pmJournal.count({ where: { workPackageId } }),
    ]);

    // Format details as human-readable strings
    const formatted = data.map((journal) => ({
      ...journal,
      details: journal.details.map((detail) => ({
        ...detail,
        label: PROPERTY_LABELS[detail.property] ?? detail.property,
        summary: this.formatDetail(detail.property, detail.oldValue, detail.newValue),
      })),
    }));

    return { data: formatted, total, page, limit };
  }

  async addNote(workPackageId: string, userId: string, notes: string) {
    // Verify work package exists
    const wp = await this.prisma.pmWorkPackage.findFirst({
      where: { id: workPackageId, deletedAt: null },
    });
    if (!wp) throw new NotFoundException('Work package not found');

    return this.prisma.pmJournal.create({
      data: {
        workPackageId,
        userId,
        notes,
      },
      include: { details: true },
    });
  }

  private formatDetail(
    property: string,
    oldValue: string | null,
    newValue: string | null,
  ): string {
    const label = PROPERTY_LABELS[property] ?? property;
    if (!oldValue && newValue) {
      return `${label} set to ${newValue}`;
    }
    if (oldValue && !newValue) {
      return `${label} removed (was ${oldValue})`;
    }
    return `${label} changed from ${oldValue} to ${newValue}`;
  }
}
