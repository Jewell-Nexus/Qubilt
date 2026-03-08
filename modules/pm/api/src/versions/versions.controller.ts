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
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class VersionsController {
  constructor(private versionsService: VersionsService) {}

  @Get('projects/:pid/versions')
  @RequirePermissions('pm.work_packages.view')
  async findAll(@Param('pid') projectId: string) {
    const data = await this.versionsService.findAll(projectId);
    return { success: true, data };
  }

  @Post('projects/:pid/versions')
  @RequirePermissions('pm.versions.manage')
  async create(
    @Param('pid') projectId: string,
    @Body() dto: CreateVersionDto,
  ) {
    const data = await this.versionsService.create(projectId, dto);
    return { success: true, data };
  }

  @Patch('versions/:id')
  @RequirePermissions('pm.versions.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateVersionDto) {
    const data = await this.versionsService.update(id, dto);
    return { success: true, data };
  }

  @Post('versions/:id/close')
  @RequirePermissions('pm.versions.manage')
  async close(@Param('id') id: string) {
    const data = await this.versionsService.close(id);
    return { success: true, data };
  }

  @Delete('versions/:id')
  @RequirePermissions('pm.versions.manage')
  async delete(@Param('id') id: string) {
    await this.versionsService.delete(id);
    return { success: true };
  }
}
