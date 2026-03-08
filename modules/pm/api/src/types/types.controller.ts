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
import { TypesService } from './types.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { ReorderDto } from './dto/reorder.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm/types')
export class TypesController {
  constructor(private typesService: TypesService) {}

  @Get()
  @RequirePermissions('pm.types.view')
  async findAll(@Query('workspaceId') workspaceId: string) {
    const data = await this.typesService.findAll(workspaceId);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('pm.types.manage')
  async create(@Body() dto: CreateTypeDto) {
    const data = await this.typesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @RequirePermissions('pm.types.manage')
  async update(@Param('id') id: string, @Body() dto: UpdateTypeDto) {
    const data = await this.typesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('pm.types.manage')
  async delete(@Param('id') id: string) {
    await this.typesService.delete(id);
    return { success: true };
  }

  @Post('reorder')
  @RequirePermissions('pm.types.manage')
  async reorder(@Body() dto: ReorderDto) {
    await this.typesService.reorder(dto.workspaceId, dto.orderedIds);
    return { success: true };
  }
}
