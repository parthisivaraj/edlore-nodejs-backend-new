import { Module } from '@nestjs/common';
import { DBSchemas } from '@app/schema';
import { DeviceController } from './devices.controller';
import { DeviceService } from './devices.service';
import { MediaModule } from 'src/media';

@Module({
  imports: [DBSchemas.device,DBSchemas.activeStorageAttachment, MediaModule],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
