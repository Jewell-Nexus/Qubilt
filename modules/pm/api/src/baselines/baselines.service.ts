import { Injectable, NotFoundException } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';

export interface BaselineSnapshot {
  id: string;
  subject: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  percentDone: number;
  statusId: string;
  statusName: string;
}

export interface WpDiff {
  id: string;
  subject: string;
  startDateDiff: { old: string | null; new: string | null } | null;
  dueDateDiff: { old: string | null; new: string | null } | null;
  progressDiff: { old: number; new: number } | null;
  estimatedHoursDiff: { old: number | null; new: number | null } | null;
  statusChanged: { old: string; new: string } | null;
}

@Injectable()
export class BaselinesService {
  constructor(private prisma: PmPrismaService) {}

  async create(projectId: string, name: string, createdBy: string) {
    const wps = await this.prisma.pmWorkPackage.findMany({
      where: { projectId, deletedAt: null },
      include: {
        status: { select: { name: true } },
      },
    });

    const snapshot: BaselineSnapshot[] = wps.map((wp) => ({
      id: wp.id,
      subject: wp.subject,
      startDate: wp.startDate?.toISOString() ?? null,
      dueDate: wp.dueDate?.toISOString() ?? null,
      estimatedHours: wp.estimatedHours ? Number(wp.estimatedHours) : null,
      percentDone: wp.percentDone,
      statusId: wp.statusId,
      statusName: wp.status.name,
    }));

    return this.prisma.pmBaseline.create({
      data: {
        projectId,
        name,
        snapshotAt: new Date(),
        data: snapshot as any,
        createdBy,
      },
    });
  }

  async findAll(projectId: string) {
    return this.prisma.pmBaseline.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        snapshotAt: true,
        createdAt: true,
        createdBy: true,
      },
    });
  }

  async compare(baselineId: string) {
    const baseline = await this.prisma.pmBaseline.findUnique({
      where: { id: baselineId },
    });
    if (!baseline) throw new NotFoundException('Baseline not found');

    const snapshot = baseline.data as unknown as BaselineSnapshot[];
    const snapshotIds = snapshot.map((s) => s.id);

    // Load current state for snapshotted WPs
    const currentWps = await this.prisma.pmWorkPackage.findMany({
      where: { id: { in: snapshotIds } },
      include: {
        status: { select: { name: true } },
      },
    });

    const currentMap = new Map(currentWps.map((wp) => [wp.id, wp]));
    const snapshotMap = new Map(snapshot.map((s) => [s.id, s]));

    // Find added WPs (in current project but not in baseline)
    const allCurrentWps = await this.prisma.pmWorkPackage.findMany({
      where: { projectId: baseline.projectId, deletedAt: null },
      select: {
        id: true,
        subject: true,
        statusId: true,
        status: { select: { name: true } },
      },
    });

    const snapshotIdSet = new Set(snapshotIds);
    const added = allCurrentWps
      .filter((wp) => !snapshotIdSet.has(wp.id))
      .map((wp) => ({ id: wp.id, subject: wp.subject, statusName: wp.status.name }));

    // Find removed WPs (in baseline but deleted or not found)
    const currentIdSet = new Set(currentWps.map((wp) => wp.id));
    const removed = snapshot
      .filter((s) => !currentIdSet.has(s.id))
      .map((s) => ({ id: s.id, subject: s.subject, statusName: s.statusName }));

    // Find changed WPs
    const changed: WpDiff[] = [];
    for (const snap of snapshot) {
      const current = currentMap.get(snap.id);
      if (!current) continue;

      const startDateDiff =
        (current.startDate?.toISOString() ?? null) !== snap.startDate
          ? { old: snap.startDate, new: current.startDate?.toISOString() ?? null }
          : null;

      const dueDateDiff =
        (current.dueDate?.toISOString() ?? null) !== snap.dueDate
          ? { old: snap.dueDate, new: current.dueDate?.toISOString() ?? null }
          : null;

      const progressDiff =
        current.percentDone !== snap.percentDone
          ? { old: snap.percentDone, new: current.percentDone }
          : null;

      const currentEstHours = current.estimatedHours ? Number(current.estimatedHours) : null;
      const estimatedHoursDiff =
        currentEstHours !== snap.estimatedHours
          ? { old: snap.estimatedHours, new: currentEstHours }
          : null;

      const statusChanged =
        current.statusId !== snap.statusId
          ? { old: snap.statusName, new: current.status.name }
          : null;

      if (startDateDiff || dueDateDiff || progressDiff || estimatedHoursDiff || statusChanged) {
        changed.push({
          id: snap.id,
          subject: current.subject,
          startDateDiff,
          dueDateDiff,
          progressDiff,
          estimatedHoursDiff,
          statusChanged,
        });
      }
    }

    return {
      baseline: {
        id: baseline.id,
        name: baseline.name,
        snapshotAt: baseline.snapshotAt,
        totalWps: snapshot.length,
      },
      current: {
        totalWps: allCurrentWps.length,
      },
      added,
      removed,
      changed,
    };
  }
}
