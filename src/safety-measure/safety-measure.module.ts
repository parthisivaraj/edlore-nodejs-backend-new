import { Module } from '@nestjs/common';
import { SafetyMeasureController } from './safety-measure.controller';
import { SafetyMeasureService } from './safety-measure.service';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [DBSchemas.model, DBSchemas.safetyMeasure, MediaModule],
  controllers: [SafetyMeasureController],
  providers: [SafetyMeasureService],
  exports: [SafetyMeasureService],
})
export class SafetyMeasureModule {}
