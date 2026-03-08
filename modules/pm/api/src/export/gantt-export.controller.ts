import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  StreamableFile,
} from '@nestjs/common';
import { GanttExportService } from './gantt-export.service';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class GanttExportController {
  constructor(private ganttExportService: GanttExportService) {}

  @Get('projects/:pid/gantt/export.pdf')
  @RequirePermissions('pm.work_packages.view')
  async exportPdf(
    @Param('pid') projectId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('groupBy') groupBy?: 'type' | 'status' | 'assignee' | 'version',
    @Query('showBaseline') showBaseline?: string,
    @Res({ passthrough: true }) res?: any,
  ): Promise<StreamableFile> {
    const buffer = await this.ganttExportService.exportGanttPdf(projectId, {
      dateFrom,
      dateTo,
      groupBy,
      showBaseline,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="gantt-${projectId}.pdf"`,
    });

    return new StreamableFile(buffer);
  }
}
