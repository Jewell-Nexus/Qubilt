import { Module } from '@nestjs/common';
import type { QubiltModule } from '@qubilt/module-sdk';
import { WikiPrismaService } from './prisma/wiki-prisma.service';
import { PagesService } from './pages/pages.service';
import { PagesController } from './pages/pages.controller';
import { VersionsService } from './pages/versions.service';
import { WikiCollabGateway } from './collab/wiki-collab.gateway';
import { DatabasesService } from './databases/databases.service';
import { DatabasesController } from './databases/databases.controller';
import { TemplatesService } from './templates/templates.service';
import { TemplatesController } from './templates/templates.controller';

@Module({
  controllers: [PagesController, DatabasesController, TemplatesController],
  providers: [
    WikiPrismaService,
    PagesService,
    VersionsService,
    WikiCollabGateway,
    DatabasesService,
    TemplatesService,
  ],
  exports: [
    WikiPrismaService,
    PagesService,
    VersionsService,
    DatabasesService,
    TemplatesService,
  ],
})
export class WikiModule {}

export const WikiRegistration: QubiltModule = {
  id: '@qubilt/wiki',
  name: 'Wiki',
  version: '1.0.0',
  description:
    'Collaborative wiki with rich-text editing, version history, inline databases, and templates',
  icon: 'BookOpen',
  accentColor: '#F59E0B',
  category: 'collaboration',
  permissions: [
    {
      key: 'wiki.pages.view',
      name: 'View wiki pages',
      category: 'Wiki',
      description: 'View wiki pages and their content',
    },
    {
      key: 'wiki.pages.create',
      name: 'Create wiki pages',
      category: 'Wiki',
      description: 'Create new wiki pages',
    },
    {
      key: 'wiki.pages.edit',
      name: 'Edit wiki pages',
      category: 'Wiki',
      description: 'Edit existing wiki pages',
    },
    {
      key: 'wiki.pages.delete',
      name: 'Delete wiki pages',
      category: 'Wiki',
      description: 'Delete wiki pages',
    },
    {
      key: 'wiki.pages.manage',
      name: 'Manage wiki',
      category: 'Wiki',
      description: 'Manage wiki templates and settings',
    },
  ],
  navigation: [
    {
      id: 'wiki',
      label: 'Wiki',
      icon: 'BookOpen',
      route: '/wiki',
      scope: 'global',
      accentColor: '#F59E0B',
    },
  ],
  eventHandlers: [],
};
