import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Header,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { FilterContactsDto } from './dto/filter-contacts.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('crm')
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get('contacts')
  @RequirePermissions('crm.contacts.view')
  async findAll(@Query() filters: FilterContactsDto) {
    const data = await this.contactsService.findAll(filters);
    return { success: true, data: data.data, meta: { total: data.total, page: data.page, limit: data.limit } };
  }

  @Post('contacts')
  @RequirePermissions('crm.contacts.create')
  async create(@Body() dto: CreateContactDto) {
    const data = await this.contactsService.create(dto);
    return { success: true, data };
  }

  @Get('contacts/export')
  @RequirePermissions('crm.contacts.view')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="contacts.csv"')
  async exportCsv(@Query('workspaceId') workspaceId: string) {
    const buffer = await this.contactsService.exportCsv(workspaceId);
    return new StreamableFile(buffer);
  }

  @Get('contacts/:id')
  @RequirePermissions('crm.contacts.view')
  async findOne(@Param('id') id: string) {
    const data = await this.contactsService.findOne(id);
    return { success: true, data };
  }

  @Patch('contacts/:id')
  @RequirePermissions('crm.contacts.edit')
  async update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    const data = await this.contactsService.update(id, dto);
    return { success: true, data };
  }

  @Delete('contacts/:id')
  @RequirePermissions('crm.contacts.delete')
  async delete(@Param('id') id: string) {
    await this.contactsService.delete(id);
    return { success: true };
  }

  @Post('contacts/:id/merge')
  @RequirePermissions('crm.contacts.manage')
  async merge(
    @Param('id') primaryId: string,
    @Body('duplicateId') duplicateId: string,
  ) {
    const data = await this.contactsService.merge(primaryId, duplicateId);
    return { success: true, data };
  }

  @Post('contacts/import')
  @RequirePermissions('crm.contacts.manage')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: any,
    @Body('workspaceId') workspaceId: string,
    @Body('fieldMapping') fieldMappingJson: string,
    @CurrentUser() user: any,
  ) {
    const fieldMapping = JSON.parse(fieldMappingJson);
    const data = await this.contactsService.importCsv(
      workspaceId,
      file.buffer,
      fieldMapping,
      user.id,
    );
    return { success: true, data };
  }
}
