import { lazy } from 'react';
import WikiModule from './WikiModule';
import WikiProjectSubnav from './components/WikiProjectSubnav';

const manifest = {
  id: '@qubilt/wiki',
  accentColor: '#F59E0B',
  component: WikiModule,
  navigation: [
    {
      id: 'wiki',
      label: 'Wiki',
      icon: 'BookOpen',
      route: '/wiki',
      scope: 'global' as const,
      accentColor: '#F59E0B',
    },
  ],
  routes: [
    {
      path: 'wiki',
      component: lazy(() => import('./pages/WikiLayout')),
      layout: 'global' as const,
    },
    {
      path: 'wiki/:pageId',
      component: lazy(() => import('./pages/WikiPage')),
      layout: 'global' as const,
    },
    {
      path: 'wiki/:pageId/history',
      component: lazy(() => import('./pages/VersionHistory')),
      layout: 'global' as const,
    },
  ],
  widgets: {},
  extensions: [
    {
      slot: 'project.sidebar.nav',
      component: WikiProjectSubnav,
      priority: 10,
    },
  ],
};

export default manifest;
