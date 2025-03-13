import { Module } from '@nestjs/common';
import { TroubleshootController } from './troubleshoot.controller';
import { TroubleshootService } from './troubleshoot.service';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.troubleshoot,
    DBSchemas.troubleshootStep,
    DBSchemas.model,
    MediaModule,
  ],
  controllers: [TroubleshootController],
  providers: [TroubleshootService],
})
export class TroubleshootModule {}
