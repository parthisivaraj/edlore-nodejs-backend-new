import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Model } from './model.entity';
import { WorkOrder } from './work-order.entity';
import { ActiveStorageAttachment } from './active-storage-attachments.entity';

export enum DeviceStatus {
  draft = 1,
  active,
}

@Entity('devices')
export class Device extends BaseEntity {
  @Column({ length: 150, unique: true, nullable: false })
  device_id: string;

  @Column({ length: 150, nullable: false })
  name: string;

  @Column({ length: 150, nullable: false })
  serial_number: string;

  @Column({ type: 'varchar', nullable: true })
  manufactured_by: string;

  @Column({ type: 'varchar', nullable: true })
  device_location: string;

  @Column({ type: 'date', nullable: true })
  manufactured_date: Date;

  @Column({ type: 'date', nullable: true })
  warranty_till: Date;

  @Column({ type: 'date', nullable: true })
  last_repair_date: Date;

  // Optional fields
  @Column({ type: 'int', nullable: true })
  width?: number;

  @Column({ type: 'int', nullable: true })
  depth?: number;

  @Column({ type: 'int', nullable: true })
  length?: number;

  @Column({ type: 'enum', enum: DeviceStatus, default: DeviceStatus.draft })
  status: DeviceStatus;

  @ManyToOne(() => Model, { eager: true })
  @JoinColumn({ name: 'model_id' })
  model_id: Model;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.device)
  workOrders: WorkOrder[];

  // @Column({ nullable: true }) //TODO
  // image_url: string;

  // @Column({ nullable: true })      //TODO
  // qr_code_url: string;

  @OneToMany(
    () => ActiveStorageAttachment,
    (attachement) => attachement.device,
    {
      eager: true,
      cascade: true,
    },
  )
  attachedMedia: ActiveStorageAttachment[];
}
