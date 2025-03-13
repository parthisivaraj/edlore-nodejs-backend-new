import { Permission } from '@app/schema';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedPermissionResponse,
  PermissionSearchParams,
} from './dto/permission';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async getPermissions(
    query: PermissionSearchParams,
  ): Promise<PaginatedPermissionResponse> {
    const { search, limit, page, role_id } = query;

    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.role_permissions', 'role_permissions')
      .take(limit)
      .skip((page - 1) * limit);

    if (search) {
      queryBuilder.andWhere('permission.title LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (role_id) {
      queryBuilder.andWhere('role_permissions.role_id = :role_id', {
        role_id,
      });
    }

    const [permissions, totalEntries] = await queryBuilder.getManyAndCount();

    return {
      permissions: permissions.map((permission) => ({
        id: permission.id,
        title: permission.title,
        description: permission.description,
        created_at: permission.created_at.toISOString().split('T')[0],
      })),
      pagination: {
        total_entries: totalEntries,
        current_page: page,
        per_page: limit,
        offset: (page - 1) * limit,
      },
    };
  }
}
