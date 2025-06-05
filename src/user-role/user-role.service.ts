import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RolePermissions, User } from '@app/schema';
import {
  CreateUserRoleDto,
  UserRoleResponse,
  UserRoleResponseDto,
  UserRoleSearchParams,
} from './dto/user-role';
import { DateUtilsService } from '@app/common-utils';
import { FilterService } from '@app/schema/service';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermissions)
    private readonly rolePermissionRepository: Repository<RolePermissions>,
    private filterService: FilterService,
  ) {}

  private convertToDTO(role: Role): UserRoleResponseDto {
    return {
      created_at: DateUtilsService.dateToString(role.created_at),
      id: role.id,
      permissions: role.role_permissions.map((x) => ({
        id: x.permission.id,
        created_at: DateUtilsService.dateToString(x.permission.created_at),
        title: x.permission.title,
        description: x.permission.description,
      })),
      status: role.status === 1 ? 'active' : 'inactive',
      title: role.title,
      description: role.description,
    };
  }

  async get(params: UserRoleSearchParams): Promise<UserRoleResponse> {
    let queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.role_permissions', 'role_permissions')
      .leftJoinAndSelect('role_permissions.permission', 'permission');

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER(role.title) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    if (params.active !== null && params.active !== undefined) {
      queryBuilder.andWhere('role.status = :status', {
        status: params.active ? 1 : 2,
      });
    }

    if (params.user_id) {
      const user = await this.userRepository.findOne({
        where: { user_id: params.user_id },
        relations: ['user_roles'],
      });

      if (user) {
        const roleIdToExclude = user.user_roles[0].role_id;
        queryBuilder.andWhere('role.id != :excludedRoleId', {
          excludedRoleId: roleIdToExclude,
        });
      }
    }

    const selected_filters = { role_permissions: [], status: [] };
    if (params.filters) {
      const { role_permissions, status } = params.filters;

      selected_filters.role_permissions = role_permissions || [];
      selected_filters.status = status || [];

      // if (avail_status && avail_status.length > 0) {
      //   queryBuilder = queryBuilder.andWhere(
      //     'user.support_availability_status IN (:...avail_status)',
      //     {
      //       avail_status,
      //     },
      //   );
      // }

      if (status && status.length > 0) {
        queryBuilder = queryBuilder.andWhere('role.status IN (:...status)', {
          status,
        });
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder = queryBuilder.skip(skip).take(take);
    const [userRoles, total] = await queryBuilder.getManyAndCount();

    const filters = await this.filterService.getFilters(
      selected_filters,
      'users',
    );

    return {
      roles: userRoles.map((userRole) => this.convertToDTO(userRole)),
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      filters,
      // message: 'Success',
    };
  }

  async getById(id: string): Promise<UserRoleResponseDto> {
    const userRole = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.role_permissions', 'role_permissions')
      .leftJoinAndSelect('role_permissions.permission', 'permission')
      .where('role.id = :id', { id })
      .getOne();
    if (!userRole) {
      throw new NotFoundException('User role not found');
    }
    return this.convertToDTO(userRole);
  }

  async create(
    createUserRoleDto: CreateUserRoleDto,
  ): Promise<UserRoleResponseDto> {
    const {
      title,
      description,
      role_permissions_attributes: permissions,
    } = createUserRoleDto;
    const newRole = this.roleRepository.create({
      title,
      description,
      role_permissions: permissions.map((permissionId) => ({
        permission: { id: permissionId.permission_id },
      })),
    });
    await this.roleRepository.save(newRole);
    await Promise.all(
      permissions.map(async (permissionId) => {
        const rolePermissionEntity = new RolePermissions();
        rolePermissionEntity.permission_id = permissionId.permission_id;
        rolePermissionEntity.role = newRole;
        await this.rolePermissionRepository.save(rolePermissionEntity);
      }),
    );
    const role = await this.getById(newRole.id);
    return role;
  }

  async update(
    id: string,
    updateUserRoleDto: CreateUserRoleDto,
  ): Promise<UserRoleResponseDto> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['role_permissions', 'role_permissions.permission'],
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    role.title = updateUserRoleDto.title;
    role.description = updateUserRoleDto.description;
    await this.roleRepository.save(role);
    await this.rolePermissionRepository.delete({
      role_id: role.id,
    });
    await Promise.all(
      updateUserRoleDto.role_permissions_attributes.map(
        async (permissionId) => {
          const rolePermission = new RolePermissions();
          rolePermission.role_id = role.id;
          rolePermission.permission_id = permissionId.permission_id;
          await this.rolePermissionRepository.save(rolePermission);
        },
      ),
    );

    const roleResult = await this.getById(role.id);
    return roleResult;
  }
}
