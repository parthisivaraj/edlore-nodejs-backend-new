import { Module } from '@nestjs/common';
import { DBSchemas } from '@app/schema';
import { NotesController } from './notes.controller';
import { NoteService } from './notes.service';
import { MediaModule } from 'src/media';

@Module({
  imports: [DBSchemas.note, DBSchemas.media, MediaModule],
  controllers: [NotesController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule {}
