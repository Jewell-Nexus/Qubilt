import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreatePriorityDto } from './dto/create-priority.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';

@Injectable()
export class PrioritiesService {
  constructor(private prisma: PmPrismaService) {}

  async create(dto: CreatePriorityDto) {
    const maxPos = await this.prisma.pmPriority.aggregate({
      where: { workspaceId: dto.workspaceId },
      _max: { position: true },
    });

    return this.prisma.pmPriority.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        color: dto.color,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.pmPriority.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, dto: UpdatePriorityDto) {
    const existing = await this.prisma.pmPriority.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Priority not found');
    return this.prisma.pmPriority.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const wpCount = await this.prisma.pmWorkPackage.count({
      where: { priorityId: id, deletedAt: null },
    });
    if (wpCount > 0) {
      throw new ConflictException(
        'Cannot delete priority: work packages still reference it',
      );
    }
    return this.prisma.pmPriority.delete({ where: { id } });
  }

  async reorder(workspaceId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.pmPriority.update({
        where: { id },
        data: { position: index },
      }),
    );
    await this.prisma.$transaction(updates);
  }
}
