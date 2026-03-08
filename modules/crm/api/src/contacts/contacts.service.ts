import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CrmPrismaService } from '../prisma/crm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { CrmEvents } from '@qubilt/module-sdk/crm.events';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactsDto } from './dto/filter-contacts.dto';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import type { PaginatedResult } from '@qubilt/shared/types';

@Injectable()
export class ContactsService {
  constructor(
    private prisma: CrmPrismaService,
    private eventBus: EventBusService,
  ) {}

  async create(dto: CreateContactDto) {
    // Validate email uniqueness within workspace
    if (dto.email) {
      const existing = await this.prisma.crmContact.findFirst({
        where: {
          workspaceId: dto.workspaceId,
          email: dto.email,
          deletedAt: null,
        },
      });
      if (existing) {
        throw new ConflictException('A contact with this email already exists in this workspace');
      }
    }

    const contact = await this.prisma.crmContact.create({
      data: {
        workspaceId: dto.workspaceId,
        type: dto.type,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        jobTitle: dto.jobTitle,
        company: dto.company,
        organizationId: dto.organizationId,
        ownerId: dto.ownerId,
        tags: dto.tags ?? [],
        customData: dto.customData ?? undefined,
      },
    });

    this.eventBus.emit(CrmEvents.CONTACT_CREATED, {
      contactId: contact.id,
      workspaceId: contact.workspaceId,
      type: contact.type,
    });

    return contact;
  }

  async findAll(filters: FilterContactsDto): Promise<PaginatedResult<any>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {
      workspaceId: filters.workspaceId,
      deletedAt: null,
    };

    if (filters.type) where.type = filters.type;
    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.email) where.email = { contains: filters.email, mode: 'insensitive' };
    if (filters.company) where.company = { contains: filters.company, mode: 'insensitive' };

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { company: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy] = filters.sortOrder ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.crmContact.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: { select: { deals: true, activities: true } },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      }),
      this.prisma.crmContact.count({ where }),
    ]);

    const enriched = data.map((c) => ({
      ...c,
      dealCount: c._count.deals,
      activityCount: c._count.activities,
      lastActivityDate: c.activities[0]?.createdAt ?? null,
      _count: undefined,
      activities: undefined,
    }));

    return { data: enriched, total, page, limit };
  }

  async findOne(id: string) {
    const contact = await this.prisma.crmContact.findUnique({
      where: { id },
      include: {
        organization: true,
        employees: {
          where: { deletedAt: null },
          select: { id: true, firstName: true, lastName: true, email: true, jobTitle: true },
        },
        deals: {
          select: {
            id: true,
            name: true,
            value: true,
            status: true,
            stage: { select: { name: true } },
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contact || contact.deletedAt) {
      throw new NotFoundException('Contact not found');
    }

    return contact;
  }

  async update(id: string, dto: UpdateContactDto) {
    const contact = await this.prisma.crmContact.findUnique({ where: { id } });
    if (!contact || contact.deletedAt) {
      throw new NotFoundException('Contact not found');
    }

    // Check email uniqueness if email is being changed
    if (dto.email && dto.email !== contact.email) {
      const existing = await this.prisma.crmContact.findFirst({
        where: {
          workspaceId: contact.workspaceId,
          email: dto.email,
          deletedAt: null,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('A contact with this email already exists');
      }
    }

    const updated = await this.prisma.crmContact.update({
      where: { id },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle }),
        ...(dto.company !== undefined && { company: dto.company }),
        ...(dto.organizationId !== undefined && { organizationId: dto.organizationId }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.customData !== undefined && { customData: dto.customData }),
      },
    });

    this.eventBus.emit(CrmEvents.CONTACT_UPDATED, {
      contactId: updated.id,
      workspaceId: updated.workspaceId,
    });

    return updated;
  }

  async delete(id: string) {
    const contact = await this.prisma.crmContact.findUnique({
      where: { id },
      include: { deals: { where: { status: 'OPEN' } } },
    });
    if (!contact || contact.deletedAt) {
      throw new NotFoundException('Contact not found');
    }
    if (contact.deals.length > 0) {
      throw new BadRequestException('Cannot delete contact with open deals');
    }

    await this.prisma.crmContact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async merge(primaryId: string, duplicateId: string) {
    const [primary, duplicate] = await Promise.all([
      this.prisma.crmContact.findUnique({ where: { id: primaryId } }),
      this.prisma.crmContact.findUnique({ where: { id: duplicateId } }),
    ]);

    if (!primary || primary.deletedAt) throw new NotFoundException('Primary contact not found');
    if (!duplicate || duplicate.deletedAt) throw new NotFoundException('Duplicate contact not found');

    // Move all deals, activities, notes from duplicate to primary
    await this.prisma.$transaction([
      this.prisma.crmDeal.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      }),
      this.prisma.crmActivity.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      }),
      this.prisma.crmNote.updateMany({
        where: { contactId: duplicateId },
        data: { contactId: primaryId },
      }),
      // If duplicate is an org, move employees to primary
      this.prisma.crmContact.updateMany({
        where: { organizationId: duplicateId },
        data: { organizationId: primaryId },
      }),
      // Soft delete the duplicate
      this.prisma.crmContact.update({
        where: { id: duplicateId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return this.findOne(primaryId);
  }

  async importCsv(
    workspaceId: string,
    csvBuffer: Buffer,
    fieldMapping: Record<string, string>,
    ownerId: string,
  ) {
    const records = parse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const result = { created: 0, updated: 0, failed: 0, errors: [] as string[] };

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const data: any = {
          workspaceId,
          ownerId,
          type: 'PERSON' as const,
        };

        for (const [csvCol, field] of Object.entries(fieldMapping)) {
          if (row[csvCol] !== undefined && row[csvCol] !== '') {
            data[field] = row[csvCol];
          }
        }

        // If email exists, update; otherwise create
        if (data.email) {
          const existing = await this.prisma.crmContact.findFirst({
            where: { workspaceId, email: data.email, deletedAt: null },
          });
          if (existing) {
            await this.prisma.crmContact.update({
              where: { id: existing.id },
              data,
            });
            result.updated++;
            continue;
          }
        }

        await this.prisma.crmContact.create({ data });
        result.created++;
      } catch (err: any) {
        result.failed++;
        result.errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return result;
  }

  async exportCsv(workspaceId: string, filters?: FilterContactsDto): Promise<Buffer> {
    const where: any = { workspaceId, deletedAt: null };
    if (filters?.type) where.type = filters.type;
    if (filters?.ownerId) where.ownerId = filters.ownerId;

    const contacts = await this.prisma.crmContact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const csv = stringify(
      contacts.map((c) => ({
        type: c.type,
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        email: c.email ?? '',
        phone: c.phone ?? '',
        jobTitle: c.jobTitle ?? '',
        company: c.company ?? '',
        tags: c.tags.join(';'),
        createdAt: c.createdAt.toISOString(),
      })),
      { header: true },
    );

    return Buffer.from(csv);
  }
}
