import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './kernel/auth/auth.module';
import { UsersModule } from './kernel/users/users.module';
import { WorkspacesModule } from './kernel/workspaces/workspaces.module';
import { EventBusModule } from './kernel/events/event-bus.module';
import { RbacModule } from './kernel/rbac/rbac.module';
import { ModulesModule } from './kernel/modules/modules.module';
import { StorageModule } from './kernel/storage/storage.module';
import { EmailModule } from './kernel/email/email.module';
import { NotificationModule } from './kernel/notifications/notification.module';
import { AuditModule } from './kernel/audit/audit.module';
import { SettingsModule } from './kernel/settings/settings.module';
import { JobsModule } from './kernel/jobs/jobs.module';
import { WebhooksModule } from './kernel/webhooks/webhooks.module';
import { RealtimeModule } from './kernel/realtime/realtime.module';
import { RbacGuard } from './kernel/rbac/rbac.guard';
import { PmModule } from '@qubilt/pm-api';
import { WikiModule } from '@qubilt/wiki-api';
import { ChatModule } from '@qubilt/chat-api';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    EventBusModule,
    JobsModule,
    StorageModule,
    EmailModule,
    AuthModule,
    RbacModule,
    UsersModule,
    WorkspacesModule,
    ModulesModule,
    NotificationModule,
    AuditModule,
    SettingsModule,
    WebhooksModule,
    RealtimeModule,
    PmModule,
    WikiModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
})
export class AppModule {}
