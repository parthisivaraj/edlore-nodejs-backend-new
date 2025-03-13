import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntityWithoutDelete } from './base.entity';
import { RolePermissions } from './role-permissions.entity';

@Entity('permissions')
export class Permission extends BaseEntityWithoutDelete {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => RolePermissions, (permission) => permission.permission, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  role_permissions: RolePermissions[];
}
