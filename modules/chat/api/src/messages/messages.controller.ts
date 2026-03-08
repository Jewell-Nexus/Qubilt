import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('channels/:id/messages')
  @RequirePermissions('chat.channels.view')
  async findMessages(
    @Param('id') channelId: string,
    @Query('before') before?: string,
    @Query('after') after?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.messagesService.findMessages(channelId, {
      before,
      after,
      limit: limit ? parseInt(limit) : 50,
    });
    return { success: true, ...data };
  }

  @Get('messages/:id/thread')
  @RequirePermissions('chat.channels.view')
  async findThread(
    @Param('id') threadId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.messagesService.findThread(threadId, {
      before,
      limit: limit ? parseInt(limit) : 50,
    });
    return { success: true, ...data };
  }

  @Get('channels/:id/pinned')
  @RequirePermissions('chat.channels.view')
  async getPinned(@Param('id') channelId: string) {
    const data = await this.messagesService.getPinned(channelId);
    return { success: true, data };
  }

  @Post('messages/:id/pin')
  @RequirePermissions('chat.channels.manage')
  async pin(@Param('id') id: string, @CurrentUser() user: any) {
    await this.messagesService.pin(id, user.id);
    return { success: true };
  }

  @Post('messages/:id/unpin')
  @RequirePermissions('chat.channels.manage')
  async unpin(@Param('id') id: string) {
    await this.messagesService.unpin(id);
    return { success: true };
  }

  @Post('messages/:id/bookmark')
  async bookmark(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() body: { note?: string },
  ) {
    await this.messagesService.bookmark(id, user.id, body.note);
    return { success: true };
  }

  @Get('bookmarks')
  async getBookmarks(@CurrentUser() user: any) {
    const data = await this.messagesService.getBookmarks(user.id);
    return { success: true, data };
  }

  @Get('search')
  @RequirePermissions('chat.channels.view')
  async search(
    @Query('workspaceId') workspaceId: string,
    @Query('q') query: string,
    @Query('channelId') channelId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const data = await this.messagesService.search(workspaceId, query, user.id, channelId);
    return { success: true, data };
  }
}
