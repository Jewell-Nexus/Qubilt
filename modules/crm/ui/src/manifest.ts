import { lazy } from 'react';
import CrmModule from './CrmModule';

const manifest = {
  id: '@qubilt/crm',
  accentColor: '#EC4899',
  component: CrmModule,
  navigation: [
    {
      id: 'crm',
      label: 'CRM',
      icon: 'Handshake',
      route: '/crm',
      scope: 'global' as const,
      accentColor: '#EC4899',
    },
  ],
  routes: [
    {
      path: 'crm/*',
      component: lazy(() => import('./pages/CrmLayout')),
      layout: 'global' as const,
    },
  ],
  widgets: {
    'pipeline-summary': lazy(() => import('./widgets/PipelineSummaryWidget')),
    'recent-activities': lazy(() => import('./widgets/RecentActivitiesWidget')),
  },
  extensions: [],
};

export default manifest;
