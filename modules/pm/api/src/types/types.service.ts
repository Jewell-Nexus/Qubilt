import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

@Injectable()
export class TypesService {
  constructor(private prisma: PmPrismaService) {}

  async create(dto: CreateTypeDto) {
    const maxPos = await this.prisma.pmType.aggregate({
      where: { workspaceId: dto.workspaceId },
      _max: { position: true },
    });

    return this.prisma.pmType.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        color: dto.color,
        isDefault: dto.isDefault ?? false,
        isMilestone: dto.isMilestone ?? false,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.pmType.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, dto: UpdateTypeDto) {
    const existing = await this.prisma.pmType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Type not found');
    return this.prisma.pmType.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const wpCount = await this.prisma.pmWorkPackage.count({
      where: { typeId: id, deletedAt: null },
    });
    if (wpCount > 0) {
      throw new ConflictException(
        'Cannot delete type: work packages still reference it',
      );
    }
    return this.prisma.pmType.delete({ where: { id } });
  }

  async reorder(workspaceId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.pmType.update({ where: { id }, data: { position: index } }),
    );
    await this.prisma.$transaction(updates);
  }
}
