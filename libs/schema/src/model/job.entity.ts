import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Repetition } from './repetition.entity';

@Entity('jobs')
export class Job extends BaseEntity {
  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => User, (user) => user.jobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Repetition, (repetition) => repetition.jobs)
  @JoinColumn({ name: 'repetition_id' })
  repetition: Repetition;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date;

  @Column({ default: false })
  completed: boolean;
  work_order: any; //TODO REMOVE ANY
}
