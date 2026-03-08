import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

interface CacheEntry {
  permissions: string[];
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000;

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private prisma: PrismaService) {}

  async hasPermission(
    userId: string,
    workspaceId: string,
    permission: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, workspaceId);

    // Check exact match
    if (permissions.includes(permission)) return true;

    // Check wildcard: 'kernel.*' matches 'kernel.users.view'
    for (const perm of permissions) {
      if (perm.endsWith('.*')) {
        const prefix = perm.slice(0, -1); // 'kernel.'
        if (permission.startsWith(prefix)) return true;
      }
    }

    return false;
  }

  async getUserPermissions(
    userId: string,
    workspaceId: string,
  ): Promise<string[]> {
    const cacheKey = `${userId}:${workspaceId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { role: { include: { permissions: true } } },
    });

    const permissions = membership
      ? membership.role.permissions.map((p) => p.permission)
      : [];

    this.cache.set(cacheKey, {
      permissions,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return permissions;
  }

  invalidateCache(userId: string, workspaceId: string): void {
    this.cache.delete(`${userId}:${workspaceId}`);
  }
}
