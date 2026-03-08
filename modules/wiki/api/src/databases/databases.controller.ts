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
import { DatabasesService } from './databases.service';
import { CreateDatabaseDto } from './dto/create-database.dto';
import { UpdateDatabaseSchemaDto } from './dto/update-database-schema.dto';
import { UpdateDatabaseViewDto } from './dto/update-database-view.dto';
import { ReorderRowsDto } from './dto/reorder-rows.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('wiki')
export class DatabasesController {
  constructor(private databasesService: DatabasesService) {}

  @Post('pages/:id/databases')
  @RequirePermissions('wiki.pages.edit')
  async create(@Param('id') pageId: string, @Body() dto: CreateDatabaseDto) {
    const data = await this.databasesService.create(pageId, dto);
    return { success: true, data };
  }

  @Get('pages/:id/databases')
  @RequirePermissions('wiki.pages.view')
  async findForPage(@Param('id') pageId: string) {
    const data = await this.databasesService.findForPage(pageId);
    return { success: true, data };
  }

  @Patch('databases/:id/schema')
  @RequirePermissions('wiki.pages.edit')
  async updateSchema(
    @Param('id') id: string,
    @Body() dto: UpdateDatabaseSchemaDto,
  ) {
    const data = await this.databasesService.updateSchema(id, dto.schema);
    return { success: true, data };
  }

  @Patch('databases/:id/view')
  @RequirePermissions('wiki.pages.edit')
  async updateView(
    @Param('id') id: string,
    @Body() dto: UpdateDatabaseViewDto,
  ) {
    const data = await this.databasesService.updateView(id, dto);
    return { success: true, data };
  }

  @Post('databases/:id/rows')
  @RequirePermissions('wiki.pages.edit')
  async createRow(@Param('id') id: string, @Body() body: { data?: any }) {
    const data = await this.databasesService.createRow(id, body.data);
    return { success: true, data };
  }

  @Patch('database-rows/:id')
  @RequirePermissions('wiki.pages.edit')
  async updateRow(@Param('id') id: string, @Body() body: { data: any }) {
    const data = await this.databasesService.updateRow(id, body.data);
    return { success: true, data };
  }

  @Delete('database-rows/:id')
  @RequirePermissions('wiki.pages.delete')
  async deleteRow(@Param('id') id: string) {
    await this.databasesService.deleteRow(id);
    return { success: true };
  }

  @Post('databases/:id/rows/reorder')
  @RequirePermissions('wiki.pages.edit')
  async reorderRows(@Param('id') id: string, @Body() dto: ReorderRowsDto) {
    await this.databasesService.reorderRows(id, dto.orderedIds);
    return { success: true };
  }

  @Get('databases/:id/rows')
  @RequirePermissions('wiki.pages.view')
  async getRows(
    @Param('id') id: string,
    @Query('filters') filters?: string,
    @Query('sort') sort?: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : undefined;
    const parsedSort = sort ? JSON.parse(sort) : undefined;
    const data = await this.databasesService.getRows(id, parsedFilters, parsedSort);
    return { success: true, data };
  }
}
