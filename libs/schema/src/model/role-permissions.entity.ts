import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { BaseEntityWithoutDelete } from './base.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermissions extends BaseEntityWithoutDelete {
  @Column('uuid')
  permission_id: string;

  @Column('uuid')
  role_id: string;

  @ManyToOne(() => Permission, (user) => user.role_permissions, { eager: true })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;

  @ManyToOne(() => Role, (role) => role.role_permissions)
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
