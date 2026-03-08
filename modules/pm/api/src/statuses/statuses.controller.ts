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
import { StatusesService } from './statuses.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ReorderDto } from '../types/dto/reorder.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm/statuses')
export class StatusesController {
  constructor(private statusesService: StatusesService) {}

  @Get()
  @RequirePermissions('pm.types.view')
  async findAll(@Query('workspaceId') workspaceId: string) {
    const data = await this.statusesService.findAll(workspaceId);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('pm.types.manage')
  async create(@Body() dto: CreateStatusDto) {
    const data = await this.statusesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @RequirePermissions('pm.types.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    const data = await this.statusesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('pm.types.manage')
  async delete(@Param('id') id: string) {
    await this.statusesService.delete(id);
    return { success: true };
  }

  @Post('reorder')
  @RequirePermissions('pm.types.manage')
  async reorder(@Body() dto: ReorderDto) {
    await this.statusesService.reorder(dto.workspaceId, dto.orderedIds);
    return { success: true };
  }
}
