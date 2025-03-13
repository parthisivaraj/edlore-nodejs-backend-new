import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DBSchemas } from '@app/schema';

@Module({
  imports: [
    DBSchemas.organization,
    DBSchemas.user,
    DBSchemas.group,
    DBSchemas.device,
    DBSchemas.activeStorageBlob,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
