import { Module } from '@nestjs/common';
import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './global-search.service';
import { DBSchemas } from '@app/schema';

@Module({
  imports: [DBSchemas.user, DBSchemas.device, DBSchemas.model, DBSchemas.section, DBSchemas.part, DBSchemas.anaglyph],
  controllers: [GlobalSearchController],
  providers: [GlobalSearchService],
})
export class GlobalSearchModule {}
