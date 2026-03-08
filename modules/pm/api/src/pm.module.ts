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

@Module({
  controllers: [
    TypesController,
    StatusesController,
    PrioritiesController,
    WorkPackagesController,
    RelationsController,
    JournalsController,
  ],
  providers: [
    PmPrismaService,
    TypesService,
    StatusesService,
    PrioritiesService,
    WorkPackagesService,
    RelationsService,
    JournalsService,
  ],
  exports: [
    PmPrismaService,
    TypesService,
    StatusesService,
    PrioritiesService,
    WorkPackagesService,
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
