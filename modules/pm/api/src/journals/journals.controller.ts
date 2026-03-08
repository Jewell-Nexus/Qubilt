import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JournalsService } from './journals.service';
import { AddNoteDto } from './dto/add-note.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm/work-packages/:id/activity')
export class JournalsController {
  constructor(private journalsService: JournalsService) {}

  @Get()
  @RequirePermissions('pm.work_packages.view')
  async findForWorkPackage(
    @Param('id') workPackageId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const data = await this.journalsService.findForWorkPackage(
      workPackageId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    return { success: true, ...data };
  }

  @Post()
  @RequirePermissions('pm.work_packages.edit')
  async addNote(
    @Param('id') workPackageId: string,
    @Body() dto: AddNoteDto,
    @CurrentUser() user: { userId: string },
  ) {
    const data = await this.journalsService.addNote(
      workPackageId,
      user.userId,
      dto.notes,
    );
    return { success: true, data };
  }
}
