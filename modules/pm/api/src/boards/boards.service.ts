import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { EventBusService } from '@kernel/events/event-bus.service';
import { PmEvents } from '@qubilt/module-sdk/pm.events';
import { CreateBoardDto, BoardTypeDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { MoveCardDto } from './dto/move-card.dto';

@Injectable()
export class BoardsService {
  constructor(
    private prisma: PmPrismaService,
    private eventBus: EventBusService,
  ) {
    // Register event handlers for auto-sync
    this.eventBus.on(PmEvents.WORK_PACKAGE_UPDATED, async (payload: any) => {
      if (payload.changes?.includes('statusId')) {
        await this.syncBoardsByType(payload.projectId ?? await this.getProjectIdFromWp(payload.workPackageId), 'STATUS');
      }
    });

    this.eventBus.on(PmEvents.WORK_PACKAGE_ASSIGNED, async (payload: any) => {
      const projectId = await this.getProjectIdFromWp(payload.workPackageId);
      if (projectId) {
        await this.syncBoardsByType(projectId, 'ASSIGNEE');
      }
    });
  }

  async create(projectId: string, dto: CreateBoardDto) {
    const board = await this.prisma.pmBoard.create({
      data: {
        projectId,
        name: dto.name,
        type: dto.type,
      },
    });

    // Auto-create columns based on board type
    if (dto.type === BoardTypeDto.STATUS) {
      await this.autoCreateStatusColumns(board.id, projectId);
    } else if (dto.type === BoardTypeDto.ASSIGNEE) {
      await this.autoCreateAssigneeColumns(board.id, projectId);
    } else if (dto.type === BoardTypeDto.VERSION) {
      await this.autoCreateVersionColumns(board.id, projectId);
    }

    // Sync cards for auto-generated boards
    if (dto.type !== BoardTypeDto.MANUAL) {
      await this.syncBoard(board.id);
    }

    return this.findOne(board.id);
  }

  async findAll(projectId: string) {
    return this.prisma.pmBoard.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { cards: true } },
          },
        },
      },
    });
  }

  async findOne(boardId: string) {
    const board = await this.prisma.pmBoard.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            cards: {
              orderBy: { position: 'asc' },
              include: {
                workPackage: {
                  select: {
                    id: true,
                    subject: true,
                    assigneeId: true,
                    priorityId: true,
                    typeId: true,
                    statusId: true,
                    percentDone: true,
                    dueDate: true,
                    type: { select: { id: true, name: true, color: true } },
                    status: { select: { id: true, name: true, color: true } },
                    priority: { select: { id: true, name: true, color: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!board) throw new NotFoundException('Board not found');
    return board;
  }

  async update(boardId: string, dto: UpdateBoardDto) {
    const existing = await this.prisma.pmBoard.findUnique({ where: { id: boardId } });
    if (!existing) throw new NotFoundException('Board not found');

    return this.prisma.pmBoard.update({
      where: { id: boardId },
      data: dto,
    });
  }

  async delete(boardId: string) {
    const existing = await this.prisma.pmBoard.findUnique({ where: { id: boardId } });
    if (!existing) throw new NotFoundException('Board not found');

    await this.prisma.pmBoard.delete({ where: { id: boardId } });
  }

  async updateColumn(columnId: string, dto: UpdateColumnDto) {
    const existing = await this.prisma.pmBoardColumn.findUnique({ where: { id: columnId } });
    if (!existing) throw new NotFoundException('Board column not found');

    return this.prisma.pmBoardColumn.update({
      where: { id: columnId },
      data: dto,
    });
  }

  async reorderColumns(boardId: string, orderedIds: string[]) {
    const board = await this.prisma.pmBoard.findUnique({
      where: { id: boardId },
      include: { columns: { select: { id: true } } },
    });
    if (!board) throw new NotFoundException('Board not found');

    const existingIds = new Set(board.columns.map((c) => c.id));
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        throw new BadRequestException(`Column ${id} does not belong to this board`);
      }
    }

    const operations = orderedIds.map((id, index) =>
      this.prisma.pmBoardColumn.update({
        where: { id },
        data: { position: index },
      }),
    );

    await this.prisma.$transaction(operations);
  }

  async moveCard(cardId: string, dto: MoveCardDto, userId: string) {
    const card = await this.prisma.pmBoardCard.findUnique({
      where: { id: cardId },
      include: {
        column: {
          include: { board: true },
        },
        workPackage: true,
      },
    });
    if (!card) throw new NotFoundException('Board card not found');

    const targetColumn = await this.prisma.pmBoardColumn.findUnique({
      where: { id: dto.targetColumnId },
    });
    if (!targetColumn) throw new NotFoundException('Target column not found');

    if (targetColumn.boardId !== card.column.boardId) {
      throw new BadRequestException('Cannot move card to a column on a different board');
    }

    // Update card position and column
    await this.prisma.pmBoardCard.update({
      where: { id: cardId },
      data: {
        columnId: dto.targetColumnId,
        position: dto.position,
      },
    });

    // For STATUS boards, update the work package status
    if (card.column.board.type === 'STATUS') {
      const columnQuery = targetColumn.query as Record<string, any> | null;
      const mappedStatusId = columnQuery?.statusId;

      if (mappedStatusId && mappedStatusId !== card.workPackage.statusId) {
        // Check if status changed to closed
        const [newStatus, oldStatus] = await Promise.all([
          this.prisma.pmStatus.findUnique({ where: { id: mappedStatusId } }),
          this.prisma.pmStatus.findUnique({ where: { id: card.workPackage.statusId } }),
        ]);

        const updateData: any = { statusId: mappedStatusId };
        if (newStatus?.isClosed) {
          updateData.closedAt = new Date();
        } else if (oldStatus?.isClosed) {
          updateData.closedAt = null;
        }

        await this.prisma.pmWorkPackage.update({
          where: { id: card.workPackage.id },
          data: updateData,
        });

        // Write journal entry for status change
        await this.prisma.pmJournal.create({
          data: {
            workPackageId: card.workPackage.id,
            userId,
            notes: 'Status changed via board',
            details: {
              create: [{
                property: 'statusId',
                oldValue: card.workPackage.statusId,
                newValue: mappedStatusId,
              }],
            },
          },
        });

        this.eventBus.emit(PmEvents.WORK_PACKAGE_UPDATED, {
          workPackageId: card.workPackage.id,
          changes: ['statusId'],
        });
      }
    }

    // For ASSIGNEE boards, update assignee
    if (card.column.board.type === 'ASSIGNEE') {
      const columnQuery = targetColumn.query as Record<string, any> | null;
      const mappedAssigneeId = columnQuery?.assigneeId ?? null;

      if (mappedAssigneeId !== card.workPackage.assigneeId) {
        await this.prisma.pmWorkPackage.update({
          where: { id: card.workPackage.id },
          data: { assigneeId: mappedAssigneeId },
        });

        await this.prisma.pmJournal.create({
          data: {
            workPackageId: card.workPackage.id,
            userId,
            notes: 'Assignee changed via board',
            details: {
              create: [{
                property: 'assigneeId',
                oldValue: card.workPackage.assigneeId,
                newValue: mappedAssigneeId,
              }],
            },
          },
        });
      }
    }
  }

  async syncBoard(boardId: string) {
    const board = await this.prisma.pmBoard.findUnique({
      where: { id: boardId },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: { cards: true },
        },
      },
    });
    if (!board) return;

    if (board.type === 'STATUS') {
      await this.syncStatusBoard(board);
    } else if (board.type === 'ASSIGNEE') {
      await this.syncAssigneeBoard(board);
    } else if (board.type === 'VERSION') {
      await this.syncVersionBoard(board);
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────

  private async autoCreateStatusColumns(boardId: string, projectId: string) {
    // Get all statuses (workspace-level)
    const statuses = await this.prisma.pmStatus.findMany({
      orderBy: { position: 'asc' },
    });

    const operations = statuses.map((status, index) =>
      this.prisma.pmBoardColumn.create({
        data: {
          boardId,
          name: status.name,
          position: index,
          query: { statusId: status.id },
        },
      }),
    );

    if (operations.length > 0) {
      await this.prisma.$transaction(operations);
    }
  }

  private async autoCreateAssigneeColumns(boardId: string, projectId: string) {
    // Get unique assignees from project's work packages
    const assignees = await this.prisma.pmWorkPackage.findMany({
      where: { projectId, deletedAt: null, assigneeId: { not: null } },
      distinct: ['assigneeId'],
      select: { assigneeId: true },
    });

    const operations: any[] = [];

    // Add "Unassigned" column first
    operations.push(
      this.prisma.pmBoardColumn.create({
        data: {
          boardId,
          name: 'Unassigned',
          position: 0,
          query: { assigneeId: null },
        },
      }),
    );

    assignees.forEach((a, index) => {
      operations.push(
        this.prisma.pmBoardColumn.create({
          data: {
            boardId,
            name: a.assigneeId!, // Will be resolved to name on frontend
            position: index + 1,
            query: { assigneeId: a.assigneeId },
          },
        }),
      );
    });

    await this.prisma.$transaction(operations);
  }

  private async autoCreateVersionColumns(boardId: string, projectId: string) {
    const versions = await this.prisma.pmVersion.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    const operations: any[] = [];

    // "No version" column
    operations.push(
      this.prisma.pmBoardColumn.create({
        data: {
          boardId,
          name: 'Backlog',
          position: 0,
          query: { versionId: null },
        },
      }),
    );

    versions.forEach((v, index) => {
      operations.push(
        this.prisma.pmBoardColumn.create({
          data: {
            boardId,
            name: v.name,
            position: index + 1,
            query: { versionId: v.id },
          },
        }),
      );
    });

    await this.prisma.$transaction(operations);
  }

  private async syncStatusBoard(board: any) {
    const wps = await this.prisma.pmWorkPackage.findMany({
      where: { projectId: board.projectId, deletedAt: null },
      select: { id: true, statusId: true },
    });

    // Build status → column mapping
    const statusColumnMap = new Map<string, string>();
    for (const col of board.columns) {
      const query = col.query as Record<string, any> | null;
      if (query?.statusId) {
        statusColumnMap.set(query.statusId, col.id);
      }
    }

    // Collect existing card WP IDs
    const existingCardWpIds = new Set<string>();
    for (const col of board.columns) {
      for (const card of col.cards) {
        existingCardWpIds.add(card.workPackageId);
      }
    }

    // Delete all existing cards and rebuild
    await this.prisma.pmBoardCard.deleteMany({
      where: { columnId: { in: board.columns.map((c: any) => c.id) } },
    });

    const cardsToCreate: { columnId: string; workPackageId: string; position: number }[] = [];
    const positionCounters = new Map<string, number>();

    for (const wp of wps) {
      const columnId = statusColumnMap.get(wp.statusId);
      if (!columnId) continue;

      const pos = positionCounters.get(columnId) ?? 0;
      cardsToCreate.push({
        columnId,
        workPackageId: wp.id,
        position: pos,
      });
      positionCounters.set(columnId, pos + 1);
    }

    if (cardsToCreate.length > 0) {
      await this.prisma.pmBoardCard.createMany({ data: cardsToCreate });
    }
  }

  private async syncAssigneeBoard(board: any) {
    const wps = await this.prisma.pmWorkPackage.findMany({
      where: { projectId: board.projectId, deletedAt: null },
      select: { id: true, assigneeId: true },
    });

    const assigneeColumnMap = new Map<string | null, string>();
    for (const col of board.columns) {
      const query = col.query as Record<string, any> | null;
      assigneeColumnMap.set(query?.assigneeId ?? null, col.id);
    }

    await this.prisma.pmBoardCard.deleteMany({
      where: { columnId: { in: board.columns.map((c: any) => c.id) } },
    });

    const cardsToCreate: { columnId: string; workPackageId: string; position: number }[] = [];
    const positionCounters = new Map<string, number>();

    for (const wp of wps) {
      const columnId = assigneeColumnMap.get(wp.assigneeId);
      if (!columnId) continue;

      const pos = positionCounters.get(columnId) ?? 0;
      cardsToCreate.push({
        columnId,
        workPackageId: wp.id,
        position: pos,
      });
      positionCounters.set(columnId, pos + 1);
    }

    if (cardsToCreate.length > 0) {
      await this.prisma.pmBoardCard.createMany({ data: cardsToCreate });
    }
  }

  private async syncVersionBoard(board: any) {
    const wps = await this.prisma.pmWorkPackage.findMany({
      where: { projectId: board.projectId, deletedAt: null },
      select: { id: true, versionId: true },
    });

    const versionColumnMap = new Map<string | null, string>();
    for (const col of board.columns) {
      const query = col.query as Record<string, any> | null;
      versionColumnMap.set(query?.versionId ?? null, col.id);
    }

    await this.prisma.pmBoardCard.deleteMany({
      where: { columnId: { in: board.columns.map((c: any) => c.id) } },
    });

    const cardsToCreate: { columnId: string; workPackageId: string; position: number }[] = [];
    const positionCounters = new Map<string, number>();

    for (const wp of wps) {
      const columnId = versionColumnMap.get(wp.versionId);
      if (!columnId) continue;

      const pos = positionCounters.get(columnId) ?? 0;
      cardsToCreate.push({
        columnId,
        workPackageId: wp.id,
        position: pos,
      });
      positionCounters.set(columnId, pos + 1);
    }

    if (cardsToCreate.length > 0) {
      await this.prisma.pmBoardCard.createMany({ data: cardsToCreate });
    }
  }

  private async syncBoardsByType(projectId: string, type: string) {
    const boards = await this.prisma.pmBoard.findMany({
      where: { projectId, type: type as any },
      select: { id: true },
    });

    for (const board of boards) {
      await this.syncBoard(board.id);
    }
  }

  private async getProjectIdFromWp(workPackageId: string): Promise<string | null> {
    const wp = await this.prisma.pmWorkPackage.findUnique({
      where: { id: workPackageId },
      select: { projectId: true },
    });
    return wp?.projectId ?? null;
  }
}
