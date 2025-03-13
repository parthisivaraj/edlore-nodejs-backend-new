import { Module } from '@nestjs/common';
import { AssetNotesController } from './asset-notes.controller';
import { AssetNotesService } from './asset-notes.service';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';

@Module({
  imports: [DBSchemas.assetNote, MediaModule],
  controllers: [AssetNotesController],
  providers: [AssetNotesService],
})
export class AssetNotesModule {}
