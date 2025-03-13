import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Repetition } from './repetition.entity';

@Entity('notifications')
export class Notification extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid')
  user_id: string;

  @Column()
  created_at: Date;

  // @ManyToOne(() => Job, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'job_id' })
  // job?: Job;

  // @ManyToOne(() => Repetition, { nullable: true, onDelete: 'SET NULL' })
  // @JoinColumn({ name: 'repetition_id' })
  // repetition?: Repetition;

  @Column()
  notifiable_type: string;

  @Column()
  read_flag: boolean;
}
