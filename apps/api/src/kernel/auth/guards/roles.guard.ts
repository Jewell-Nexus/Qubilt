import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../database/prisma.service';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.userId) return false;

    // Get user's workspace memberships with role permissions
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId: user.userId },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    const userPermissions = new Set<string>();
    for (const membership of memberships) {
      for (const perm of membership.role.permissions) {
        userPermissions.add(perm.permission);
      }
    }

    // Super-admin: kernel.* wildcard check
    if (userPermissions.has('kernel.*')) return true;

    // Check all required permissions
    return requiredPermissions.every((perm) => userPermissions.has(perm));
  }
}
