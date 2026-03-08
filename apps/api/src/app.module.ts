import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './kernel/auth/auth.module';
import { UsersModule } from './kernel/users/users.module';
import { WorkspacesModule } from './kernel/workspaces/workspaces.module';
import { EventBusModule } from './kernel/events/event-bus.module';
import { RbacModule } from './kernel/rbac/rbac.module';
import { ModulesModule } from './kernel/modules/modules.module';
import { RbacGuard } from './kernel/rbac/rbac.guard';
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
    DatabaseModule,
    EventBusModule,
    AuthModule,
    RbacModule,
    UsersModule,
    WorkspacesModule,
    ModulesModule,
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
