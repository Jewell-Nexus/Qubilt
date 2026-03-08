import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateBudgetItemDto } from './dto/create-budget-item.dto';
import { UpdateBudgetItemDto } from './dto/update-budget-item.dto';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PmPrismaService) {}

  async create(projectId: string, dto: CreateBudgetDto) {
    return this.prisma.pmBudget.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        versionId: dto.versionId,
      },
      include: { items: true },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.pmBudget.findMany({
      where: { projectId },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addItem(budgetId: string, dto: CreateBudgetItemDto) {
    const budget = await this.prisma.pmBudget.findUnique({ where: { id: budgetId } });
    if (!budget) throw new NotFoundException('Budget not found');

    return this.prisma.pmBudgetItem.create({
      data: {
        budgetId,
        type: dto.type,
        description: dto.description,
        amount: dto.amount,
        workPackageId: dto.workPackageId,
      },
    });
  }

  async updateItem(itemId: string, dto: UpdateBudgetItemDto) {
    const existing = await this.prisma.pmBudgetItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new NotFoundException('Budget item not found');

    return this.prisma.pmBudgetItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async deleteItem(itemId: string) {
    const existing = await this.prisma.pmBudgetItem.findUnique({ where: { id: itemId } });
    if (!existing) throw new NotFoundException('Budget item not found');

    return this.prisma.pmBudgetItem.delete({ where: { id: itemId } });
  }

  async getSummary(projectId: string) {
    // Total budgeted amount
    const budgetedAgg = await this.prisma.pmBudgetItem.aggregate({
      where: { budget: { projectId } },
      _sum: { amount: true },
    });

    // Total spent from time entries (labor cost)
    const spentAgg = await this.prisma.pmTimeEntry.aggregate({
      where: { projectId },
      _sum: { hours: true },
    });

    const budgeted = Number(budgetedAgg._sum.amount ?? 0);
    const spentHours = Number(spentAgg._sum.hours ?? 0);
    // spent = hours (cost estimate; actual rate multiplication is a future enhancement)
    const spent = spentHours;
    const variance = budgeted - spent;
    const completion = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;

    return { budgeted, spent, variance, completion };
  }
}
