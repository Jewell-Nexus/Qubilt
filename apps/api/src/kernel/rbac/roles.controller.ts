import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { PrismaService } from '../../database/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetPermissionsDto } from './dto/set-permissions.dto';

@Controller('workspaces/:wid/roles')
@UseGuards(JwtAuthGuard)
@RequirePermissions('kernel.roles.manage')
export class RolesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Param('wid') workspaceId: string) {
    return this.prisma.role.findMany({
      where: { workspaceId },
      include: { permissions: { select: { permission: true } } },
      orderBy: { position: 'asc' },
    });
  }

  @Post()
  async create(
    @Param('wid') workspaceId: string,
    @Body() dto: CreateRoleDto,
  ) {
    const maxPos = await this.prisma.role.aggregate({
      where: { workspaceId },
      _max: { position: true },
    });
    return this.prisma.role.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description,
        position: (maxPos._max.position ?? -1) + 1,
      },
    });
  }

  @Get(':id')
  async findOne(@Param('wid') workspaceId: string, @Param('id') id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, workspaceId },
      include: { permissions: { select: { id: true, permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  @Patch(':id')
  async update(
    @Param('wid') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const role = await this.prisma.role.findFirst({
      where: { id, workspaceId },
    });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.role.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
    });
  }

  @Put(':id/permissions')
  async setPermissions(
    @Param('wid') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: SetPermissionsDto,
  ) {
    const role = await this.prisma.role.findFirst({
      where: { id, workspaceId },
    });
    if (!role) throw new NotFoundException('Role not found');

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: dto.permissions.map((permission) => ({ roleId: id, permission })),
      }),
    ]);

    return this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { select: { id: true, permission: true } } },
    });
  }

  @Delete(':id')
  async remove(@Param('wid') workspaceId: string, @Param('id') id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, workspaceId },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.builtin) {
      throw new ForbiddenException('Cannot delete built-in roles');
    }

    await this.prisma.role.delete({ where: { id } });
    return { message: 'Role deleted' };
  }
}
