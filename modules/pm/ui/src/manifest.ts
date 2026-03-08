import { lazy } from 'react';
import PmModule from './PmModule';
import PmProjectSubnav from './components/PmProjectSubnav';

const manifest = {
  id: '@qubilt/pm',
  accentColor: '#3B82F6',
  component: PmModule,
  navigation: [
    {
      id: 'pm-projects',
      label: 'Projects',
      icon: 'ClipboardList',
      route: '/projects',
      scope: 'global' as const,
      accentColor: '#3B82F6',
    },
  ],
  routes: [
    {
      path: 'work-packages',
      component: lazy(() => import('./pages/WorkPackageList')),
      layout: 'project' as const,
    },
    {
      path: 'work-packages/:wpId',
      component: lazy(() => import('./pages/WorkPackageDetail')),
      layout: 'project' as const,
    },
    {
      path: 'boards',
      component: lazy(() => import('./pages/BoardsView')),
      layout: 'project' as const,
    },
    {
      path: 'gantt',
      component: lazy(() => import('./pages/GanttView')),
      layout: 'project' as const,
    },
    {
      path: 'backlog',
      component: lazy(() => import('./pages/BacklogView')),
      layout: 'project' as const,
    },
    {
      path: 'calendar',
      component: lazy(() => import('./pages/CalendarView')),
      layout: 'project' as const,
    },
    {
      path: 'time',
      component: lazy(() => import('./pages/TimeTracker')),
      layout: 'project' as const,
    },
    {
      path: 'team-planner',
      component: lazy(() => import('./pages/TeamPlanner')),
      layout: 'project' as const,
    },
  ],
  widgets: {
    'work-package-table': lazy(() => import('./widgets/WPTableWidget')),
    'project-status': lazy(() => import('./widgets/ProjectStatusWidget')),
    'time-spent': lazy(() => import('./widgets/TimeSpentWidget')),
    burndown: lazy(() => import('./widgets/BurndownWidget')),
  },
  // Extensions use eager imports — they're small navigation components
  extensions: [
    {
      slot: 'project.sidebar.nav',
      component: PmProjectSubnav,
      priority: 0,
    },
  ],
};

export default manifest;
