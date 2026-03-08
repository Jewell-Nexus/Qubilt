import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationService } from './notification.service';
import { NotificationsController } from './notifications.controller';
import { NotificationProcessor } from './notification.processor';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
    RealtimeModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationService, NotificationProcessor],
  exports: [NotificationService],
})
export class NotificationModule {}
