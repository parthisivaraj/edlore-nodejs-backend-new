import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Device } from './devices.entity';
import { TaskType } from './task-type.entity';
import { Repetition } from './repetition.entity';
import { WorkOrderTodo } from './work-order-todo.entity';
import { Job } from './job.entity';
import { Notification } from './notification.entity';

export enum WorkOrderStatus {
  active = 1,
  inactive,
  draft,
  created,
  cancel,
  completed,
}

export enum WorkOrderPriority {
  low = 1,
  normal,
  high,
  urgent,
}
@Entity('work_orders')
export class WorkOrder extends BaseEntity {
  @Column({ length: 150, unique: true })
  work_order_number: string;

  @Column({ length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.created,
  })
  status: WorkOrderStatus;

  @Column({
    type: 'enum',
    enum: WorkOrderPriority,
    default: WorkOrderPriority.low,
  })
  priority: WorkOrderPriority;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_user_id' })
  created_user: User;

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  // @ManyToOne(() => Device, (device) => device.workOrders, { eager: true })
  // @JoinColumn({ name: 'device_id' })
  // device_id: Device;

  @ManyToOne(() => TaskType, { nullable: true })
  @JoinColumn({ name: 'task_type_id' })
  task_type: TaskType;

  @OneToMany(() => Repetition, (repetition) => repetition.work_order, {
    cascade: true,
  })
  repetition: Repetition;

  @OneToMany(() => WorkOrderTodo, (todo) => todo.work_order, { cascade: true })
  work_order_todos: WorkOrderTodo[];

  @OneToMany(
    () => Notification,
    (notification) => notification.notifiable_type,
    {
      cascade: true,
    },
  )
  notifications: Notification[];

  @OneToMany(() => Job, (job) => job.work_order, { cascade: true })
  jobs: Job[];

  // @ManyToOne(() => User, (user) => user.workOrders)
  // assigned_to: User;

  @ManyToOne(() => User, (user) => user.workOrders, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assigned_to: User;

  // @OneToMany(() => Repetition, (repetition) => repetition.work_order, {
  //   cascade: true,
  // })
  // repetition: Repetition[];

  @Column({ nullable: true })
  note: string;

  @Column({ nullable: true })
  assigned_to_type: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
  repeat: boolean;
  work_order_status: any; //TODO REMOVE ANY
  completed_task: null;
}
