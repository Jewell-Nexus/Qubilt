import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreateRelationDto, RelationType, MIRROR_MAP } from './dto/create-relation.dto';
import { SchedulingService } from '../scheduling/scheduling.service';

// Relation types that are directional and could cause circular dependencies
const DIRECTIONAL_TYPES = new Set<RelationType>([
  RelationType.PRECEDES,
  RelationType.FOLLOWS,
  RelationType.BLOCKS,
  RelationType.BLOCKED_BY,
]);

// Relation types that affect scheduling
const SCHEDULING_TYPES = new Set<RelationType>([
  RelationType.PRECEDES,
  RelationType.FOLLOWS,
]);

@Injectable()
export class RelationsService {
  constructor(
    private prisma: PmPrismaService,
    @Inject(forwardRef(() => SchedulingService))
    private schedulingService: SchedulingService,
  ) {}

  async create(fromId: string, dto: CreateRelationDto) {
    if (fromId === dto.toId) {
      throw new BadRequestException('Cannot create relation to self');
    }

    // Check both work packages exist
    const [fromWp, toWp] = await Promise.all([
      this.prisma.pmWorkPackage.findFirst({
        where: { id: fromId, deletedAt: null },
      }),
      this.prisma.pmWorkPackage.findFirst({
        where: { id: dto.toId, deletedAt: null },
      }),
    ]);
    if (!fromWp) throw new NotFoundException('Source work package not found');
    if (!toWp) throw new NotFoundException('Target work package not found');

    // Prevent circular dependencies for directional types
    if (DIRECTIONAL_TYPES.has(dto.type)) {
      await this.checkCircular(fromId, dto.toId, dto.type);
    }

    const operations: any[] = [];

    // Create the primary relation
    operations.push(
      this.prisma.pmRelation.create({
        data: {
          fromId,
          toId: dto.toId,
          type: dto.type,
          delay: dto.delay,
          description: dto.description,
        },
      }),
    );

    // Create mirrored relation if applicable
    const mirrorType = MIRROR_MAP[dto.type];
    if (mirrorType) {
      operations.push(
        this.prisma.pmRelation.create({
          data: {
            fromId: dto.toId,
            toId: fromId,
            type: mirrorType,
            delay: dto.delay,
            description: dto.description,
          },
        }),
      );
    }

    const results = await this.prisma.$transaction(operations);

    // Auto-schedule if this is a scheduling-related relation
    if (SCHEDULING_TYPES.has(dto.type)) {
      const wp = await this.prisma.pmWorkPackage.findUnique({
        where: { id: fromId },
        select: { projectId: true },
      });
      if (wp) {
        this.schedulingService.calculateSchedule(wp.projectId).catch(() => {});
      }
    }

    return results[0];
  }

  async delete(id: string) {
    const relation = await this.prisma.pmRelation.findUnique({
      where: { id },
    });
    if (!relation) throw new NotFoundException('Relation not found');

    const operations: any[] = [
      this.prisma.pmRelation.delete({ where: { id } }),
    ];

    // Delete mirrored relation
    const mirrorType = MIRROR_MAP[relation.type as RelationType];
    if (mirrorType) {
      operations.push(
        this.prisma.pmRelation.deleteMany({
          where: {
            fromId: relation.toId,
            toId: relation.fromId,
            type: mirrorType,
          },
        }),
      );
    }

    await this.prisma.$transaction(operations);

    // Auto-schedule if this was a scheduling-related relation
    if (SCHEDULING_TYPES.has(relation.type as RelationType)) {
      const wp = await this.prisma.pmWorkPackage.findUnique({
        where: { id: relation.fromId },
        select: { projectId: true },
      });
      if (wp) {
        this.schedulingService.calculateSchedule(wp.projectId).catch(() => {});
      }
    }
  }

  async findForWorkPackage(workPackageId: string) {
    const [outgoing, incoming] = await Promise.all([
      this.prisma.pmRelation.findMany({
        where: { fromId: workPackageId },
        include: {
          to: {
            select: { id: true, subject: true, statusId: true, typeId: true },
          },
        },
      }),
      this.prisma.pmRelation.findMany({
        where: { toId: workPackageId },
        include: {
          from: {
            select: { id: true, subject: true, statusId: true, typeId: true },
          },
        },
      }),
    ]);

    return { outgoing, incoming };
  }

  private async checkCircular(
    fromId: string,
    toId: string,
    type: RelationType,
  ) {
    // For PRECEDES/FOLLOWS and BLOCKS/BLOCKED_BY, check if the reverse path exists
    // i.e., toId already (directly or transitively) precedes/blocks fromId
    const visited = new Set<string>();
    const queue = [toId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === fromId) {
        throw new BadRequestException(
          'This relation would create a circular dependency',
        );
      }
      if (visited.has(current)) continue;
      visited.add(current);

      // Follow outgoing relations of the same type
      const outgoing = await this.prisma.pmRelation.findMany({
        where: { fromId: current, type },
        select: { toId: true },
      });
      for (const rel of outgoing) {
        if (!visited.has(rel.toId)) {
          queue.push(rel.toId);
        }
      }
    }
  }
}
