import { Module } from '@nestjs/common';
import { DeviceTokenController } from './device-token.controller';
import { DBSchemas } from '@app/schema';
import { DeviceTokenService } from './device.service';

@Module({
  imports: [DBSchemas.user, DBSchemas.deviceToken],
  controllers: [DeviceTokenController],
  providers: [DeviceTokenService],
})
export class DeviceTokenModule {}
