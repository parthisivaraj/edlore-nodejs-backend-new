import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Troubleshoot } from './troubleshoot.entity';

@Entity('work_order_todos')
export class WorkOrderTodo extends BaseEntity {
  @Column()
  taskable_type: string;

  @Column()
  taskable_id: string;

  @ManyToOne(
    () => Troubleshoot,
    (troubleshoot) => troubleshoot.workOrderTodos,
    { eager: true },
  )
  taskable: Troubleshoot;
  work_order: any; //REMOVE ANY
}
