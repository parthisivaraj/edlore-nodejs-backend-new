import { Entity, Column } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';

@Entity('part_fields')
export class PartFields extends BaseEntityWithoutDelete {
  @Column('varchar', { length: 255 })
  name: string;
}
