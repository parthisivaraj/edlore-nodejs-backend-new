import { Module } from '@nestjs/common';

import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';
import { DeskProcedureController } from './desk-procedure.cotroller';
import { DeskProcedureService } from './desk-procedure.service';

@Module({
  imports: [
    DBSchemas.procedure,
    DBSchemas.workOrder,
    DBSchemas.model,
    MediaModule,
  ],
  controllers: [DeskProcedureController],
  providers: [DeskProcedureService],
})
export class DeskProcedureModule {}
