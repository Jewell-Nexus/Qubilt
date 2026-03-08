import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmPrismaService } from '../prisma/crm-prisma.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(private prisma: CrmPrismaService) {}

  async create(dto: CreateNoteDto, userId: string) {
    return this.prisma.crmNote.create({
      data: {
        workspaceId: dto.workspaceId,
        content: dto.content,
        contactId: dto.contactId,
        dealId: dto.dealId,
        userId,
      },
    });
  }

  async findAll(filters: { contactId?: string; dealId?: string }, pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.dealId) where.dealId = filters.dealId;

    const [data, total] = await Promise.all([
      this.prisma.crmNote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.crmNote.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const note = await this.prisma.crmNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(id: string, dto: UpdateNoteDto) {
    const note = await this.prisma.crmNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');

    return this.prisma.crmNote.update({
      where: { id },
      data: { content: dto.content },
    });
  }

  async delete(id: string) {
    const note = await this.prisma.crmNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');
    await this.prisma.crmNote.delete({ where: { id } });
  }
}
