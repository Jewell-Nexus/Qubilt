import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { FindOrCreateDmDto } from './dto/find-or-create-dm.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChannelsController {
  constructor(private channelsService: ChannelsService) {}

  @Get('channels')
  @RequirePermissions('chat.channels.view')
  async findAll(
    @Query('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.channelsService.findAll(workspaceId, user.id);
    return { success: true, data };
  }

  @Post('channels')
  @RequirePermissions('chat.channels.create')
  async create(@Body() dto: CreateChannelDto, @CurrentUser() user: any) {
    const data = await this.channelsService.create(dto, user.id);
    return { success: true, data };
  }

  @Get('channels/:id')
  @RequirePermissions('chat.channels.view')
  async findOne(@Param('id') id: string) {
    const data = await this.channelsService.findOne(id);
    return { success: true, data };
  }

  @Patch('channels/:id')
  @RequirePermissions('chat.channels.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateChannelDto) {
    const data = await this.channelsService.update(id, dto);
    return { success: true, data };
  }

  @Post('channels/:id/join')
  @RequirePermissions('chat.channels.view')
  async join(@Param('id') id: string, @CurrentUser() user: any) {
    const data = await this.channelsService.join(id, user.id);
    return { success: true, data };
  }

  @Post('channels/:id/leave')
  async leave(@Param('id') id: string, @CurrentUser() user: any) {
    await this.channelsService.leave(id, user.id);
    return { success: true };
  }

  @Post('dm')
  @RequirePermissions('chat.channels.create')
  async findOrCreateDm(@Body() dto: FindOrCreateDmDto, @CurrentUser() user: any) {
    const data = await this.channelsService.findOrCreateDm(
      dto.workspaceId,
      user.id,
      dto.targetUserId,
    );
    return { success: true, data };
  }

  @Get('channels/:id/members')
  @RequirePermissions('chat.channels.view')
  async getMembers(@Param('id') id: string) {
    const data = await this.channelsService.getMembers(id);
    return { success: true, data };
  }
}
