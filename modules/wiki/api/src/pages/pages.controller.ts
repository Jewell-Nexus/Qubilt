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
import { PagesService } from './pages.service';
import { VersionsService } from './versions.service';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { MovePageDto } from './dto/move-page.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('wiki')
export class PagesController {
  constructor(
    private pagesService: PagesService,
    private versionsService: VersionsService,
  ) {}

  @Get('pages')
  @RequirePermissions('wiki.pages.view')
  async findAll(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    const data = await this.pagesService.findAll(workspaceId, projectId);
    return { success: true, data };
  }

  @Post('pages')
  @RequirePermissions('wiki.pages.create')
  async create(@Body() dto: CreatePageDto, @CurrentUser() user: any) {
    const data = await this.pagesService.create(dto, user.id);
    return { success: true, data };
  }

  @Get('pages/:id')
  @RequirePermissions('wiki.pages.view')
  async findOne(@Param('id') id: string) {
    const data = await this.pagesService.findOne(id);
    return { success: true, data };
  }

  @Get('pages/by-slug/:slug')
  @RequirePermissions('wiki.pages.view')
  async findBySlug(
    @Param('slug') slug: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    const data = await this.pagesService.findBySlug(workspaceId, slug);
    return { success: true, data };
  }

  @Patch('pages/:id')
  @RequirePermissions('wiki.pages.edit')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePageDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.pagesService.update(id, dto, user.id);
    return { success: true, data };
  }

  @Post('pages/:id/move')
  @RequirePermissions('wiki.pages.edit')
  async move(@Param('id') id: string, @Body() dto: MovePageDto) {
    await this.pagesService.move(id, dto.newParentId ?? null, dto.afterId ?? null);
    return { success: true };
  }

  @Delete('pages/:id')
  @RequirePermissions('wiki.pages.delete')
  async delete(@Param('id') id: string) {
    await this.pagesService.delete(id);
    return { success: true };
  }

  @Get('pages/:id/versions')
  @RequirePermissions('wiki.pages.view')
  async findVersions(
    @Param('id') pageId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.versionsService.findVersions(
      pageId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
    return { success: true, ...data };
  }

  @Post('pages/versions/:vid/restore')
  @RequirePermissions('wiki.pages.edit')
  async restore(@Param('vid') vid: string, @CurrentUser() user: any) {
    await this.versionsService.restore(vid, user.id);
    return { success: true };
  }

  @Get('search')
  @RequirePermissions('wiki.pages.view')
  async search(
    @Query('workspaceId') workspaceId: string,
    @Query('q') query: string,
  ) {
    const data = await this.pagesService.search(workspaceId, query);
    return { success: true, data };
  }
}
