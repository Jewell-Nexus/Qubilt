import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { PmEvents } from '@qubilt/module-sdk/pm.events';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UnfinishedStrategy } from './dto/close-sprint.dto';

@Injectable()
export class SprintsService {
  constructor(
    private prisma: PmPrismaService,
    private eventBus: EventBusService,
  ) {}

  async create(projectId: string, dto: CreateSprintDto) {
    return this.prisma.pmSprint.create({
      data: {
        projectId,
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        goal: dto.goal,
        versionId: dto.versionId,
      },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.pmSprint.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, dto: UpdateSprintDto) {
    const existing = await this.prisma.pmSprint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sprint not found');

    const updateData: any = { ...dto };
    if (dto.startDate !== undefined) {
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.endDate !== undefined) {
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    return this.prisma.pmSprint.update({ where: { id }, data: updateData });
  }

  async start(id: string) {
    const sprint = await this.prisma.pmSprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundException('Sprint not found');

    if (sprint.status !== 'PLANNING') {
      throw new BadRequestException('Only sprints in PLANNING status can be started');
    }

    // Ensure no other active sprint in this project
    const activeSprint = await this.prisma.pmSprint.findFirst({
      where: { projectId: sprint.projectId, status: 'ACTIVE' },
    });
    if (activeSprint) {
      throw new ConflictException(
        `Sprint "${activeSprint.name}" is already active. Close it before starting a new one.`,
      );
    }

    const updated = await this.prisma.pmSprint.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startDate: sprint.startDate ?? new Date(),
      },
    });

    this.eventBus.emit(PmEvents.SPRINT_STARTED, {
      sprintId: id,
      projectId: sprint.projectId,
    });

    return updated;
  }

  async close(id: string, unfinishedStrategy: UnfinishedStrategy) {
    const sprint = await this.prisma.pmSprint.findUnique({ where: { id } });
    if (!sprint) throw new NotFoundException('Sprint not found');

    if (sprint.status !== 'ACTIVE') {
      throw new BadRequestException('Only ACTIVE sprints can be closed');
    }

    // Find unfinished work packages (those with non-closed statuses)
    // We need to find WPs associated with this sprint via the version
    // Since sprints link to versions, unfinished WPs are those in the sprint's version with open statuses
    if (sprint.versionId) {
      const unfinishedWPs = await this.prisma.pmWorkPackage.findMany({
        where: {
          versionId: sprint.versionId,
          deletedAt: null,
          status: { isClosed: false },
        },
        select: { id: true },
      });

      if (unfinishedWPs.length > 0) {
        const wpIds = unfinishedWPs.map((wp) => wp.id);

        if (unfinishedStrategy === UnfinishedStrategy.BACKLOG) {
          // Move to backlog: unset versionId
          await this.prisma.pmWorkPackage.updateMany({
            where: { id: { in: wpIds } },
            data: { versionId: null },
          });
        } else if (unfinishedStrategy === UnfinishedStrategy.NEW_SPRINT) {
          // Create new sprint and move WPs to its version
          const newSprint = await this.prisma.pmSprint.create({
            data: {
              projectId: sprint.projectId,
              name: `${sprint.name} (continued)`,
              versionId: sprint.versionId,
            },
          });
          // WPs stay on the same version — new sprint inherits it
          // Detach old sprint from this version
          await this.prisma.pmSprint.update({
            where: { id },
            data: { versionId: null },
          });
        }
      }
    }

    const closed = await this.prisma.pmSprint.update({
      where: { id },
      data: {
        status: 'CLOSED',
        endDate: sprint.endDate ?? new Date(),
      },
    });

    this.eventBus.emit(PmEvents.SPRINT_CLOSED, {
      sprintId: id,
      projectId: sprint.projectId,
    });

    return closed;
  }

  async delete(id: string) {
    const existing = await this.prisma.pmSprint.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sprint not found');

    if (existing.status === 'ACTIVE') {
      throw new ConflictException('Cannot delete an active sprint. Close it first.');
    }

    return this.prisma.pmSprint.delete({ where: { id } });
  }
}
