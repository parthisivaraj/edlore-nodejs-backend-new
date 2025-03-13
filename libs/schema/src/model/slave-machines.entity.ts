import { Entity, Column } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';

@Entity('slave_machines')
export class SlaveMachine extends BaseEntityWithoutDelete {
  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255 })
  ipaddress: string;

  @Column('boolean', { default: false })
  is_syncing: boolean;

  @Column('varchar', { length: 255, nullable: true })
  sync_status: string;

  @Column('timestamp', { nullable: true })
  sync_start_at: Date;

  @Column('timestamp', { nullable: true })
  sync_end_at: Date;

  @Column('timestamp', { nullable: true })
  last_server_sync_at: Date;

  @Column('timestamp', { nullable: true })
  last_sync_at: Date;

  @Column('boolean', { default: false })
  ping_status: boolean;
}
