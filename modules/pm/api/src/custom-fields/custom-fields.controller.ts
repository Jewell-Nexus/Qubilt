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
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';
import { ReorderDto } from '../types/dto/reorder.dto';

@UseGuards(JwtAuthGuard)
@Controller('pm/custom-fields')
export class CustomFieldsController {
  constructor(private customFieldsService: CustomFieldsService) {}

  @Get()
  @RequirePermissions('pm.types.manage')
  async findAll(@Query('workspaceId') workspaceId: string) {
    const data = await this.customFieldsService.findAll(workspaceId);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('pm.types.manage')
  async create(@Body() dto: CreateCustomFieldDto) {
    const data = await this.customFieldsService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @RequirePermissions('pm.types.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
    const data = await this.customFieldsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('pm.types.manage')
  async delete(@Param('id') id: string) {
    await this.customFieldsService.delete(id);
    return { success: true };
  }

  @Post('reorder')
  @RequirePermissions('pm.types.manage')
  async reorder(@Body() dto: ReorderDto) {
    await this.customFieldsService.reorder(dto.workspaceId, dto.orderedIds);
    return { success: true };
  }
}
