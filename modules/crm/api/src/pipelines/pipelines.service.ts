import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CrmPrismaService } from '../prisma/crm-prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto, UpdateStageDto } from './dto/create-stage.dto';

const DEFAULT_STAGES = [
  { name: 'New Lead', probability: 10, color: '#6366F1', position: 0 },
  { name: 'Qualified', probability: 25, color: '#3B82F6', position: 1 },
  { name: 'Proposal', probability: 50, color: '#F59E0B', position: 2 },
  { name: 'Negotiation', probability: 75, color: '#F97316', position: 3 },
  { name: 'Closed Won', probability: 100, color: '#10B981', position: 4, isWon: true, isClosed: true },
  { name: 'Closed Lost', probability: 0, color: '#EF4444', position: 5, isClosed: true },
];

@Injectable()
export class PipelinesService {
  constructor(private prisma: CrmPrismaService) {}

  async create(dto: CreatePipelineDto) {
    const pipeline = await this.prisma.crmPipeline.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        description: dto.description,
        stages: {
          create: DEFAULT_STAGES.map((s) => ({
            name: s.name,
            probability: s.probability,
            color: s.color,
            position: s.position,
            isWon: s.isWon ?? false,
            isClosed: s.isClosed ?? false,
          })),
        },
      },
      include: { stages: { orderBy: { position: 'asc' } } },
    });

    return pipeline;
  }

  async findAll(workspaceId: string) {
    const pipelines = await this.prisma.crmPipeline.findMany({
      where: { workspaceId },
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { deals: true } },
            deals: {
              where: { status: 'OPEN' },
              select: { value: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return pipelines.map((p) => ({
      ...p,
      stages: p.stages.map((s) => ({
        id: s.id,
        pipelineId: s.pipelineId,
        name: s.name,
        position: s.position,
        probability: s.probability,
        color: s.color,
        isWon: s.isWon,
        isClosed: s.isClosed,
        dealCount: s._count.deals,
        totalValue: s.deals.reduce((sum, d) => sum + Number(d.value), 0),
      })),
    }));
  }

  async findOne(id: string) {
    const pipeline = await this.prisma.crmPipeline.findUnique({
      where: { id },
      include: { stages: { orderBy: { position: 'asc' } } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    return pipeline;
  }

  async update(id: string, dto: UpdatePipelineDto) {
    const pipeline = await this.prisma.crmPipeline.findUnique({ where: { id } });
    if (!pipeline) throw new NotFoundException('Pipeline not found');

    return this.prisma.crmPipeline.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
      include: { stages: { orderBy: { position: 'asc' } } },
    });
  }

  async addStage(pipelineId: string, dto: CreateStageDto) {
    const pipeline = await this.findOne(pipelineId);
    const maxPosition = pipeline.stages.reduce((max, s) => Math.max(max, s.position), -1);

    return this.prisma.crmPipelineStage.create({
      data: {
        pipelineId,
        name: dto.name,
        probability: dto.probability ?? 0,
        color: dto.color,
        isWon: dto.isWon ?? false,
        isClosed: dto.isClosed ?? false,
        position: maxPosition + 1,
      },
    });
  }

  async updateStage(stageId: string, dto: UpdateStageDto) {
    const stage = await this.prisma.crmPipelineStage.findUnique({ where: { id: stageId } });
    if (!stage) throw new NotFoundException('Stage not found');

    return this.prisma.crmPipelineStage.update({
      where: { id: stageId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.probability !== undefined && { probability: dto.probability }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.isWon !== undefined && { isWon: dto.isWon }),
        ...(dto.isClosed !== undefined && { isClosed: dto.isClosed }),
      },
    });
  }

  async reorderStages(pipelineId: string, orderedIds: string[]) {
    await this.findOne(pipelineId);

    const updates = orderedIds.map((id, index) =>
      this.prisma.crmPipelineStage.update({
        where: { id },
        data: { position: index },
      }),
    );

    await this.prisma.$transaction(updates);
  }

  async deleteStage(stageId: string) {
    const stage = await this.prisma.crmPipelineStage.findUnique({
      where: { id: stageId },
      include: {
        _count: { select: { deals: true } },
        pipeline: { include: { stages: { orderBy: { position: 'asc' } } } },
      },
    });
    if (!stage) throw new NotFoundException('Stage not found');

    if (stage._count.deals > 0) {
      // Find next stage to move deals to
      const nextStage = stage.pipeline.stages.find((s) => s.position > stage.position && s.id !== stageId);
      if (!nextStage) {
        throw new BadRequestException('Cannot delete stage: no subsequent stage to move deals to');
      }

      await this.prisma.$transaction([
        this.prisma.crmDeal.updateMany({
          where: { stageId },
          data: { stageId: nextStage.id },
        }),
        this.prisma.crmPipelineStage.delete({ where: { id: stageId } }),
      ]);
    } else {
      await this.prisma.crmPipelineStage.delete({ where: { id: stageId } });
    }
  }

  async delete(pipelineId: string) {
    const pipeline = await this.prisma.crmPipeline.findUnique({
      where: { id: pipelineId },
      include: { _count: { select: { deals: true } } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found');
    if (pipeline._count.deals > 0) {
      throw new BadRequestException('Cannot delete pipeline with existing deals');
    }

    await this.prisma.crmPipeline.delete({ where: { id: pipelineId } });
  }
}
