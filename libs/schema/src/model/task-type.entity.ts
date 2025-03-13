import {
  Entity,
  Column,
  OneToMany,
  BeforeUpdate,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { BaseEntity } from './base.entity';

@Entity('task_types')
export class TaskType extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150, nullable: false })
  title: string;

  @Column({ type: 'boolean', default: true })
  is_deleted: boolean;

  // @Column({ type: 'int', default: 1 })
  // status: number;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.task_type, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  work_orders: WorkOrder[];

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.task_type, {
    eager: true,
  })
  workOrders: WorkOrder[];

  @BeforeUpdate()
  updateTimestamp() {}
}
