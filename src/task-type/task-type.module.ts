import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskTypeController } from './task-type.controller';
import { TaskTypeService } from './task-type.service';
import { TaskType } from '@app/schema/model/task-type.entity';
import { WorkOrder } from '@app/schema/model/work-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskType, WorkOrder])],
  controllers: [TaskTypeController],
  providers: [TaskTypeService],
  exports: [TaskTypeService],
})
export class TaskTypeModule {}
