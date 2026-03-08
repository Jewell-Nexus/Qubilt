import {
  Controller,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class SchedulingController {
  constructor(private schedulingService: SchedulingService) {}

  @Post('projects/:pid/schedule')
  @RequirePermissions('pm.work_packages.edit')
  async calculateSchedule(@Param('pid') projectId: string) {
    const data = await this.schedulingService.calculateSchedule(projectId);
    return { success: true, data };
  }
}
