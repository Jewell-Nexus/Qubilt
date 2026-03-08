import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../auth/decorators/require-permissions.decorator';
import { IS_PUBLIC_KEY } from '../auth/decorators/public.decorator';
import { RbacService } from './rbac.service';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Skip if @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Skip if no permissions required
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.userId) return false;

    // Use workspaceId from route param (:wid or :id) or from JWT payload
    const workspaceId =
      request.params?.wid || request.params?.workspaceId || user.workspaceId;
    if (!workspaceId) {
      throw new ForbiddenException('Workspace context required');
    }

    for (const permission of requiredPermissions) {
      const allowed = await this.rbacService.hasPermission(
        user.userId,
        workspaceId,
        permission,
      );
      if (!allowed) {
        throw new ForbiddenException(
          `Missing permission: ${permission}`,
        );
      }
    }

    return true;
  }
}
