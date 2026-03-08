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
import { PrioritiesService } from './priorities.service';
import { CreatePriorityDto } from './dto/create-priority.dto';
import { UpdatePriorityDto } from './dto/update-priority.dto';
import { ReorderDto } from '../types/dto/reorder.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm/priorities')
export class PrioritiesController {
  constructor(private prioritiesService: PrioritiesService) {}

  @Get()
  @RequirePermissions('pm.types.view')
  async findAll(@Query('workspaceId') workspaceId: string) {
    const data = await this.prioritiesService.findAll(workspaceId);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('pm.types.manage')
  async create(@Body() dto: CreatePriorityDto) {
    const data = await this.prioritiesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @RequirePermissions('pm.types.manage')
  async update(@Param('id') id: string, @Body() dto: UpdatePriorityDto) {
    const data = await this.prioritiesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('pm.types.manage')
  async delete(@Param('id') id: string) {
    await this.prioritiesService.delete(id);
    return { success: true };
  }

  @Post('reorder')
  @RequirePermissions('pm.types.manage')
  async reorder(@Body() dto: ReorderDto) {
    await this.prioritiesService.reorder(dto.workspaceId, dto.orderedIds);
    return { success: true };
  }
}
