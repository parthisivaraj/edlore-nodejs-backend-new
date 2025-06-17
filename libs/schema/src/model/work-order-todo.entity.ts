import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Troubleshoot } from './troubleshoot.entity';
import { WorkOrder } from './work-order.entity';

@Entity('work_order_todos')
export class WorkOrderTodo extends BaseEntity {

  @Column()
  work_order_id: string;

  @ManyToOne(() => WorkOrder, { nullable: true })
  @JoinColumn({ name: 'work_order_id' })
  work_order: WorkOrder;

  @Column()
  taskable_type: string;

  @Column({ name: 'taskable_id' })
  taskable_id: string;

  // @ManyToOne(
  //   () => Troubleshoot,
  //   (troubleshoot) => troubleshoot.workOrderTodos,
  //   // { eager: true },
  // )
  // taskable: Troubleshoot;
  // work_order: any; //REMOVE ANY
}
