import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @CurrentUser() user: { userId: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('read') read?: string,
    @Query('moduleId') moduleId?: string,
  ) {
    const filters: { read?: boolean; moduleId?: string } = {};
    if (read === 'true') filters.read = true;
    if (read === 'false') filters.read = false;
    if (moduleId) filters.moduleId = moduleId;

    const data = await this.notificationService.list(
      user.userId,
      { page: parseInt(page, 10), limit: parseInt(limit, 10) },
      filters,
    );
    return { success: true, data };
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    await this.notificationService.markAsRead(id, user.userId);
    return { success: true };
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: { userId: string }) {
    await this.notificationService.markAllRead(user.userId);
    return { success: true };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: { userId: string }) {
    const count = await this.notificationService.getUnreadCount(user.userId);
    return { success: true, data: { count } };
  }
}
