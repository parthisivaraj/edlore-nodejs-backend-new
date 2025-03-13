import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('realise_note')
export class RealiseNoteEntity extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;
}
