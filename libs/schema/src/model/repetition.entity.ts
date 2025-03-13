import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Job } from './job.entity';

@Entity('repetitions')
export class Repetition extends BaseEntity {
  @Column()
  frequency: string;

  @Column()
  interval: number;

  @OneToMany(() => Job, (job) => job.repetition)
  jobs: Job[];
  work_order: any; //TODO REMOVE ANY
}
