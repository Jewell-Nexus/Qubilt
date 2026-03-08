import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FormLayoutsService } from './form-layouts.service';
import { SaveFormLayoutDto } from './dto/save-form-layout.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm/form-layouts')
export class FormLayoutsController {
  constructor(private formLayoutsService: FormLayoutsService) {}

  @Get(':typeId')
  async getLayout(
    @Param('typeId') typeId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    const data = await this.formLayoutsService.getLayout(workspaceId, typeId);
    return { success: true, data };
  }

  @Put(':typeId')
  @RequirePermissions('pm.types.manage')
  async saveLayout(
    @Param('typeId') typeId: string,
    @Body() dto: SaveFormLayoutDto,
  ) {
    await this.formLayoutsService.saveLayout(dto.workspaceId, typeId, dto.groups);
    return { success: true };
  }
}
