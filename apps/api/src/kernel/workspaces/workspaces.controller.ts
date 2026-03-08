import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { InviteUserDto } from './dto/invite-user.dto';
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  async create(
    @Body() dto: CreateWorkspaceDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.create(dto, user.userId);
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @RequirePermissions('kernel.workspace.manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.update(id, dto);
    return { success: true, data };
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.getMembers(
      id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    return { success: true, data };
  }

  @Post(':id/members')
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.addMember(
      id,
      dto.userId,
      dto.roleId,
    );
    return { success: true, data };
  }

  @Delete(':id/members/:userId')
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.removeMember(id, userId);
    return { success: true, data };
  }

  @Patch(':id/members/:userId/role')
  async updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.updateMemberRole(
      id,
      userId,
      dto.roleId,
    );
    return { success: true, data };
  }

  // ─── INVITATIONS ────────────────────────────────────────────────

  @Post(':id/invitations')
  async inviteUser(
    @Param('id') workspaceId: string,
    @CurrentUser() user: { userId: string },
    @Body() dto: InviteUserDto,
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.inviteUser(
      workspaceId,
      user.userId,
      dto.email,
      dto.roleId,
    );
    return { success: true, data };
  }

  @Public()
  @Post('invitations/:token/accept')
  async acceptInvitation(
    @Param('token') token: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.acceptInvitation(token);
    return { success: true, data };
  }

  @Get(':id/invitations')
  async listInvitations(
    @Param('id') workspaceId: string,
  ): Promise<ApiResponse<any>> {
    const data = await this.workspacesService.listInvitations(workspaceId);
    return { success: true, data };
  }
}
