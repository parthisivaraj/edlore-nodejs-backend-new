// sketch.module.ts
import { Module } from '@nestjs/common';
import { SketchService } from './sketch.service';
import { SketchController } from './sketch.controller';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.model,
    DBSchemas.sketch,
    DBSchemas.section,
    DBSchemas.media,
    MediaModule,
  ],
  controllers: [SketchController],
  providers: [SketchService],
})
export class SketchModule {}
