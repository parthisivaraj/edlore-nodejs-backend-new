import { Entity, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';

import { WorkOrder } from './work-order.entity';
import { AssetNote } from './asset-note.entity';
import { Organization } from './organization.entity';
import { UserRole } from './user-role.entity';
import { UserGroup } from './user-group.entity';
import { DeviceToken } from './device-token.entity';
import { OTP } from './otp.entity';
import { Notification } from './notification.entity';
import { Job } from './job.entity';
import { ActiveStorageAttachment } from './active-storage-attachments.entity';

export enum SupportAvailabilityStatus {
  Online = 1,
  Away,
  Offline,
  busy,
}

export enum ActiveStatus {
  Active = 1,
  Inactive,
}

@Entity('users')
export class User extends BaseEntityWithoutDelete {
  @Column()
  user_id: string;

  @Column('uuid')
  org_id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  mobile_number: string;

  @Column({ nullable: true })
  identification_code: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  encrypted_password: string;

  @Column({ nullable: true })
  password_renewed: boolean;

  @Column({ default: ActiveStatus.Active, enum: ActiveStatus })
  status: ActiveStatus;

  @Column({
    default: SupportAvailabilityStatus.Offline,
    enum: SupportAvailabilityStatus,
  })
  support_availability_status: SupportAvailabilityStatus;

  @ManyToOne(() => Organization, (organization) => organization.users, {
    eager: true,
  })
  @JoinColumn({ name: 'org_id' })
  organization: Organization;

  @OneToMany(() => UserRole, (userRole) => userRole.user, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  user_roles: UserRole[];

  @OneToMany(() => UserGroup, (userGroup) => userGroup.user)
  user_groups: UserGroup[];

  @OneToMany(() => DeviceToken, (deviceToken) => deviceToken.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  device_tokens: DeviceToken[];

  @OneToMany(() => OTP, (otp) => otp.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  otps: OTP[];

  @OneToMany(() => Notification, (notification) => notification.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  notifications: Notification[];

  @OneToMany(() => Job, (job) => job.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  jobs: Job[];

  @OneToMany(() => AssetNote, (assetNote) => assetNote.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  asset_notes: AssetNote[];

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.assigned_to)
  workOrders: WorkOrder[];

  @OneToMany(() => ActiveStorageAttachment, (attachement) => attachement.user, {
    eager: true,
  })
  attachedMedia: ActiveStorageAttachment[];

  name: string;

  @Column({ type: 'timestamptz' })
  permissions_upadted_at: Date;

  @Column({ type: 'timestamptz' })
  password_updated_at: Date;
}
