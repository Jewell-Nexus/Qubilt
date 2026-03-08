import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

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
}
