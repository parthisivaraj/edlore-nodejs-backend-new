import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';
import { User } from './user.entity';
import { Group } from './group.entity';

@Entity('user_groups')
export class UserGroup extends BaseEntityWithoutDelete {
  @ManyToOne(() => User, (user) => user.user_groups, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Group, (group) => group.user_groups, { eager: true })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ name: 'user_id' })
  user_id: string;

  @Column({ name: 'group_id' })
  group_id: string;
}
