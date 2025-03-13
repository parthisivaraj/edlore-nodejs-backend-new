import { Module } from '@nestjs/common';
import { CommonUtilsService } from './common-utils.service';
import { DateUtilsService } from './date-utils.service';

@Module({
  providers: [CommonUtilsService, DateUtilsService],
  exports: [CommonUtilsService, DateUtilsService],
})
export class CommonUtilsModule {}
