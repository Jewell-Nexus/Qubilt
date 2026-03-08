import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { PmEvents } from '@qubilt/module-sdk/pm.events';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';

@Injectable()
export class VersionsService {
  constructor(
    private prisma: PmPrismaService,
    private eventBus: EventBusService,
  ) {}

  async create(projectId: string, dto: CreateVersionDto) {
    return this.prisma.pmVersion.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        sharing: dto.sharing,
        wikiPageId: dto.wikiPageId,
      },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.pmVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { workPackages: true } },
      },
    });
  }

  async update(id: string, dto: UpdateVersionDto) {
    const existing = await this.prisma.pmVersion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Version not found');

    const updateData: any = { ...dto };
    if (dto.startDate !== undefined) {
      updateData.startDate = dto.startDate ? new Date(dto.startDate) : null;
    }
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    return this.prisma.pmVersion.update({ where: { id }, data: updateData });
  }

  async close(id: string) {
    const existing = await this.prisma.pmVersion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Version not found');

    const version = await this.prisma.pmVersion.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    this.eventBus.emit(PmEvents.VERSION_CLOSED, {
      versionId: id,
      projectId: existing.projectId,
    });

    return version;
  }

  async delete(id: string) {
    const existing = await this.prisma.pmVersion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Version not found');

    const wpCount = await this.prisma.pmWorkPackage.count({
      where: { versionId: id, deletedAt: null },
    });
    if (wpCount > 0) {
      throw new ConflictException(
        'Cannot delete version: work packages still reference it. Reassign them first.',
      );
    }

    return this.prisma.pmVersion.delete({ where: { id } });
  }
}
