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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('crm')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get('activities')
  @RequirePermissions('crm.contacts.view')
  async findAll(
    @Query('workspaceId') workspaceId?: string,
    @Query('contactId') contactId?: string,
    @Query('dealId') dealId?: string,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('completed') completed?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.activitiesService.findAll(
      {
        workspaceId,
        contactId,
        dealId,
        userId,
        type,
        completed: completed !== undefined ? completed === 'true' : undefined,
      },
      { page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20 },
    );
    return { success: true, data: data.data, meta: { total: data.total, page: data.page, limit: data.limit } };
  }

  @Post('activities')
  @RequirePermissions('crm.contacts.edit')
  async create(@Body() dto: CreateActivityDto) {
    const data = await this.activitiesService.create(dto);
    return { success: true, data };
  }

  @Get('activities/upcoming')
  @RequirePermissions('crm.contacts.view')
  async getUpcoming(
    @CurrentUser() user: any,
    @Query('days') days: string = '7',
  ) {
    const data = await this.activitiesService.getUpcoming(user.id, parseInt(days, 10));
    return { success: true, data };
  }

  @Patch('activities/:id')
  @RequirePermissions('crm.contacts.edit')
  async update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    const data = await this.activitiesService.update(id, dto);
    return { success: true, data };
  }

  @Post('activities/:id/complete')
  @RequirePermissions('crm.contacts.edit')
  async complete(@Param('id') id: string) {
    const data = await this.activitiesService.complete(id);
    return { success: true, data };
  }

  @Delete('activities/:id')
  @RequirePermissions('crm.contacts.delete')
  async delete(@Param('id') id: string) {
    await this.activitiesService.delete(id);
    return { success: true };
  }
}
