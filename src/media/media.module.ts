import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { DBSchemas } from '@app/schema';

@Module({
  imports: [
    DBSchemas.activeStorageAttachment,
    DBSchemas.activeStorageBlob,
    DBSchemas.attachedMedia,
    DBSchemas.anaglyph,
  ],
  providers: [MediaService],
  exports: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
