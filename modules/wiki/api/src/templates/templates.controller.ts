import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('wiki')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  @Get('templates')
  @RequirePermissions('wiki.pages.view')
  async findAll(@Query('workspaceId') workspaceId: string) {
    const data = await this.templatesService.findAll(workspaceId);
    return { success: true, data };
  }

  @Post('templates')
  @RequirePermissions('wiki.pages.manage')
  async create(@Body() dto: CreateTemplateDto) {
    const data = await this.templatesService.create(dto);
    return { success: true, data };
  }

  @Delete('templates/:id')
  @RequirePermissions('wiki.pages.manage')
  async delete(@Param('id') id: string) {
    await this.templatesService.delete(id);
    return { success: true };
  }

  @Post('pages/:id/apply-template')
  @RequirePermissions('wiki.pages.edit')
  async applyTemplate(
    @Param('id') pageId: string,
    @Body() body: { templateId: string },
    @CurrentUser() user: any,
  ) {
    await this.templatesService.applyTemplate(body.templateId, pageId, user.id);
    return { success: true };
  }
}
