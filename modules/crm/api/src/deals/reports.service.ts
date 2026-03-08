import { Injectable } from '@nestjs/common';
import { CrmPrismaService } from '../prisma/crm-prisma.service';

export interface ForecastBucket {
  period: string;
  expectedRevenue: number;
  weightedRevenue: number;
  dealCount: number;
}

export interface FunnelStage {
  stageId: string;
  stageName: string;
  dealCount: number;
  totalValue: number;
  conversionRate: number;
}

export interface RevenueTrend {
  month: string;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
}

export interface OwnerStats {
  ownerId: string;
  wonDeals: number;
  wonValue: number;
  openDeals: number;
  openValue: number;
  conversionRate: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: CrmPrismaService) {}

  async getForecast(workspaceId: string, period: 'month' | 'quarter' | 'year') {
    const openDeals = await this.prisma.crmDeal.findMany({
      where: {
        workspaceId,
        status: 'OPEN',
        expectedCloseDate: { not: null },
      },
      include: {
        stage: { select: { probability: true, name: true } },
      },
    });

    // Group by period bucket
    const buckets = new Map<string, ForecastBucket>();
    const byStage = new Map<string, { name: string; count: number; value: number; weighted: number }>();
    const byOwner = new Map<string, { count: number; value: number; weighted: number }>();

    for (const deal of openDeals) {
      const date = deal.expectedCloseDate!;
      const bucketKey = this.getBucketKey(date, period);
      const value = Number(deal.value);
      const weighted = value * (deal.stage.probability / 100);

      // Period bucket
      const bucket = buckets.get(bucketKey) ?? { period: bucketKey, expectedRevenue: 0, weightedRevenue: 0, dealCount: 0 };
      bucket.expectedRevenue += value;
      bucket.weightedRevenue += weighted;
      bucket.dealCount++;
      buckets.set(bucketKey, bucket);

      // By stage
      const stageKey = deal.stage.name;
      const stageStat = byStage.get(stageKey) ?? { name: stageKey, count: 0, value: 0, weighted: 0 };
      stageStat.count++;
      stageStat.value += value;
      stageStat.weighted += weighted;
      byStage.set(stageKey, stageStat);

      // By owner
      const ownerStat = byOwner.get(deal.ownerId) ?? { count: 0, value: 0, weighted: 0 };
      ownerStat.count++;
      ownerStat.value += value;
      ownerStat.weighted += weighted;
      byOwner.set(deal.ownerId, ownerStat);
    }

    const totalExpected = openDeals.reduce((s, d) => s + Number(d.value), 0);
    const totalWeighted = openDeals.reduce(
      (s, d) => s + Number(d.value) * (d.stage.probability / 100),
      0,
    );

    return {
      expectedRevenue: totalExpected,
      weightedRevenue: totalWeighted,
      dealCount: openDeals.length,
      byPeriod: Array.from(buckets.values()).sort((a, b) => a.period.localeCompare(b.period)),
      byStage: Array.from(byStage.entries()).map(([name, s]) => ({
        stageName: name,
        dealCount: s.count,
        totalValue: s.value,
        weightedValue: s.weighted,
      })),
      byOwner: Array.from(byOwner.entries()).map(([ownerId, s]) => ({
        ownerId,
        dealCount: s.count,
        totalValue: s.value,
        weightedValue: s.weighted,
      })),
    };
  }

  async getFunnel(pipelineId: string) {
    const stages = await this.prisma.crmPipelineStage.findMany({
      where: { pipelineId },
      orderBy: { position: 'asc' },
      include: {
        deals: { select: { value: true } },
        _count: { select: { deals: true } },
      },
    });

    const funnel: FunnelStage[] = [];
    let previousCount = 0;

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const dealCount = stage._count.deals;
      const totalValue = stage.deals.reduce((s, d) => s + Number(d.value), 0);
      const conversionRate = i === 0 ? 100 : previousCount > 0 ? (dealCount / previousCount) * 100 : 0;

      funnel.push({
        stageId: stage.id,
        stageName: stage.name,
        dealCount,
        totalValue,
        conversionRate: Math.round(conversionRate * 100) / 100,
      });

      previousCount = dealCount;
    }

    return funnel;
  }

  async getRevenueTrend(workspaceId: string, months: number): Promise<RevenueTrend[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const closedDeals = await this.prisma.crmDeal.findMany({
      where: {
        workspaceId,
        closedAt: { gte: since },
        status: { in: ['WON', 'LOST'] },
      },
      select: { status: true, value: true, closedAt: true },
    });

    const monthMap = new Map<string, RevenueTrend>();

    // Initialize all months
    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(key, { month: key, wonDeals: 0, wonValue: 0, lostDeals: 0, lostValue: 0 });
    }

    for (const deal of closedDeals) {
      const d = deal.closedAt!;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthMap.get(key);
      if (!entry) continue;

      if (deal.status === 'WON') {
        entry.wonDeals++;
        entry.wonValue += Number(deal.value);
      } else {
        entry.lostDeals++;
        entry.lostValue += Number(deal.value);
      }
    }

    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  async getLeaderboard(workspaceId: string, period?: 'month' | 'quarter' | 'year'): Promise<OwnerStats[]> {
    const since = this.getPeriodStart(period);

    const where: any = { workspaceId };
    if (since) {
      where.OR = [
        { status: 'OPEN' },
        { closedAt: { gte: since } },
      ];
    }

    const deals = await this.prisma.crmDeal.findMany({
      where,
      select: { ownerId: true, status: true, value: true },
    });

    const ownerMap = new Map<string, OwnerStats>();

    for (const deal of deals) {
      const stats = ownerMap.get(deal.ownerId) ?? {
        ownerId: deal.ownerId,
        wonDeals: 0,
        wonValue: 0,
        openDeals: 0,
        openValue: 0,
        conversionRate: 0,
      };

      const value = Number(deal.value);

      if (deal.status === 'WON') {
        stats.wonDeals++;
        stats.wonValue += value;
      } else if (deal.status === 'OPEN') {
        stats.openDeals++;
        stats.openValue += value;
      }

      ownerMap.set(deal.ownerId, stats);
    }

    // Calculate conversion rates
    const result = Array.from(ownerMap.values()).map((s) => {
      const totalClosed = s.wonDeals + (deals.filter((d) => d.ownerId === s.ownerId && d.status === 'LOST').length);
      s.conversionRate = totalClosed > 0 ? Math.round((s.wonDeals / totalClosed) * 10000) / 100 : 0;
      return s;
    });

    return result.sort((a, b) => b.wonValue - a.wonValue);
  }

  private getBucketKey(date: Date, period: 'month' | 'quarter' | 'year'): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    switch (period) {
      case 'month':
        return `${year}-${String(month).padStart(2, '0')}`;
      case 'quarter':
        return `${year}-Q${Math.ceil(month / 3)}`;
      case 'year':
        return `${year}`;
    }
  }

  private getPeriodStart(period?: 'month' | 'quarter' | 'year'): Date | null {
    if (!period) return null;
    const now = new Date();
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'quarter':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
    }
  }
}
