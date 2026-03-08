import { Injectable, Logger } from '@nestjs/common';
import { PmPrismaService } from '../prisma/pm-prisma.service';
import { WorkflowStateInput } from './dto/save-workflow.dto';

export interface WorkflowMatrix {
  [typeId: string]: {
    [roleId: string]: {
      allowedStatuses: string[];
      canCreate: boolean;
    };
  };
}

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);
  private transitionCache = new Map<string, CacheEntry<boolean>>();

  constructor(private prisma: PmPrismaService) {}

  async getWorkflow(workspaceId: string): Promise<WorkflowMatrix> {
    const states = await this.prisma.pmWorkflowState.findMany({
      where: { workspaceId },
    });

    const matrix: WorkflowMatrix = {};
    for (const state of states) {
      if (!matrix[state.typeId]) matrix[state.typeId] = {};
      if (!matrix[state.typeId][state.roleId]) {
        matrix[state.typeId][state.roleId] = {
          allowedStatuses: [],
          canCreate: false,
        };
      }

      matrix[state.typeId][state.roleId].allowedStatuses.push(state.statusId);
      if (state.allowCreate) {
        matrix[state.typeId][state.roleId].canCreate = true;
      }
    }

    return matrix;
  }

  async saveWorkflowStates(
    workspaceId: string,
    states: WorkflowStateInput[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete existing states for workspace
      await tx.pmWorkflowState.deleteMany({ where: { workspaceId } });

      // Bulk insert new states
      if (states.length > 0) {
        await tx.pmWorkflowState.createMany({
          data: states.map((s) => ({
            workspaceId,
            typeId: s.typeId,
            statusId: s.statusId,
            roleId: s.roleId,
            allowCreate: s.allowCreate,
          })),
        });
      }
    });

    // Invalidate cache for this workspace
    this.invalidateCache(workspaceId);
  }

  async canTransition(
    workspaceId: string,
    typeId: string,
    toStatusId: string,
    roleId: string,
  ): Promise<boolean> {
    // Check cache first
    const cacheKey = `${workspaceId}:${typeId}:${toStatusId}:${roleId}`;
    const cached = this.transitionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Kernel admin role always returns true — check for 'admin' builtin role
    // We check if there are ANY workflow states defined for this workspace
    const stateCount = await this.prisma.pmWorkflowState.count({
      where: { workspaceId },
    });

    // If no workflow states defined, allow all transitions (open workflow)
    if (stateCount === 0) {
      this.setCacheEntry(cacheKey, true);
      return true;
    }

    const state = await this.prisma.pmWorkflowState.findUnique({
      where: {
        workspaceId_typeId_statusId_roleId: {
          workspaceId,
          typeId,
          statusId: toStatusId,
          roleId,
        },
      },
    });

    const result = !!state;
    this.setCacheEntry(cacheKey, result);
    return result;
  }

  async canCreate(
    workspaceId: string,
    typeId: string,
    roleId: string,
  ): Promise<boolean> {
    const stateCount = await this.prisma.pmWorkflowState.count({
      where: { workspaceId },
    });

    // If no workflow states defined, allow all creation
    if (stateCount === 0) return true;

    const state = await this.prisma.pmWorkflowState.findFirst({
      where: {
        workspaceId,
        typeId,
        roleId,
        allowCreate: true,
      },
    });

    return !!state;
  }

  private setCacheEntry(key: string, value: boolean) {
    this.transitionCache.set(key, {
      data: value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }

  private invalidateCache(workspaceId: string) {
    for (const key of this.transitionCache.keys()) {
      if (key.startsWith(`${workspaceId}:`)) {
        this.transitionCache.delete(key);
      }
    }
  }
}
