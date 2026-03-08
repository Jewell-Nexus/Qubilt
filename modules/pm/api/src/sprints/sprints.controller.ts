import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SprintsService } from './sprints.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { CloseSprintDto } from './dto/close-sprint.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class SprintsController {
  constructor(private sprintsService: SprintsService) {}

  @Get('projects/:pid/sprints')
  @RequirePermissions('pm.work_packages.view')
  async findAll(@Param('pid') projectId: string) {
    const data = await this.sprintsService.findAll(projectId);
    return { success: true, data };
  }

  @Post('projects/:pid/sprints')
  @RequirePermissions('pm.versions.manage')
  async create(
    @Param('pid') projectId: string,
    @Body() dto: CreateSprintDto,
  ) {
    const data = await this.sprintsService.create(projectId, dto);
    return { success: true, data };
  }

  @Patch('sprints/:id')
  @RequirePermissions('pm.versions.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateSprintDto) {
    const data = await this.sprintsService.update(id, dto);
    return { success: true, data };
  }

  @Post('sprints/:id/start')
  @RequirePermissions('pm.versions.manage')
  async start(@Param('id') id: string) {
    const data = await this.sprintsService.start(id);
    return { success: true, data };
  }

  @Post('sprints/:id/close')
  @RequirePermissions('pm.versions.manage')
  async close(@Param('id') id: string, @Body() dto: CloseSprintDto) {
    const data = await this.sprintsService.close(id, dto.unfinishedStrategy);
    return { success: true, data };
  }

  @Delete('sprints/:id')
  @RequirePermissions('pm.versions.manage')
  async delete(@Param('id') id: string) {
    await this.sprintsService.delete(id);
    return { success: true };
  }
}
