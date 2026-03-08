import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RelationsService } from './relations.service';
import { CreateRelationDto } from './dto/create-relation.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class RelationsController {
  constructor(private relationsService: RelationsService) {}

  @Get('work-packages/:id/relations')
  @RequirePermissions('pm.work_packages.view')
  async findForWorkPackage(@Param('id') workPackageId: string) {
    const data = await this.relationsService.findForWorkPackage(workPackageId);
    return { success: true, data };
  }

  @Post('work-packages/:id/relations')
  @RequirePermissions('pm.work_packages.edit')
  async create(
    @Param('id') fromId: string,
    @Body() dto: CreateRelationDto,
  ) {
    const data = await this.relationsService.create(fromId, dto);
    return { success: true, data };
  }

  @Delete('relations/:id')
  @RequirePermissions('pm.work_packages.edit')
  async delete(@Param('id') id: string) {
    await this.relationsService.delete(id);
    return { success: true };
  }
}
