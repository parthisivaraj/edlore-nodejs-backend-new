import { Module } from '@nestjs/common';
import { StepController } from './step.controller';
import { StepService } from './step.service';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.procedure,
    DBSchemas.step,
    DBSchemas.troubleshootStep,
    DBSchemas.troubleshoot,
    MediaModule,
  ],
  controllers: [StepController],
  providers: [StepService],
})
export class StepModule {}
