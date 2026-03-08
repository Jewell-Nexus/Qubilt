import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TeamPlannerService } from './planner.service';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class TeamPlannerController {
  constructor(private plannerService: TeamPlannerService) {}

  @Get('projects/:pid/team-planner')
  @RequirePermissions('pm.work_packages.view')
  async getPlanner(
    @Param('pid') projectId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const data = await this.plannerService.getPlanner(projectId, from, to);
    return { success: true, data };
  }
}
