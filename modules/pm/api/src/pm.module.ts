import { Module } from '@nestjs/common';
import type { QubiltModule } from '@qubilt/module-sdk';
import { PmPrismaService } from './prisma/pm-prisma.service';
import { TypesService } from './types/types.service';
import { TypesController } from './types/types.controller';
import { StatusesService } from './statuses/statuses.service';
import { StatusesController } from './statuses/statuses.controller';
import { PrioritiesService } from './priorities/priorities.service';
import { PrioritiesController } from './priorities/priorities.controller';
import { WorkPackagesService } from './work-packages/work-packages.service';
import { WorkPackagesController } from './work-packages/work-packages.controller';
import { RelationsService } from './relations/relations.service';
import { RelationsController } from './relations/relations.controller';
import { JournalsService } from './journals/journals.service';
import { JournalsController } from './journals/journals.controller';
import { CustomFieldsService } from './custom-fields/custom-fields.service';
import { CustomValuesService } from './custom-fields/custom-values.service';
import { CustomFieldsController } from './custom-fields/custom-fields.controller';
import { FormLayoutsService } from './forms/form-layouts.service';
import { FormLayoutsController } from './forms/form-layouts.controller';
import { WorkflowsService } from './workflows/workflows.service';
import { WorkflowGuard } from './workflows/workflow.guard';
import { WorkflowsController } from './workflows/workflows.controller';
import { DateAlertsProcessor } from './jobs/date-alerts.processor';
import { VersionsService } from './versions/versions.service';
import { VersionsController } from './versions/versions.controller';
import { CategoriesService } from './categories/categories.service';
import { CategoriesController } from './categories/categories.controller';
import { SprintsService } from './sprints/sprints.service';
import { SprintsController } from './sprints/sprints.controller';
import { QueriesService } from './queries/queries.service';
import { QueriesController } from './queries/queries.controller';
import { TimeEntriesService } from './time-entries/time-entries.service';
import { TimeEntriesController } from './time-entries/time-entries.controller';
import { BudgetsService } from './budgets/budgets.service';
import { BudgetsController } from './budgets/budgets.controller';
import { BoardsService } from './boards/boards.service';
import { BoardsController } from './boards/boards.controller';
import { BaselinesService } from './baselines/baselines.service';
import { BaselinesController } from './baselines/baselines.controller';
import { SchedulingService } from './scheduling/scheduling.service';
import { SchedulingController } from './scheduling/scheduling.controller';
import { GanttExportService } from './export/gantt-export.service';
import { GanttExportController } from './export/gantt-export.controller';
import { TeamPlannerService } from './planner/planner.service';
import { TeamPlannerController } from './planner/planner.controller';

@Module({
  controllers: [
    TypesController,
    StatusesController,
    PrioritiesController,
    WorkPackagesController,
    RelationsController,
    JournalsController,
    CustomFieldsController,
    FormLayoutsController,
    WorkflowsController,
    VersionsController,
    CategoriesController,
    SprintsController,
    QueriesController,
    TimeEntriesController,
    BudgetsController,
    BoardsController,
    BaselinesController,
    SchedulingController,
    GanttExportController,
    TeamPlannerController,
  ],
  providers: [
    PmPrismaService,
    TypesService,
    StatusesService,
    PrioritiesService,
    WorkPackagesService,
    RelationsService,
    JournalsService,
    CustomFieldsService,
    CustomValuesService,
    FormLayoutsService,
    WorkflowsService,
    WorkflowGuard,
    DateAlertsProcessor,
    VersionsService,
    CategoriesService,
    SprintsService,
    QueriesService,
    TimeEntriesService,
    BudgetsService,
    BoardsService,
    BaselinesService,
    SchedulingService,
    GanttExportService,
    TeamPlannerService,
  ],
  exports: [
    PmPrismaService,
    TypesService,
    StatusesService,
    PrioritiesService,
    WorkPackagesService,
    CustomFieldsService,
    CustomValuesService,
    WorkflowsService,
    VersionsService,
    CategoriesService,
    SprintsService,
    QueriesService,
    TimeEntriesService,
    BudgetsService,
    BoardsService,
    BaselinesService,
    SchedulingService,
    GanttExportService,
    TeamPlannerService,
  ],
})
export class PmModule {}

export const PmRegistration: QubiltModule = {
  id: '@qubilt/pm',
  name: 'Project Management',
  version: '1.0.0',
  description:
    'Full-featured project management with work packages, boards, time tracking, and Gantt charts',
  icon: 'ClipboardList',
  accentColor: '#3B82F6',
  category: 'project-management',
  permissions: [
    {
      key: 'pm.work_packages.view',
      name: 'View work packages',
      category: 'Work Packages',
      description: 'View work packages and their details',
    },
    {
      key: 'pm.work_packages.create',
      name: 'Create work packages',
      category: 'Work Packages',
      description: 'Create new work packages',
    },
    {
      key: 'pm.work_packages.edit',
      name: 'Edit work packages',
      category: 'Work Packages',
      description: 'Edit existing work packages',
    },
    {
      key: 'pm.work_packages.delete',
      name: 'Delete work packages',
      category: 'Work Packages',
      description: 'Delete work packages',
    },
    {
      key: 'pm.types.view',
      name: 'View types & statuses',
      category: 'Configuration',
      description: 'View work package types, statuses, and priorities',
    },
    {
      key: 'pm.types.manage',
      name: 'Manage types & statuses',
      category: 'Configuration',
      description: 'Create, edit, and delete types, statuses, and priorities',
    },
    {
      key: 'pm.time.log',
      name: 'Log time',
      category: 'Time Tracking',
      description: 'Log time entries on work packages',
    },
    {
      key: 'pm.time.view_all',
      name: 'View all time entries',
      category: 'Time Tracking',
      description: 'View time entries from all users',
    },
    {
      key: 'pm.boards.manage',
      name: 'Manage boards',
      category: 'Boards',
      description: 'Create and configure boards',
    },
    {
      key: 'pm.versions.manage',
      name: 'Manage versions',
      category: 'Versions',
      description: 'Create and manage versions and milestones',
    },
    {
      key: 'pm.sprints.manage',
      name: 'Manage sprints',
      category: 'Sprints',
      description: 'Create, start, and close sprints',
    },
    {
      key: 'pm.budgets.manage',
      name: 'Manage budgets',
      category: 'Budgets',
      description: 'Create and manage project budgets',
    },
    {
      key: 'pm.baselines.manage',
      name: 'Manage baselines',
      category: 'Baselines',
      description: 'Create baselines and compare project snapshots',
    },
    {
      key: 'pm.scheduling.manage',
      name: 'Manage scheduling',
      category: 'Scheduling',
      description: 'Run auto-scheduling and manage project schedules',
    },
  ],
  navigation: [
    {
      id: 'pm-projects',
      label: 'Projects',
      icon: 'ClipboardList',
      route: '/projects',
      scope: 'global',
      accentColor: '#3B82F6',
    },
  ],
  eventHandlers: [],
};
