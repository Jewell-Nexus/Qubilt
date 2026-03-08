import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WikiPrismaService } from '../prisma/wiki-prisma.service';

const VALID_COLUMN_TYPES = [
  'text', 'number', 'select', 'multi-select',
  'date', 'checkbox', 'url', 'relation',
];

@Injectable()
export class DatabasesService {
  constructor(private prisma: WikiPrismaService) {}

  async create(pageId: string, dto: { name: string; icon?: string; schema?: any }) {
    // Verify page exists
    const page = await this.prisma.wikiPage.findUnique({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Page not found');

    const defaultSchema = dto.schema || {
      columns: [
        { id: 'col_name', name: 'Name', type: 'text' },
        { id: 'col_status', name: 'Status', type: 'select', options: ['Todo', 'In Progress', 'Done'] },
      ],
    };

    return this.prisma.wikiDatabase.create({
      data: {
        pageId,
        name: dto.name,
        icon: dto.icon,
        schema: defaultSchema,
      },
    });
  }

  async findForPage(pageId: string) {
    return this.prisma.wikiDatabase.findMany({
      where: { pageId },
      include: {
        rows: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async updateSchema(databaseId: string, schema: any) {
    const db = await this.prisma.wikiDatabase.findUnique({
      where: { id: databaseId },
    });
    if (!db) throw new NotFoundException('Database not found');

    // Validate column types
    if (schema.columns) {
      for (const col of schema.columns) {
        if (!VALID_COLUMN_TYPES.includes(col.type)) {
          throw new BadRequestException(`Invalid column type: ${col.type}`);
        }
      }
    }

    // Find removed columns to clean up row data
    const oldSchema = db.schema as any;
    const oldColumnIds = new Set<string>((oldSchema.columns || []).map((c: any) => c.id));
    const newColumnIds = new Set<string>((schema.columns || []).map((c: any) => c.id));
    const removedIds = [...oldColumnIds].filter((id) => !newColumnIds.has(id));
    const addedIds = [...newColumnIds].filter((id) => !oldColumnIds.has(id));

    // Migrate existing rows if columns changed
    if (removedIds.length > 0 || addedIds.length > 0) {
      const rows = await this.prisma.wikiDatabaseRow.findMany({
        where: { databaseId },
      });

      for (const row of rows) {
        const data = row.data as any;
        // Remove deleted columns
        for (const id of removedIds) {
          delete data[id];
        }
        // Add null for new columns
        for (const id of addedIds) {
          if (!(id in data)) data[id] = null;
        }
        await this.prisma.wikiDatabaseRow.update({
          where: { id: row.id },
          data: { data },
        });
      }
    }

    return this.prisma.wikiDatabase.update({
      where: { id: databaseId },
      data: { schema },
    });
  }

  async updateView(
    databaseId: string,
    dto: { viewType?: string; filters?: any[]; sortBy?: any[]; groupBy?: string },
  ) {
    const db = await this.prisma.wikiDatabase.findUnique({
      where: { id: databaseId },
    });
    if (!db) throw new NotFoundException('Database not found');

    const data: any = {};
    if (dto.viewType !== undefined) data.viewType = dto.viewType;
    if (dto.filters !== undefined) data.filters = dto.filters;
    if (dto.sortBy !== undefined) data.sortBy = dto.sortBy;
    if (dto.groupBy !== undefined) data.groupBy = dto.groupBy;

    return this.prisma.wikiDatabase.update({
      where: { id: databaseId },
      data,
    });
  }

  async createRow(databaseId: string, data: any) {
    const db = await this.prisma.wikiDatabase.findUnique({
      where: { id: databaseId },
    });
    if (!db) throw new NotFoundException('Database not found');

    const maxPos = await this.prisma.wikiDatabaseRow.aggregate({
      where: { databaseId },
      _max: { position: true },
    });

    return this.prisma.wikiDatabaseRow.create({
      data: {
        databaseId,
        data: data || {},
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  async updateRow(rowId: string, data: any) {
    const row = await this.prisma.wikiDatabaseRow.findUnique({
      where: { id: rowId },
    });
    if (!row) throw new NotFoundException('Row not found');

    return this.prisma.wikiDatabaseRow.update({
      where: { id: rowId },
      data: { data },
    });
  }

  async deleteRow(rowId: string) {
    const row = await this.prisma.wikiDatabaseRow.findUnique({
      where: { id: rowId },
    });
    if (!row) throw new NotFoundException('Row not found');

    await this.prisma.wikiDatabaseRow.delete({ where: { id: rowId } });
  }

  async reorderRows(databaseId: string, orderedIds: string[]) {
    const updates = orderedIds.map((id, index) =>
      this.prisma.wikiDatabaseRow.update({
        where: { id },
        data: { position: index },
      }),
    );
    await this.prisma.$transaction(updates);
  }

  async getRows(databaseId: string, filters?: any[], sort?: any[]) {
    const db = await this.prisma.wikiDatabase.findUnique({
      where: { id: databaseId },
    });
    if (!db) throw new NotFoundException('Database not found');

    const rows = await this.prisma.wikiDatabaseRow.findMany({
      where: { databaseId },
      orderBy: { position: 'asc' },
    });

    // Apply filters in-memory (JSON column filtering)
    let filtered = rows;
    if (filters && filters.length > 0) {
      filtered = rows.filter((row) => {
        const data = row.data as any;
        return filters.every((f: any) => {
          const val = data[f.columnId];
          switch (f.operator) {
            case 'eq': return val === f.value;
            case 'neq': return val !== f.value;
            case 'contains': return typeof val === 'string' && val.includes(f.value);
            case 'gt': return val > f.value;
            case 'lt': return val < f.value;
            case 'empty': return val == null || val === '';
            case 'not_empty': return val != null && val !== '';
            default: return true;
          }
        });
      });
    }

    // Apply sort in-memory
    if (sort && sort.length > 0) {
      filtered.sort((a, b) => {
        for (const s of sort) {
          const aVal = (a.data as any)[s.columnId];
          const bVal = (b.data as any)[s.columnId];
          const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
          if (cmp !== 0) return s.direction === 'desc' ? -cmp : cmp;
        }
        return 0;
      });
    }

    return filtered;
  }
}
