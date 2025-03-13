import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Status extends BaseEntity {
  @Column()
  title: string;

  @Column({ default: false })
  is_deleted: boolean;
}
