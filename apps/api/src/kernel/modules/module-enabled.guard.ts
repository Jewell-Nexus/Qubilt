import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MODULE_KEY } from './decorators/require-module.decorator';
import { ModuleRegistryService } from './module-registry.service';

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private registry: ModuleRegistryService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const moduleId = this.reflector.getAllAndOverride<string>(MODULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!moduleId) return true;

    const request = context.switchToHttp().getRequest();
    const workspaceId =
      request.params?.wid || request.params?.workspaceId || request.user?.workspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace context required');
    }

    const enabled = await this.registry.isEnabledForWorkspace(
      moduleId,
      workspaceId,
    );
    if (!enabled) {
      throw new ForbiddenException(
        `Module ${moduleId} is not enabled for this workspace`,
      );
    }

    return true;
  }
}
