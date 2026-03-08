import { Injectable, BadRequestException } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';

interface ScheduleNode {
  id: string;
  startDate: Date | null;
  dueDate: Date | null;
  estimatedHours: number | null;
  scheduleManually: boolean;
  ignoreNonWorkingDays: boolean;
  predecessors: { fromId: string; delay: number }[];
}

@Injectable()
export class SchedulingService {
  constructor(private prisma: PmPrismaService) {}

  async calculateSchedule(projectId: string): Promise<{ updated: number; conflicts: string[] }> {
    // Load all WPs with PRECEDES/FOLLOWS relations
    const wps = await this.prisma.pmWorkPackage.findMany({
      where: { projectId, deletedAt: null },
      select: {
        id: true,
        startDate: true,
        dueDate: true,
        estimatedHours: true,
        scheduleManually: true,
        ignoreNonWorkingDays: true,
        subject: true,
      },
    });

    // Load all PRECEDES relations for this project's WPs
    const wpIds = wps.map((wp) => wp.id);
    const relations = await this.prisma.pmRelation.findMany({
      where: {
        fromId: { in: wpIds },
        type: 'PRECEDES',
      },
      select: { fromId: true, toId: true, delay: true },
    });

    // Build adjacency list (DAG): from PRECEDES to (meaning `to` follows `from`)
    const nodeMap = new Map<string, ScheduleNode>();
    for (const wp of wps) {
      nodeMap.set(wp.id, {
        id: wp.id,
        startDate: wp.startDate,
        dueDate: wp.dueDate,
        estimatedHours: wp.estimatedHours ? Number(wp.estimatedHours) : null,
        scheduleManually: wp.scheduleManually,
        ignoreNonWorkingDays: wp.ignoreNonWorkingDays,
        predecessors: [],
      });
    }

    // adjacency: from → [to] (PRECEDES means from finishes before to starts)
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const id of wpIds) {
      adjacency.set(id, []);
      inDegree.set(id, 0);
    }

    for (const rel of relations) {
      if (!nodeMap.has(rel.fromId) || !nodeMap.has(rel.toId)) continue;

      adjacency.get(rel.fromId)!.push(rel.toId);
      inDegree.set(rel.toId, (inDegree.get(rel.toId) ?? 0) + 1);

      nodeMap.get(rel.toId)!.predecessors.push({
        fromId: rel.fromId,
        delay: rel.delay ?? 0,
      });
    }

    // Topological sort (Kahn's algorithm)
    const sorted: string[] = [];
    const queue: string[] = [];
    const conflicts: string[] = [];

    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) queue.push(id);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      for (const neighbor of adjacency.get(current) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) queue.push(neighbor);
      }
    }

    if (sorted.length < wpIds.length) {
      conflicts.push('Circular dependency detected among work package relations');
    }

    // Calculate dates in topological order
    let updated = 0;
    const updates: { id: string; startDate: Date; dueDate: Date }[] = [];

    for (const wpId of sorted) {
      const node = nodeMap.get(wpId)!;

      // Skip manually scheduled WPs
      if (node.scheduleManually) continue;

      // Skip WPs with no predecessors (keep their existing dates)
      if (node.predecessors.length === 0) continue;

      // Calculate start date from predecessors
      let latestPredecessorEnd: Date | null = null;

      for (const pred of node.predecessors) {
        const predNode = nodeMap.get(pred.fromId);
        if (!predNode?.dueDate) continue;

        const predEnd = new Date(predNode.dueDate);
        const delayedEnd = this.addWorkDays(predEnd, pred.delay + 1, node.ignoreNonWorkingDays);

        if (!latestPredecessorEnd || delayedEnd > latestPredecessorEnd) {
          latestPredecessorEnd = delayedEnd;
        }
      }

      if (!latestPredecessorEnd) continue;

      const newStartDate = latestPredecessorEnd;

      // Calculate due date from estimated hours (8h per work day)
      const hoursPerDay = 8;
      const durationDays = node.estimatedHours
        ? Math.max(1, Math.ceil(node.estimatedHours / hoursPerDay))
        : 1;

      const newDueDate = this.addWorkDays(newStartDate, durationDays - 1, node.ignoreNonWorkingDays);

      // Check if dates actually changed
      const startChanged = !node.startDate || node.startDate.getTime() !== newStartDate.getTime();
      const dueChanged = !node.dueDate || node.dueDate.getTime() !== newDueDate.getTime();

      if (startChanged || dueChanged) {
        // Update local node for cascading calculations
        node.startDate = newStartDate;
        node.dueDate = newDueDate;
        updates.push({ id: wpId, startDate: newStartDate, dueDate: newDueDate });
      }
    }

    // Bulk update in transaction
    if (updates.length > 0) {
      const operations = updates.map((u) =>
        this.prisma.pmWorkPackage.update({
          where: { id: u.id },
          data: { startDate: u.startDate, dueDate: u.dueDate },
        }),
      );
      await this.prisma.$transaction(operations);
      updated = updates.length;
    }

    return { updated, conflicts };
  }

  private addWorkDays(date: Date, days: number, ignoreNonWorkingDays: boolean): Date {
    const result = new Date(date);

    if (ignoreNonWorkingDays) {
      result.setDate(result.getDate() + days);
      return result;
    }

    let added = 0;
    while (added < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        added++;
      }
    }

    return result;
  }
}
