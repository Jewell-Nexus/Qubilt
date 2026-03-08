import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { KernelEvents } from '../events/kernel.events';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBusService,
  ) {}

  async create(dto: CreateWorkspaceDto, ownerId: string) {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          ownerId,
        },
      });

      // Seed default roles
      const adminRole = await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'admin',
          builtin: 'admin',
          position: 0,
          permissions: {
            create: [
              { permission: 'kernel.users.view' },
              { permission: 'kernel.users.manage' },
              { permission: 'kernel.roles.manage' },
              { permission: 'kernel.modules.manage' },
              { permission: 'kernel.workspace.manage' },
              { permission: 'kernel.billing.manage' },
            ],
          },
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'member',
          builtin: 'member',
          position: 1,
          permissions: {
            create: [{ permission: 'kernel.users.view' }],
          },
        },
      });

      await tx.role.create({
        data: {
          workspaceId: workspace.id,
          name: 'viewer',
          builtin: 'viewer',
          position: 2,
          permissions: {
            create: [{ permission: 'kernel.users.view' }],
          },
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: ownerId,
          roleId: adminRole.id,
        },
      });

      return workspace;
    });
  }

  async findById(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async getMembers(workspaceId: string, page: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.workspaceMember.findMany({
        where: { workspaceId },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              status: true,
            },
          },
          role: { select: { id: true, name: true } },
        },
      }),
      this.prisma.workspaceMember.count({ where: { workspaceId } }),
    ]);

    return { data, total, page, limit };
  }

  async addMember(workspaceId: string, userId: string, roleId: string) {
    return this.prisma.workspaceMember.create({
      data: { workspaceId, userId, roleId },
    });
  }

  async removeMember(workspaceId: string, userId: string) {
    await this.prisma.workspaceMember.deleteMany({
      where: { workspaceId, userId },
    });
    return { message: 'Member removed' };
  }

  async updateMemberRole(workspaceId: string, userId: string, roleId: string) {
    return this.prisma.workspaceMember.updateMany({
      where: { workspaceId, userId },
      data: { roleId },
    });
  }

  // ─── INVITATIONS ────────────────────────────────────────────────

  async inviteUser(
    workspaceId: string,
    inviterUserId: string,
    email: string,
    roleId: string,
  ) {
    // Check if already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      const existingMember = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id },
        },
      });
      if (existingMember) {
        throw new ConflictException('User is already a member');
      }
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await this.prisma.invitation.create({
      data: {
        workspaceId,
        email,
        roleId,
        token,
        invitedBy: inviterUserId,
        expiresAt,
      },
      include: { workspace: { select: { name: true } } },
    });

    this.eventBus.emit(KernelEvents.INVITATION_SENT, {
      workspaceId,
      workspaceName: invitation.workspace.name,
      email,
      invitedBy: inviterUserId,
      token,
    });

    return invitation;
  }

  async acceptInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation already accepted');
    }

    // Find or create user by email
    let user = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: invitation.email,
          username: invitation.email.split('@')[0] + crypto.randomBytes(2).toString('hex'),
          displayName: invitation.email.split('@')[0],
          status: 'INVITED',
        },
      });
    }

    await this.prisma.$transaction([
      this.prisma.workspaceMember.create({
        data: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
          roleId: invitation.roleId,
        },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return { message: 'Invitation accepted' };
  }

  async listInvitations(workspaceId: string) {
    return this.prisma.invitation.findMany({
      where: {
        workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
