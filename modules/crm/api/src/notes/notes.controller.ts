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
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/create-note.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('crm')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get('notes')
  @RequirePermissions('crm.contacts.view')
  async findAll(
    @Query('contactId') contactId?: string,
    @Query('dealId') dealId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.notesService.findAll(
      { contactId, dealId },
      { page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20 },
    );
    return { success: true, data: data.data, meta: { total: data.total, page: data.page, limit: data.limit } };
  }

  @Post('notes')
  @RequirePermissions('crm.contacts.edit')
  async create(@Body() dto: CreateNoteDto, @CurrentUser() user: any) {
    const data = await this.notesService.create(dto, user.id);
    return { success: true, data };
  }

  @Get('notes/:id')
  @RequirePermissions('crm.contacts.view')
  async findOne(@Param('id') id: string) {
    const data = await this.notesService.findOne(id);
    return { success: true, data };
  }

  @Patch('notes/:id')
  @RequirePermissions('crm.contacts.edit')
  async update(@Param('id') id: string, @Body() dto: UpdateNoteDto) {
    const data = await this.notesService.update(id, dto);
    return { success: true, data };
  }

  @Delete('notes/:id')
  @RequirePermissions('crm.contacts.delete')
  async delete(@Param('id') id: string) {
    await this.notesService.delete(id);
    return { success: true };
  }
}
