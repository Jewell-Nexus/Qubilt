import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get<T>(
    workspaceId: string,
    moduleId: string,
    key: string,
    defaultValue?: T,
  ): Promise<T | undefined> {
    const setting = await this.prisma.setting.findUnique({
      where: { workspaceId_moduleId_key: { workspaceId, moduleId, key } },
    });

    if (!setting) return defaultValue;
    return setting.value as T;
  }

  async set(
    workspaceId: string,
    moduleId: string,
    key: string,
    value: unknown,
  ): Promise<void> {
    await this.prisma.setting.upsert({
      where: { workspaceId_moduleId_key: { workspaceId, moduleId, key } },
      update: { value: value as any },
      create: { workspaceId, moduleId, key, value: value as any },
    });
  }

  async getAll(
    workspaceId: string,
    moduleId: string,
  ): Promise<Record<string, unknown>> {
    const settings = await this.prisma.setting.findMany({
      where: { workspaceId, moduleId },
    });

    const result: Record<string, unknown> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async delete(
    workspaceId: string,
    moduleId: string,
    key: string,
  ): Promise<void> {
    await this.prisma.setting.deleteMany({
      where: { workspaceId, moduleId, key },
    });
  }
}
