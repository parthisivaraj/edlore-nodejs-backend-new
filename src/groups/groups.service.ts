import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, QueryRunner, Repository } from 'typeorm';
import { Group, GroupStatus, User, UserGroup } from '@app/schema';
import {
  GetUserResponse,
  GetUserSearchParams,
  GroupSearchParams,
  UserDTO,
  UserGroupDetailDTO,
  UserGroupDetailsResponse,
  UserGroupResponse,
  UserGroupResponseDto,
} from './dto/groups';
import { CustomUniqueService, FilterService } from '@app/schema/service';
import { DateUtilsService } from '@app/common-utils';
import { AddEditRequestDTO, UserGroupsAttribute } from './dto/add-edit';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,

    private dataSource: DataSource,

    private filterService: FilterService,
    private customUniqueService: CustomUniqueService,
  ) {}

  private convertToDTO(group: Group): UserGroupResponseDto {
    const response = new UserGroupResponseDto();
    response.id = group.id;
    response.title = group.title || '';
    response.description = group.description || '';
    response.status = GroupStatus[group.status];
    response.user_count = group.user_groups.length;
    response.created_at = DateUtilsService.dateToString(group.created_at);
    return response;
  }

  private convertToDetailsDTO(group: Group): UserGroupDetailDTO {
    const temp = this.convertToDTO(group);
    return {
      ...temp,
      selected_users: group.user_groups.map((item) => ({
        id: item.user_id,
        record_id: item.id,
      })),
    };
  }

  async get(params: GroupSearchParams): Promise<UserGroupResponse> {
    let queryBuilder = this.groupRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.user_groups', 'userGroups')
      .where('group.is_deleted = :isDeleted', { isDeleted: false });

    const selected_filters = { status: [] };

    if (params.active !== null) {
      queryBuilder.andWhere('group.status = :status', {
        status: params.active ? GroupStatus.active : GroupStatus.inactive,
      });
    }

    if (params.filters) {
      const { status } = params.filters;

      selected_filters.status = status || [];

      if (status && status.length > 0) {
        queryBuilder = queryBuilder.andWhere('group.status IN (:...status)', {
          status,
        });
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder.skip(skip).take(take);

    const [userGroups, total] = await queryBuilder.getManyAndCount();

    const responseGroups: UserGroupResponseDto[] = userGroups.map((userGroup) =>
      this.convertToDTO(userGroup),
    );

    const filters = await this.filterService.getFilters(
      selected_filters,
      'only_status',
    );

    return {
      groups: responseGroups,
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      filters,
      message: 'Success',
    };
  }

  async getById(id: string): Promise<UserGroupDetailsResponse> {
    const userGroup = await this.groupRepository.findOne({
      where: { id },
      relations: ['user_groups'],
    });

    if (!userGroup) {
      throw new NotFoundException(`User group with ID ${id} not found`);
    }

    return {
      group: this.convertToDetailsDTO(userGroup),
    };
  }

  private applySearch(users: User[], search: string) {
    return users.filter(
      (user) =>
        user.email.includes(search) ||
        `${user.first_name} ${user.last_name}`.includes(search),
    );
  }

  async getAllUser(
    id: string,
    params: GetUserSearchParams,
  ): Promise<GetUserResponse> {
    const existingsUserGroups = await this.userGroupRepository.find({
      where: { group_id: id },
      // relations: ['user'],
    });

    const existingUsers = existingsUserGroups.map((x) => x.user);

    const otherUsers = await this.userRepository.find({
      where: { id: Not(In(existingUsers.map((user) => user.id))) },
    });

    let allUsers: User[] = existingUsers.concat(otherUsers);

    if (params.search) {
      allUsers = this.applySearch(allUsers, params.search);
    }

    const selected_filters = { user_roles: [], status: [], avail_status: [] };

    if (params.filters) {
      const { status, user_roles, avail_status } = params.filters;

      selected_filters.status = status || [];
      selected_filters.user_roles = user_roles || [];
      selected_filters.avail_status = avail_status || [];
    }

    const mappedUser: UserDTO[] = allUsers.map((x) => ({
      record_id: x.id,
      id: x.id,
      created_at: DateUtilsService.dateToString(x.created_at),
      email: x.email,
      full_name: `${x.first_name} ${x.first_name}`,
    }));

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    const paginatedUsers = mappedUser.slice(skip, skip + take);

    const filters = await this.filterService.getFilters(
      selected_filters,
      'users_with_status',
    );

    return {
      users: paginatedUsers,
      pagination: {
        total_entries: allUsers.length,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
      filters: filters,
    };
  }

  private async saveUserGroups(
    queryRunner: QueryRunner,
    users: UserGroupsAttribute[],
    group_id: string,
  ) {
    for (const user of users) {
      if (user._destroy) {
        // Soft delete steps by setting `is_deleted` to true
        await queryRunner.manager.delete(UserGroup, { id: user.id });
      } else {
        // Update or add new steps
        const user_group = queryRunner.manager.create(UserGroup, {
          group_id: group_id,
          user_id: user.user_id,
          created_at: new Date(),
          updated_at: new Date(),
        });

        await queryRunner.manager.save(UserGroup, user_group);
      }
    }
  }

  async create(data: AddEditRequestDTO) {
    const duplicateTitle = await this.customUniqueService.isExist(
      Group,
      'title',
      data.title,
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const group = queryRunner.manager.create(Group, {
        title: data.title,
        status: GroupStatus.active,
        description: data.description,
      });
      await queryRunner.manager.save(group);

      if ((data.user_groups_attributes || []).length > 0) {
        await this.saveUserGroups(
          queryRunner,
          data.user_groups_attributes,
          group.id,
        );
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      return this.getById(group.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async update(id: string, data: AddEditRequestDTO) {
    const group = await this.groupRepository.findOne({
      where: { id, is_deleted: false },
    });

    if (!group) {
      throw new NotFoundException(`Group with id ${id} not found`);
    }

    const duplicateTitle = await this.customUniqueService.isExist(
      Group,
      'title',
      data.title,
      {},
      id,
    );
    if (duplicateTitle) {
      throw new BadRequestException({ error: 'Title should be unique' });
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      Object.assign(group, {
        title: data.title,
        status: data.status,
        description: data.description,
      });
      await queryRunner.manager.save(Group, group);

      if ((data.user_groups_attributes || []).length > 0) {
        await this.saveUserGroups(
          queryRunner,
          data.user_groups_attributes,
          group.id,
        );
      }

      await queryRunner.commitTransaction();

      return this.getById(group.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async destroy(id: string) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const group = await queryRunner.manager.findOne(Group, {
        where: { id },
      });

      if (!group) {
        throw new NotFoundException(`Group with id ${id} not found`);
      }

      await queryRunner.manager.update(
        Group,
        { id: id },
        {
          is_deleted: true,
        },
      );

      await queryRunner.manager.delete(UserGroup, {
        group_id: id,
      });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return this.getById(group.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }
}
