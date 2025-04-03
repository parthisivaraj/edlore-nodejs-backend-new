import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';

@Entity('part_fields_mappings')
export class PartFieldsMappings extends BaseEntityWithoutDelete {
    @Column({ nullable: false })
    part_id: string;

    @Column({ nullable: false })
    part_field_id: string;

    @Column('varchar')
    value: string;
}
