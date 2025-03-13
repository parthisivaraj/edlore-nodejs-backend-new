import { Entity, Column, OneToMany } from 'typeorm';
import { UserRole } from './user-role.entity';
import { RolePermissions } from './role-permissions.entity';
import { BaseEntity } from './base.entity';

@Entity('roles')
export class Role extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 1 })
  status: number;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  user_roles: UserRole[];

  @OneToMany(() => RolePermissions, (userRole) => userRole.role)
  role_permissions: RolePermissions[];
}
