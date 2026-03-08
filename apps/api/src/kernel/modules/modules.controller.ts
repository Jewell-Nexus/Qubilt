import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { ModuleRegistryService } from './module-registry.service';
import { ModuleLifecycleService } from './module-lifecycle.service';
import { PrismaService } from '../../database/prisma.service';
import { UpdateModuleSettingsDto } from './dto/update-module-settings.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(
    private registry: ModuleRegistryService,
    private lifecycle: ModuleLifecycleService,
    private prisma: PrismaService,
  ) {}

  @Get('modules')
  async listInstalled() {
    return this.prisma.installedModule.findMany({
      orderBy: { installedAt: 'asc' },
    });
  }

  @Get('workspaces/:wid/modules')
  async listEnabled(@Param('wid') workspaceId: string) {
    return this.prisma.workspaceModule.findMany({
      where: { workspaceId, enabled: true },
      include: {
        installedModule: {
          select: { moduleId: true, version: true, source: true },
        },
      },
    });
  }

  @Post('workspaces/:wid/modules/:mid/enable')
  @RequirePermissions('kernel.modules.manage')
  async enable(
    @Param('wid') workspaceId: string,
    @Param('mid') moduleId: string,
  ) {
    await this.lifecycle.enable(moduleId, workspaceId);
    return { message: `Module ${moduleId} enabled` };
  }

  @Post('workspaces/:wid/modules/:mid/disable')
  @RequirePermissions('kernel.modules.manage')
  async disable(
    @Param('wid') workspaceId: string,
    @Param('mid') moduleId: string,
  ) {
    await this.lifecycle.disable(moduleId, workspaceId);
    return { message: `Module ${moduleId} disabled` };
  }

  @Get('modules/:mid/settings-schema')
  async getSettingsSchema(@Param('mid') moduleId: string) {
    const moduleDef = this.registry.get(moduleId);
    if (!moduleDef) throw new NotFoundException('Module not found in registry');
    return moduleDef.settingsSchema ?? {};
  }

  @Patch('workspaces/:wid/modules/:mid/settings')
  @RequirePermissions('kernel.modules.manage')
  async updateSettings(
    @Param('wid') workspaceId: string,
    @Param('mid') moduleId: string,
    @Body() dto: UpdateModuleSettingsDto,
  ) {
    const installed = await this.prisma.installedModule.findUnique({
      where: { moduleId },
    });
    if (!installed) throw new NotFoundException('Module not installed');

    return this.prisma.workspaceModule.update({
      where: {
        workspaceId_installedModuleId: {
          workspaceId,
          installedModuleId: installed.id,
        },
      },
      data: { settings: dto.settings },
    });
  }
}
