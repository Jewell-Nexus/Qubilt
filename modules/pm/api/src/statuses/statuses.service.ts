import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class StatusesService {
  constructor(private prisma: PmPrismaService) {}

  async create(dto: CreateStatusDto) {
    const maxPos = await this.prisma.pmStatus.aggregate({
      where: { workspaceId: dto.workspaceId },
      _max: { position: true },
    });

    return this.prisma.pmStatus.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        color: dto.color,
        isClosed: dto.isClosed ?? false,
        isDefault: dto.isDefault ?? false,
        isReadonly: dto.isReadonly ?? false,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.pmStatus.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, dto: UpdateStatusDto) {
    const existing = await this.prisma.pmStatus.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Status not found');
    return this.prisma.pmStatus.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const wpCount = await this.prisma.pmWorkPackage.count({
      where: { statusId: id, deletedAt: null },
    });
    if (wpCount > 0) {
      throw new ConflictException(
        'Cannot delete status: work packages still reference it',
      );
    }
    return this.prisma.pmStatus.delete({ where: { id } });
  }

  async reorder(workspaceId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.pmStatus.update({
        where: { id },
        data: { position: index },
      }),
    );
    await this.prisma.$transaction(updates);
  }
}
