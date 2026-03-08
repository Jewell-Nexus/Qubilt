import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@kernel/../database/prisma.service';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { WorkflowsService } from './workflows.service';

@Injectable()
export class WorkflowGuard implements CanActivate {
  constructor(
    private workflowsService: WorkflowsService,
    private kernelPrisma: PrismaService,
    private pmPrisma: PmPrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const body = request.body;

    // Only check when status is being changed
    if (!body?.statusId) return true;

    const wpId = request.params.id;
    if (!wpId) return true;

    // Fetch the work package to get its type and project
    const wp = await this.pmPrisma.pmWorkPackage.findFirst({
      where: { id: wpId, deletedAt: null },
      select: { typeId: true, projectId: true, statusId: true },
    });
    if (!wp) return true; // Let the service handle 404

    // No change in status
    if (wp.statusId === body.statusId) return true;

    // Get user's roles in the workspace
    const memberships = await this.kernelPrisma.workspaceMember.findMany({
      where: { userId: user.userId },
      include: { role: true },
    });

    // Admin role always passes
    for (const m of memberships) {
      if (m.role.builtin === 'admin') return true;
    }

    // Check workflow for each role the user has
    for (const m of memberships) {
      // Get workspaceId from the membership
      const allowed = await this.workflowsService.canTransition(
        m.workspaceId,
        wp.typeId,
        body.statusId,
        m.roleId,
      );
      if (allowed) return true;
    }

    throw new ForbiddenException(
      'Workflow does not allow this status transition for your role',
    );
  }
}
