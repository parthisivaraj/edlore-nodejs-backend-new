import { Entity, Column } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';

@Entity('database')
export class Database extends BaseEntityWithoutDelete {
  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  documents: any;
}
