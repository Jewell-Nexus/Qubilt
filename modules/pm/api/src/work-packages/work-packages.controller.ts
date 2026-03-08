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
import { WorkPackagesService } from './work-packages.service';
import { CreateWorkPackageDto } from './dto/create-work-package.dto';
import { UpdateWorkPackageDto } from './dto/update-work-package.dto';
import { FilterWorkPackagesDto } from './dto/filter-work-packages.dto';
import { BulkUpdateDto } from './dto/bulk-update.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class WorkPackagesController {
  constructor(private workPackagesService: WorkPackagesService) {}

  @Get('projects/:pid/work-packages')
  @RequirePermissions('pm.work_packages.view')
  async findAll(
    @Param('pid') projectId: string,
    @Query() filters: FilterWorkPackagesDto,
  ) {
    const data = await this.workPackagesService.findAll(projectId, filters);
    return { success: true, ...data };
  }

  @Post('projects/:pid/work-packages')
  @RequirePermissions('pm.work_packages.create')
  async create(
    @Param('pid') projectId: string,
    @Body() dto: CreateWorkPackageDto,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.workPackagesService.create(
      projectId,
      dto,
      user.userId,
    );
    return { success: true, data };
  }

  @Get('work-packages/:id')
  @RequirePermissions('pm.work_packages.view')
  async findOne(@Param('id') id: string) {
    const data = await this.workPackagesService.findOne(id);
    return { success: true, data };
  }

  @Patch('work-packages/:id')
  @RequirePermissions('pm.work_packages.edit')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkPackageDto,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.workPackagesService.update(id, dto, user.userId);
    return { success: true, data };
  }

  @Delete('work-packages/:id')
  @RequirePermissions('pm.work_packages.delete')
  async delete(@Param('id') id: string) {
    await this.workPackagesService.delete(id);
    return { success: true };
  }

  @Post('work-packages/bulk-update')
  @RequirePermissions('pm.work_packages.edit')
  async bulkUpdate(@Body() dto: BulkUpdateDto) {
    const data = await this.workPackagesService.bulkUpdate(dto);
    return { success: true, data };
  }
}
