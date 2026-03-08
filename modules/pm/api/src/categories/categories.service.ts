import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PmPrismaService) {}

  async create(projectId: string, dto: CreateCategoryDto) {
    return this.prisma.pmCategory.create({
      data: {
        projectId,
        name: dto.name,
        defaultAssigneeId: dto.defaultAssigneeId,
      },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.pmCategory.findMany({
      where: { projectId },
      orderBy: { name: 'asc' },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.pmCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    return this.prisma.pmCategory.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const existing = await this.prisma.pmCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    const wpCount = await this.prisma.pmWorkPackage.count({
      where: { categoryId: id, deletedAt: null },
    });
    if (wpCount > 0) {
      throw new ConflictException(
        'Cannot delete category: work packages still reference it',
      );
    }

    return this.prisma.pmCategory.delete({ where: { id } });
  }
}
