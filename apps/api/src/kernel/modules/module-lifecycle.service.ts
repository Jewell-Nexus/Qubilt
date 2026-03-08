import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ModuleRegistryService } from './module-registry.service';
import { EventBusService } from '../events/event-bus.service';
import { KernelEvents } from '../events/kernel.events';
type ModuleSource = 'CORE' | 'MARKETPLACE' | 'CUSTOM';

@Injectable()
export class ModuleLifecycleService {
  private readonly logger = new Logger(ModuleLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private registry: ModuleRegistryService,
    private eventBus: EventBusService,
  ) {}

  async install(
    moduleId: string,
    version: string,
    source: ModuleSource,
    licenseKey?: string,
  ): Promise<void> {
    const existing = await this.prisma.installedModule.findUnique({
      where: { moduleId },
    });
    if (existing) {
      throw new ConflictException(`Module ${moduleId} is already installed`);
    }

    await this.prisma.installedModule.create({
      data: { moduleId, version, source, licenseKey },
    });

    const moduleDef = this.registry.get(moduleId);
    if (moduleDef?.onInstall) {
      await moduleDef.onInstall();
    }

    this.eventBus.emit(KernelEvents.MODULE_INSTALLED, { moduleId, version });
    this.logger.log(`Module installed: ${moduleId}@${version}`);
  }

  async enable(
    moduleId: string,
    workspaceId: string,
    settings?: Record<string, any>,
  ): Promise<void> {
    const installed = await this.prisma.installedModule.findUnique({
      where: { moduleId },
    });
    if (!installed) {
      throw new NotFoundException(`Module ${moduleId} is not installed`);
    }

    await this.prisma.workspaceModule.upsert({
      where: {
        workspaceId_installedModuleId: {
          workspaceId,
          installedModuleId: installed.id,
        },
      },
      create: {
        workspaceId,
        installedModuleId: installed.id,
        enabled: true,
        settings: settings ?? {},
      },
      update: {
        enabled: true,
        ...(settings !== undefined && { settings }),
      },
    });

    const moduleDef = this.registry.get(moduleId);
    if (moduleDef?.onEnable) {
      await moduleDef.onEnable(workspaceId);
    }

    this.eventBus.emit(KernelEvents.MODULE_ENABLED, { moduleId, workspaceId });
    this.logger.log(`Module ${moduleId} enabled for workspace ${workspaceId}`);
  }

  async disable(moduleId: string, workspaceId: string): Promise<void> {
    const installed = await this.prisma.installedModule.findUnique({
      where: { moduleId },
    });
    if (!installed) {
      throw new NotFoundException(`Module ${moduleId} is not installed`);
    }

    await this.prisma.workspaceModule.updateMany({
      where: { workspaceId, installedModuleId: installed.id },
      data: { enabled: false },
    });

    const moduleDef = this.registry.get(moduleId);
    if (moduleDef?.onDisable) {
      await moduleDef.onDisable(workspaceId);
    }

    this.eventBus.emit(KernelEvents.MODULE_DISABLED, {
      moduleId,
      workspaceId,
    });
    this.logger.log(`Module ${moduleId} disabled for workspace ${workspaceId}`);
  }

  async uninstall(moduleId: string): Promise<void> {
    const installed = await this.prisma.installedModule.findUnique({
      where: { moduleId },
      include: {
        enabledInWorkspaces: { where: { enabled: true }, take: 1 },
      },
    });
    if (!installed) {
      throw new NotFoundException(`Module ${moduleId} is not installed`);
    }
    if (installed.enabledInWorkspaces.length > 0) {
      throw new BadRequestException(
        `Module ${moduleId} is still enabled in one or more workspaces`,
      );
    }

    const moduleDef = this.registry.get(moduleId);
    if (moduleDef?.onUninstall) {
      await moduleDef.onUninstall();
    }

    await this.prisma.installedModule.delete({ where: { moduleId } });
    this.eventBus.emit(KernelEvents.MODULE_UNINSTALLED, { moduleId });
    this.logger.log(`Module uninstalled: ${moduleId}`);
  }
}
