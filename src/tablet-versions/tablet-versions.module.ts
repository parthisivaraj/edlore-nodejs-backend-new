import { Module } from '@nestjs/common';
import { TabletVersionsController } from './tablet-versions.controller';
import { TabletVersionsService } from './tablet-versions.service';
import { DBSchemas } from '@app/schema';

@Module({
  imports: [DBSchemas.tabletVersions],
  controllers: [TabletVersionsController],
  providers: [TabletVersionsService],
})
export class TabletVersionsModule {}
