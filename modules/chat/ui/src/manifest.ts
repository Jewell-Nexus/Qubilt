import { lazy } from 'react';
import ChatModule from './ChatModule';

const manifest = {
  id: '@qubilt/chat',
  accentColor: '#10B981',
  component: ChatModule,
  navigation: [
    {
      id: 'chat',
      label: 'Chat',
      icon: 'MessageCircle',
      route: '/chat',
      scope: 'global' as const,
      accentColor: '#10B981',
    },
  ],
  routes: [
    {
      path: 'chat',
      component: lazy(() => import('./pages/ChatLayout')),
      layout: 'global' as const,
    },
  ],
  widgets: {
    'recent-messages': lazy(() => import('./widgets/RecentMessagesWidget')),
  },
  extensions: [],
};

export default manifest;
