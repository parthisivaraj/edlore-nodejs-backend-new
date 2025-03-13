import { Module } from '@nestjs/common';
import { ProcedureController } from './procedure.controller';
import { ProcedureService } from './procedure.service';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.procedure,
    DBSchemas.workOrder,
    DBSchemas.model,
    MediaModule,
  ],
  controllers: [ProcedureController],
  providers: [ProcedureService],
})
export class ProcedureModule {}
