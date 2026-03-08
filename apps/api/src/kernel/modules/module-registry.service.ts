import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Mirrors @qubilt/module-sdk QubiltModule — kept here to avoid rootDir issues
export interface QubiltModuleDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  icon: string;
  accentColor: string;
  category: string;
  dependencies?: string[];
  permissions?: { key: string; name: string; category: string; description?: string }[];
  settingsSchema?: Record<string, unknown>;
  navigation?: unknown[];
  widgets?: unknown[];
  eventHandlers?: unknown[];
  searchProviders?: unknown[];
  onInstall?(): Promise<void>;
  onEnable?(workspaceId: string): Promise<void>;
  onDisable?(workspaceId: string): Promise<void>;
  onUninstall?(): Promise<void>;
}

@Injectable()
export class ModuleRegistryService {
  private readonly logger = new Logger(ModuleRegistryService.name);
  private readonly registry = new Map<string, QubiltModuleDefinition>();

  constructor(private prisma: PrismaService) {}

  register(module: QubiltModuleDefinition): void {
    if (!module.id || !module.name || !module.version || !module.accentColor) {
      throw new Error(
        `Module missing required fields (id, name, version, accentColor): ${module.id ?? 'unknown'}`,
      );
    }
    this.registry.set(module.id, module);
    this.logger.log(`Module registered: ${module.id}@${module.version}`);
  }

  get(moduleId: string): QubiltModuleDefinition | undefined {
    return this.registry.get(moduleId);
  }

  getAll(): QubiltModuleDefinition[] {
    return Array.from(this.registry.values());
  }

  isRegistered(moduleId: string): boolean {
    return this.registry.has(moduleId);
  }

  async getEnabled(workspaceId: string): Promise<QubiltModuleDefinition[]> {
    const workspaceModules = await this.prisma.workspaceModule.findMany({
      where: { workspaceId, enabled: true },
      include: { installedModule: { select: { moduleId: true } } },
    });

    return workspaceModules
      .map((wm) => this.registry.get(wm.installedModule.moduleId))
      .filter((m): m is QubiltModuleDefinition => m !== undefined);
  }

  async isEnabledForWorkspace(
    moduleId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const record = await this.prisma.workspaceModule.findFirst({
      where: {
        workspaceId,
        enabled: true,
        installedModule: { moduleId },
      },
    });
    return !!record;
  }
}
