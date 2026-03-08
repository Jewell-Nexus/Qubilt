import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BaselinesService } from './baselines.service';
import { CreateBaselineDto } from './dto/create-baseline.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class BaselinesController {
  constructor(private baselinesService: BaselinesService) {}

  @Get('projects/:pid/baselines')
  @RequirePermissions('pm.work_packages.view')
  async findAll(@Param('pid') projectId: string) {
    const data = await this.baselinesService.findAll(projectId);
    return { success: true, data };
  }

  @Post('projects/:pid/baselines')
  @RequirePermissions('pm.work_packages.edit')
  async create(
    @Param('pid') projectId: string,
    @Body() dto: CreateBaselineDto,
    @Req() req: any,
  ) {
    const data = await this.baselinesService.create(projectId, dto.name, req.user.id);
    return { success: true, data };
  }

  @Get('baselines/:id/compare')
  @RequirePermissions('pm.work_packages.view')
  async compare(@Param('id') id: string) {
    const data = await this.baselinesService.compare(id);
    return { success: true, data };
  }
}
