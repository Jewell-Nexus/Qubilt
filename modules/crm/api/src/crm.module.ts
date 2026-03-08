import { Module } from '@nestjs/common';
import type { QubiltModule } from '@qubilt/module-sdk';
import { CrmPrismaService } from './prisma/crm-prisma.service';
import { ContactsService } from './contacts/contacts.service';
import { ContactsController } from './contacts/contacts.controller';
import { PipelinesService } from './pipelines/pipelines.service';
import { PipelinesController } from './pipelines/pipelines.controller';
import { DealsService } from './deals/deals.service';
import { DealsController } from './deals/deals.controller';
import { ReportsService } from './deals/reports.service';
import { ActivitiesService } from './activities/activities.service';
import { ActivitiesController } from './activities/activities.controller';
import { NotesService } from './notes/notes.service';
import { NotesController } from './notes/notes.controller';
import { CrmIntegrationsService } from './integrations/crm-integrations.service';

@Module({
  controllers: [
    ContactsController,
    PipelinesController,
    DealsController,
    ActivitiesController,
    NotesController,
  ],
  providers: [
    CrmPrismaService,
    ContactsService,
    PipelinesService,
    DealsService,
    ReportsService,
    ActivitiesService,
    NotesService,
    CrmIntegrationsService,
  ],
  exports: [
    CrmPrismaService,
    ContactsService,
    PipelinesService,
    DealsService,
    ReportsService,
    ActivitiesService,
    NotesService,
  ],
})
export class CrmModule {}

export const CrmRegistration: QubiltModule = {
  id: '@qubilt/crm',
  name: 'CRM',
  version: '1.0.0',
  description:
    'Customer relationship management with contacts, pipelines, deals, activities, and revenue reporting',
  icon: 'Handshake',
  accentColor: '#EC4899',
  category: 'crm-sales',
  permissions: [
    {
      key: 'crm.contacts.view',
      name: 'View contacts',
      category: 'CRM',
      description: 'View CRM contacts and their details',
    },
    {
      key: 'crm.contacts.create',
      name: 'Create contacts',
      category: 'CRM',
      description: 'Create new contacts',
    },
    {
      key: 'crm.contacts.edit',
      name: 'Edit contacts',
      category: 'CRM',
      description: 'Edit existing contacts',
    },
    {
      key: 'crm.contacts.delete',
      name: 'Delete contacts',
      category: 'CRM',
      description: 'Delete contacts',
    },
    {
      key: 'crm.contacts.manage',
      name: 'Manage contacts',
      category: 'CRM',
      description: 'Merge contacts, import/export CSV',
    },
    {
      key: 'crm.deals.view',
      name: 'View deals',
      category: 'CRM',
      description: 'View deals, pipelines, and board',
    },
    {
      key: 'crm.deals.create',
      name: 'Create deals',
      category: 'CRM',
      description: 'Create new deals and pipelines',
    },
    {
      key: 'crm.deals.edit',
      name: 'Edit deals',
      category: 'CRM',
      description: 'Edit deals and move stages',
    },
    {
      key: 'crm.deals.delete',
      name: 'Delete deals',
      category: 'CRM',
      description: 'Delete deals and pipelines',
    },
    {
      key: 'crm.reports.view',
      name: 'View reports',
      category: 'CRM',
      description: 'View forecast, funnel, revenue trend, and leaderboard reports',
    },
  ],
  navigation: [
    {
      id: 'crm',
      label: 'CRM',
      icon: 'Handshake',
      route: '/crm',
      scope: 'global',
      accentColor: '#EC4899',
    },
  ],
  eventHandlers: [],
};
