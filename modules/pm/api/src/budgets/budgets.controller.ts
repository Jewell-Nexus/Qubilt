import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';
import { JwtAuthGuard } from '@kernel/auth/guards/jwt-auth.guard';
import { RequirePermissions } from '@kernel/auth/decorators/require-permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pm')
export class BudgetsController {
  constructor(private budgetsService: BudgetsService) {}

  @Get('projects/:pid/budgets')
  @RequirePermissions('pm.work_packages.view')
  async findAll(@Param('pid') projectId: string) {
    const data = await this.budgetsService.findAll(projectId);
    return { success: true, data };
  }

  @Post('projects/:pid/budgets')
  @RequirePermissions('pm.versions.manage')
  async create(
    @Param('pid') projectId: string,
    @Body() dto: CreateBudgetDto,
  ) {
    const data = await this.budgetsService.create(projectId, dto);
    return { success: true, data };
  }

  @Post('budgets/:id/items')
  @RequirePermissions('pm.versions.manage')
  async addItem(@Param('id') budgetId: string, @Body() dto: CreateBudgetItemDto) {
    const data = await this.budgetsService.addItem(budgetId, dto);
    return { success: true, data };
  }

  @Patch('budget-items/:id')
  @RequirePermissions('pm.versions.manage')
  async updateItem(@Param('id') itemId: string, @Body() dto: UpdateBudgetItemDto) {
    const data = await this.budgetsService.updateItem(itemId, dto);
    return { success: true, data };
  }

  @Delete('budget-items/:id')
  @RequirePermissions('pm.versions.manage')
  async deleteItem(@Param('id') itemId: string) {
    await this.budgetsService.deleteItem(itemId);
    return { success: true };
  }

  @Get('projects/:pid/budgets/summary')
  @RequirePermissions('pm.work_packages.view')
  async getSummary(@Param('pid') projectId: string) {
    const data = await this.budgetsService.getSummary(projectId);
    return { success: true, data };
  }
}
