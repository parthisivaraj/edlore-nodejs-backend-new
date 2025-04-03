import { Module } from '@nestjs/common';
import { AnaglyphService } from './anaglyph.service';
import { DBSchemas } from '@app/schema';
import { AnaglyphController } from './anaglyph.controller';
import { MediaModule } from 'src/media';

@Module({
  imports: [
    DBSchemas.anaglyph,
    DBSchemas.model,
    DBSchemas.section,
    DBSchemas.part,
    DBSchemas.note,
    DBSchemas.partNotes,
    DBSchemas.attachedMedia,
    DBSchemas.partFields,
    MediaModule,
  ],
  providers: [AnaglyphService],
  exports: [AnaglyphService],
  controllers: [AnaglyphController],
})
export class AnaglyphModule {}
