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
import { TimeEntriesService } from './time-entries.service';
import { LogTimeDto } from './dto/log-time.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { FilterTimeEntriesDto } from './dto/filter-time-entries.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Post('time')
  @RequirePermissions('pm.time.log')
  async log(
    @Body() dto: LogTimeDto,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.timeEntriesService.log(dto, user.userId);
    return { success: true, data };
  }

  @Get('time')
  @RequirePermissions('pm.time.log')
  async list(@Query() filters: FilterTimeEntriesDto) {
    const result = await this.timeEntriesService.list(filters);
    return { success: true, ...result };
  }

  @Patch('time/:id')
  @RequirePermissions('pm.time.log')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTimeEntryDto,
    @CurrentUser() user: { userId: string; permissions?: string[] },
  ) {
    const hasViewAll = user.permissions?.includes('pm.time.view_all') ?? false;
    const data = await this.timeEntriesService.update(id, dto, user.userId, hasViewAll);
    return { success: true, data };
  }

  @Delete('time/:id')
  @RequirePermissions('pm.time.log')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; permissions?: string[] },
  ) {
    const hasViewAll = user.permissions?.includes('pm.time.view_all') ?? false;
    await this.timeEntriesService.delete(id, user.userId, hasViewAll);
    return { success: true };
  }

  @Get('time/report')
  @RequirePermissions('pm.time.view_all')
  async report(
    @Query('projectId') projectId: string,
    @Query('groupBy') groupBy: 'user' | 'activity' | 'date' | 'work-package',
  ) {
    const data = await this.timeEntriesService.report(projectId, groupBy ?? 'user');
    return { success: true, data };
  }

  @Get('projects/:pid/time-activities')
  @RequirePermissions('pm.time.log')
  async findActivities(@Query('workspaceId') workspaceId: string) {
    const data = await this.timeEntriesService.findActivities(workspaceId);
    return { success: true, data };
  }
}
