import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DBSchemas } from '@app/schema';

@Module({
  imports: [DBSchemas.notification],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
