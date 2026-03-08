import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('workspaces/:wid/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('kernel.audit.view')
  async list(
    @Param('wid') workspaceId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('userId') userId?: string,
    @Query('moduleId') moduleId?: string,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const data = await this.auditService.list(
      workspaceId,
      { userId, moduleId, action, resourceType, dateFrom, dateTo },
      { page: parseInt(page, 10), limit: parseInt(limit, 10) },
    );
    return { success: true, data };
  }
}
