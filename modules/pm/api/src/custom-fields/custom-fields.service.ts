import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private prisma: PmPrismaService) {}

  async create(dto: CreateCustomFieldDto) {
    const maxPos = await this.prisma.pmCustomField.aggregate({
      where: { workspaceId: dto.workspaceId },
      _max: { position: true },
    });

    return this.prisma.pmCustomField.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        fieldFormat: dto.fieldFormat,
        isRequired: dto.isRequired ?? false,
        isFilter: dto.isFilter ?? false,
        searchable: dto.searchable ?? false,
        defaultValue: dto.defaultValue,
        possibleValues: dto.possibleValues ?? undefined,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  async findAll(workspaceId: string) {
    return this.prisma.pmCustomField.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async update(id: string, dto: UpdateCustomFieldDto) {
    const field = await this.prisma.pmCustomField.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Custom field not found');

    return this.prisma.pmCustomField.update({
      where: { id },
      data: {
        name: dto.name,
        isRequired: dto.isRequired,
        isFilter: dto.isFilter,
        searchable: dto.searchable,
        defaultValue: dto.defaultValue,
        possibleValues: dto.possibleValues ?? undefined,
      },
    });
  }

  async delete(id: string) {
    const field = await this.prisma.pmCustomField.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Custom field not found');

    // Check no custom values reference this field
    const valueCount = await this.prisma.pmCustomValue.count({
      where: { customFieldId: id },
    });
    if (valueCount > 0) {
      throw new ConflictException(
        `Cannot delete custom field: ${valueCount} work package(s) have values for this field. Remove values first.`,
      );
    }

    await this.prisma.pmCustomField.delete({ where: { id } });
  }

  async reorder(workspaceId: string, orderedIds: string[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.pmCustomField.update({
          where: { id },
          data: { position: index },
        }),
      ),
    );
  }
}
