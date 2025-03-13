import { Module } from '@nestjs/common';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { DBSchemas } from '@app/schema';

@Module({
  imports: [DBSchemas.section, DBSchemas.model],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}
