import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { BaseEntityWithoutDelete } from './base.entity';

@Entity('user_roles')
export class UserRole extends BaseEntityWithoutDelete {
  @Column('uuid')
  user_id: string;

  @Column('uuid')
  role_id: string;

  @ManyToOne(() => User, (user) => user.user_roles)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Role, (role) => role.user_roles, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
