import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserGroup } from './user-group.entity';

export enum GroupStatus {
  active = 1,
  inactive,
}
@Entity('groups')
export class Group extends BaseEntity {
  @Column({ unique: true })
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: GroupStatus, default: GroupStatus.active })
  status: GroupStatus;

  @OneToMany(() => UserGroup, (userGroup) => userGroup.group)
  user_groups: UserGroup[];
}
