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
import { QueriesService } from './queries.service';
import { CreateQueryDto } from './dto/create-query.dto';
import { UpdateQueryDto } from './dto/update-query.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm/queries')
export class QueriesController {
  constructor(private queriesService: QueriesService) {}

  @Get()
  @RequirePermissions('pm.work_packages.view')
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('userId') userId?: string,
  ) {
    const data = await this.queriesService.findAll(projectId, userId);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('pm.work_packages.view')
  async create(
    @Body() dto: CreateQueryDto,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.queriesService.create(dto, user.userId);
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions('pm.work_packages.view')
  async findOne(@Param('id') id: string) {
    const data = await this.queriesService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @RequirePermissions('pm.work_packages.view')
  async update(@Param('id') id: string, @Body() dto: UpdateQueryDto) {
    const data = await this.queriesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('pm.work_packages.view')
  async delete(@Param('id') id: string) {
    await this.queriesService.delete(id);
    return { success: true };
  }

  @Post(':id/set-default')
  @RequirePermissions('pm.work_packages.view')
  async setDefault(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.queriesService.setDefault(id, user.userId);
    return { success: true, data };
  }
}
