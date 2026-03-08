import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto, UpdateStageDto, ReorderStagesDto } from './dto/create-stage.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('crm')
export class PipelinesController {
  constructor(private pipelinesService: PipelinesService) {}

  @Get('pipelines')
  @RequirePermissions('crm.deals.view')
  async findAll(@Query('workspaceId') workspaceId: string) {
    const data = await this.pipelinesService.findAll(workspaceId);
    return { success: true, data };
  }

  @Post('pipelines')
  @RequirePermissions('crm.deals.create')
  async create(@Body() dto: CreatePipelineDto) {
    const data = await this.pipelinesService.create(dto);
    return { success: true, data };
  }

  @Get('pipelines/:id')
  @RequirePermissions('crm.deals.view')
  async findOne(@Param('id') id: string) {
    const data = await this.pipelinesService.findOne(id);
    return { success: true, data };
  }

  @Patch('pipelines/:id')
  @RequirePermissions('crm.deals.edit')
  async update(@Param('id') id: string, @Body() dto: UpdatePipelineDto) {
    const data = await this.pipelinesService.update(id, dto);
    return { success: true, data };
  }

  @Delete('pipelines/:id')
  @RequirePermissions('crm.deals.delete')
  async delete(@Param('id') id: string) {
    await this.pipelinesService.delete(id);
    return { success: true };
  }

  @Post('pipelines/:id/stages')
  @RequirePermissions('crm.deals.edit')
  async addStage(@Param('id') pipelineId: string, @Body() dto: CreateStageDto) {
    const data = await this.pipelinesService.addStage(pipelineId, dto);
    return { success: true, data };
  }

  @Patch('pipeline-stages/:id')
  @RequirePermissions('crm.deals.edit')
  async updateStage(@Param('id') stageId: string, @Body() dto: UpdateStageDto) {
    const data = await this.pipelinesService.updateStage(stageId, dto);
    return { success: true, data };
  }

  @Post('pipelines/:id/stages/reorder')
  @RequirePermissions('crm.deals.edit')
  async reorderStages(@Param('id') pipelineId: string, @Body() dto: ReorderStagesDto) {
    await this.pipelinesService.reorderStages(pipelineId, dto.orderedIds);
    return { success: true };
  }

  @Delete('pipeline-stages/:id')
  @RequirePermissions('crm.deals.delete')
  async deleteStage(@Param('id') stageId: string) {
    await this.pipelinesService.deleteStage(stageId);
    return { success: true };
  }
}
