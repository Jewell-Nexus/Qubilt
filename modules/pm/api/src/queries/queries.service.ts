import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreateQueryDto } from './dto/create-query.dto';
import { UpdateQueryDto } from './dto/update-query.dto';

@Injectable()
export class QueriesService {
  constructor(private prisma: PmPrismaService) {}

  async create(dto: CreateQueryDto, userId: string) {
    return this.prisma.pmQuery.create({
      data: {
        userId,
        projectId: dto.projectId,
        name: dto.name,
        filters: dto.filters ?? [],
        sortBy: dto.sortBy ?? [],
        groupBy: dto.groupBy,
        columns: dto.columns ?? [],
        isPublic: dto.isPublic ?? false,
        displayType: dto.displayType ?? 'list',
      },
    });
  }

  async findAll(projectId?: string, userId?: string) {
    // Return: public queries for project + user's private queries
    const where: any = {
      OR: [] as any[],
    };

    if (projectId) {
      where.OR.push({ projectId, isPublic: true });
    } else {
      where.OR.push({ isPublic: true });
    }

    if (userId) {
      where.OR.push({ userId });
    }

    // If no conditions, return all public
    if (where.OR.length === 0) {
      where.OR.push({ isPublic: true });
    }

    return this.prisma.pmQuery.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const query = await this.prisma.pmQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundException('Query not found');
    return query;
  }

  async update(id: string, dto: UpdateQueryDto) {
    const existing = await this.prisma.pmQuery.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Query not found');

    return this.prisma.pmQuery.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    const existing = await this.prisma.pmQuery.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Query not found');
    return this.prisma.pmQuery.delete({ where: { id } });
  }

  async setDefault(id: string, userId: string) {
    const query = await this.prisma.pmQuery.findUnique({ where: { id } });
    if (!query) throw new NotFoundException('Query not found');

    // Unset other defaults for this user (within same project scope)
    await this.prisma.pmQuery.updateMany({
      where: {
        userId,
        projectId: query.projectId,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    return this.prisma.pmQuery.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async applyToRequest(queryId: string, overrides: Record<string, any> = {}) {
    const query = await this.findOne(queryId);
    const filters = query.filters as Record<string, any>;
    const sortBy = query.sortBy as any[];

    return {
      ...filters,
      ...overrides,
      sortBy: overrides.sortBy ?? (sortBy.length > 0 ? sortBy[0]?.field : undefined),
      sortOrder: overrides.sortOrder ?? (sortBy.length > 0 ? sortBy[0]?.direction : undefined),
      groupBy: overrides.groupBy ?? query.groupBy,
      columns: query.columns,
      displayType: query.displayType,
    };
  }
}
