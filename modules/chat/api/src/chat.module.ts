import { Module } from '@nestjs/common';
import type { QubiltModule } from '@qubilt/module-sdk';
import { ChatPrismaService } from './prisma/chat-prisma.service';
import { ChannelsService } from './channels/channels.service';
import { ChannelsController } from './channels/channels.controller';
import { MessagesService } from './messages/messages.service';
import { MessagesController } from './messages/messages.controller';
import { ReactionsService } from './reactions/reactions.service';
import { ReactionsController } from './reactions/reactions.controller';
import { PresenceService } from './presence/presence.service';
import { ChatIndexerService } from './search/chat-indexer.service';
import { ChatGateway } from './chat.gateway';

@Module({
  controllers: [ChannelsController, MessagesController, ReactionsController],
  providers: [
    ChatPrismaService,
    ChannelsService,
    MessagesService,
    ReactionsService,
    PresenceService,
    ChatIndexerService,
    ChatGateway,
  ],
  exports: [
    ChatPrismaService,
    ChannelsService,
    MessagesService,
    ReactionsService,
    PresenceService,
    ChatIndexerService,
  ],
})
export class ChatModule {}

export const ChatRegistration: QubiltModule = {
  id: '@qubilt/chat',
  name: 'Chat',
  version: '1.0.0',
  description:
    'Real-time messaging with channels, threading, reactions, presence, and search',
  icon: 'MessageSquare',
  accentColor: '#10B981',
  category: 'collaboration',
  permissions: [
    {
      key: 'chat.channels.view',
      name: 'View chat channels',
      category: 'Chat',
      description: 'View chat channels and messages',
    },
    {
      key: 'chat.channels.create',
      name: 'Create chat channels',
      category: 'Chat',
      description: 'Create new chat channels',
    },
    {
      key: 'chat.channels.manage',
      name: 'Manage chat channels',
      category: 'Chat',
      description: 'Manage channel settings, pin messages, and archive channels',
    },
  ],
  navigation: [
    {
      id: 'chat',
      label: 'Chat',
      icon: 'MessageSquare',
      route: '/chat',
      scope: 'global',
      accentColor: '#10B981',
    },
  ],
  eventHandlers: [],
};
