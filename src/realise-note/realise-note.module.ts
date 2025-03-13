import { DBSchemas } from '@app/schema';
import { Module } from '@nestjs/common';
import { RealiseNoteController } from './realise-note.controller';
import { RealiseNoteService } from './realise-note.service';

@Module({
  imports: [DBSchemas.realiseNote],
  controllers: [RealiseNoteController],
  providers: [RealiseNoteService],
})
export class RealiseNoteModule {}
