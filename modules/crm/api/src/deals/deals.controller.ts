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
import { DealsService } from './deals.service';
import { ReportsService } from './reports.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { FilterDealsDto, MoveStageDto } from './dto/filter-deals.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@kernel/auth/decorators/current-user.decorator';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('crm')
export class DealsController {
  constructor(
    private dealsService: DealsService,
    private reportsService: ReportsService,
  ) {}

  @Get('deals')
  @RequirePermissions('crm.deals.view')
  async findAll(@Query() filters: FilterDealsDto) {
    const data = await this.dealsService.findAll(filters);
    return { success: true, data: data.data, meta: { total: data.total, page: data.page, limit: data.limit } };
  }

  @Post('deals')
  @RequirePermissions('crm.deals.create')
  async create(@Body() dto: CreateDealDto, @CurrentUser() user: any) {
    const data = await this.dealsService.create(dto, user.id);
    return { success: true, data };
  }

  @Get('deals/:id')
  @RequirePermissions('crm.deals.view')
  async findOne(@Param('id') id: string) {
    const data = await this.dealsService.findOne(id);
    return { success: true, data };
  }

  @Patch('deals/:id')
  @RequirePermissions('crm.deals.edit')
  async update(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    const data = await this.dealsService.update(id, dto);
    return { success: true, data };
  }

  @Post('deals/:id/move-stage')
  @RequirePermissions('crm.deals.edit')
  async moveStage(
    @Param('id') id: string,
    @Body() dto: MoveStageDto,
    @CurrentUser() user: any,
  ) {
    const data = await this.dealsService.moveStage(id, dto.targetStageId, user.id);
    return { success: true, data };
  }

  @Delete('deals/:id')
  @RequirePermissions('crm.deals.delete')
  async delete(@Param('id') id: string) {
    await this.dealsService.delete(id);
    return { success: true };
  }

  @Get('pipelines/:id/board')
  @RequirePermissions('crm.deals.view')
  async getPipelineBoard(@Param('id') pipelineId: string) {
    const data = await this.dealsService.findByPipeline(pipelineId);
    return { success: true, data };
  }

  // Reports
  @Get('reports/forecast')
  @RequirePermissions('crm.reports.view')
  async getForecast(
    @Query('workspaceId') workspaceId: string,
    @Query('period') period: 'month' | 'quarter' | 'year' = 'month',
  ) {
    const data = await this.reportsService.getForecast(workspaceId, period);
    return { success: true, data };
  }

  @Get('reports/funnel')
  @RequirePermissions('crm.reports.view')
  async getFunnel(@Query('pipelineId') pipelineId: string) {
    const data = await this.reportsService.getFunnel(pipelineId);
    return { success: true, data };
  }

  @Get('reports/revenue-trend')
  @RequirePermissions('crm.reports.view')
  async getRevenueTrend(
    @Query('workspaceId') workspaceId: string,
    @Query('months') months: string = '12',
  ) {
    const data = await this.reportsService.getRevenueTrend(workspaceId, parseInt(months, 10));
    return { success: true, data };
  }

  @Get('reports/leaderboard')
  @RequirePermissions('crm.reports.view')
  async getLeaderboard(
    @Query('workspaceId') workspaceId: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
  ) {
    const data = await this.reportsService.getLeaderboard(workspaceId, period);
    return { success: true, data };
  }
}
