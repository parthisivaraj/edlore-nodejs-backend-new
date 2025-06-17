import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkOrderService } from './work-order.service';

import { WorkOrder } from '@app/schema/model/work-order.entity';
import { Procedure } from '@app/schema/model/procedure.entity';
import { Troubleshoot } from '@app/schema/model/troubleshoot.entity';
import { ErrorCode } from '@app/schema/model/error-code.entity';
import { WorkOrderController } from './work-order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkOrder,
      Procedure,
      Troubleshoot,
      ErrorCode,
    ]),
  ],
  controllers: [WorkOrderController],
  providers: [WorkOrderService],
})
export class WorkOrderModule {}