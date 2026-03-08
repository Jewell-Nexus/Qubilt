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
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@RequirePermissions('kernel.workspace.manage')
@Controller('workspaces/:wid/webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  async list(@Param('wid') workspaceId: string) {
    const data = await this.webhookService.list(workspaceId);
    return { success: true, data };
  }

  @Post()
  async create(
    @Param('wid') workspaceId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    const data = await this.webhookService.create(workspaceId, dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    const data = await this.webhookService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.webhookService.delete(id);
    return { success: true };
  }

  @Get(':id/deliveries')
  async listDeliveries(
    @Param('id') id: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const data = await this.webhookService.listDeliveries(id, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    return { success: true, data };
  }
}
