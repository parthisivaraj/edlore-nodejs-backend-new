import {
  ActiveStatus,
  SupportAvailabilityStatus,
  User,
  UserRole,
} from '@app/schema';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, QueryRunner, Repository } from 'typeorm';
import {
  ChangeStatusDTO,
  CreateUserDTO,
  CurrentUserUpdatePasswordDTO,
  UpdatePasswordDTO,
  UpdateRoleDTO,
  UpdateUserDTO,
  UserResponseDto,
  UserSearchParams,
  UsersResponse,
} from './dto/user';
import { FilterService } from '@app/schema/service';
import { DateUtilsService } from '@app/common-utils';
import * as bcrypt from 'bcrypt';
import { SearchParamsDTO } from '@app/schema/dto';
import { MediaService } from 'src/media';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private dataSource: DataSource,

    private filterService: FilterService,
    private mediaService: MediaService,
  ) {}

  private async convertToDTO(user: User): Promise<UserResponseDto> {
    const response = new UserResponseDto();
    response.id = user.id;
    response.full_name = `${user.first_name} ${user.last_name}`;
    response.email = user.email;
    response.username = user.username;
    response.mobile_number = user.mobile_number;
    response.created_at = DateUtilsService.dateToString(user.created_at);
    response.first_name = user.first_name;
    response.last_name = user.last_name;
    response.user_id = user.user_id;
    response.image = '';
    if ((user.attachedMedia || []).length > 0) {
      response.image = await this.mediaService.getThumbnailUrl(
        'image',
        user.attachedMedia[0].blob,
      );
    }
    response.identification_code = user.identification_code || '';
    response.status = user.status === 1 ? 'active' : 'inactive';
    response.support_availability_status = this.mapAvailabilityStatus(
      user.support_availability_status,
    );
    if (user.user_roles && user.user_roles.length > 0) {
      response.role = {
        id: user.user_roles[0].role?.id,
        title: user.user_roles[0].role?.title,
        description: user.user_roles[0].role?.title,
        created_at: DateUtilsService.dateToString(
          user.user_roles[0].created_at,
        ),
        permissions: [],
        status: user.user_roles[0].role?.status === 1 ? 'active' : 'inactive',
      };
    } else {
      response.role = null;
    }

    return response;
  }

  private mapAvailabilityStatus(
    status: number,
  ): 'Online' | 'Away' | 'Offline' | 'busy' {
    switch (status) {
      case 1:
        return 'Online';
      case 2:
        return 'Away';
      case 3:
        return 'Offline';
      case 4:
        return 'busy';
      default:
        return 'Offline';
    }
  }

  async get(
    params: UserSearchParams,
    loggedInUserId?: string,
  ): Promise<UsersResponse> {
    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.user_roles', 'user_roles')
      .leftJoinAndSelect('user_roles.role', 'role')
      .leftJoinAndSelect('user.attachedMedia', 'attachedMedia')
      .leftJoinAndSelect('attachedMedia.blob', 'blob')
      .where('user.status = :status', {
        status: ActiveStatus.Active,
      });

    if (loggedInUserId) {
      queryBuilder.andWhere('user.id != :loggedInUserId', { loggedInUserId });
    }

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%^&*()\-=\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );
      queryBuilder = queryBuilder.andWhere(
        "LOWER('user'.first_name) LIKE LOWER(:search) ESCAPE '\\'",
        { search: `%${escapedKeyword}%` },
      );
    }

    if (params.active !== null && params.active !== undefined) {
      queryBuilder.andWhere('user.status = :status', {
        status: params.active ? 1 : 2,
      });
    }

    const selected_filters = { avail_status: [], user_roles: [] };

    if (params.filters) {
      const { avail_status, user_roles } = params.filters;

      selected_filters.avail_status = avail_status || [];
      selected_filters.user_roles = user_roles || [];

      if (avail_status && avail_status.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'user.support_availability_status IN (:...avail_status)',
          {
            avail_status,
          },
        );
      }

      if (user_roles && user_roles.length > 0) {
        queryBuilder = queryBuilder.andWhere(
          'user_roles.id IN (:...user_roles)',
          {
            user_roles,
          },
        );
      }
    }

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder = queryBuilder.skip(skip).take(take);

    const [users, total] = await queryBuilder.getManyAndCount();

    const filters = await this.filterService.getFilters(
      selected_filters,
      'users',
    );

    return {
      users: await Promise.all(users.map((user) => this.convertToDTO(user))),
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

  async support_availability_status(
    id: string,
    params: SearchParamsDTO,
  ): Promise<any> {
    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.support_availability_status = :status', { status: 1 }) // Filter by availability
      .andWhere('user.id != :id', { id })
      .orderBy('user.updated_at', 'ASC');

    const take = params.limit || 10;
    const skip = (params.page - 1) * take;
    queryBuilder = queryBuilder.skip(skip).take(take);

    const [users, total] = await queryBuilder.getManyAndCount();

    // Prepare and return paginated response
    return {
      users: users.map((user) => ({
        id: user.id,
        support_availability_status: this.mapAvailabilityStatus(
          user.support_availability_status,
        ),
        email: user.email,
        mobile_number: user.mobile_number,
        full_name: `${user.first_name} ${user.last_name}`,
      })),
      pagination: {
        total_entries: total,
        current_page: params.page,
        per_page: take,
        offset: skip,
      },
    };
  }

  async getCurrentUserStatus(id: string): Promise<any> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .andWhere('user.id != :id', { id });

    const user = await queryBuilder.getOne();

    // Prepare and return paginated response
    return {
      current_user_status: this.mapAvailabilityStatus(
        user.support_availability_status,
      ),
    };
  }

  async getById(id: string): Promise<UserResponseDto> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.user_roles', 'user_roles')
      .leftJoinAndSelect('user_roles.role', 'role')
      .leftJoinAndSelect('role.role_permissions', 'role_permissions')
      .leftJoinAndSelect('role_permissions.permission', 'permission')
      .leftJoinAndSelect('user.attachedMedia', 'attachedMedia')
      .leftJoinAndSelect('attachedMedia.blob', 'blob')
      .where('user.id = :id', { id });
    const user = await queryBuilder.getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return await this.convertToDTO(user);
  }

  async create(data: CreateUserDTO): Promise<UserResponseDto> {
    const emailCheck = await this.userRepository.count({
      where: { email: data.email.toLowerCase() },
    });

    if (emailCheck) {
      throw new BadRequestException(`Email address should be unique`);
    }

    const usernameCheck = await this.userRepository.count({
      where: { username: data.username.toLowerCase() },
    });

    if (usernameCheck) {
      throw new BadRequestException(`Username should be unique`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const encrypted_password = await bcrypt.hash(data.password, 10);
    try {
      const user = this.userRepository.create({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email.toLowerCase(),
        username: data.username.toLowerCase(),
        mobile_number: data.mobile_number,
        identification_code: data.identification_code,
        org_id: data.org_id,
        password_renewed: data.password_renewed,
        encrypted_password:  encrypted_password,
        status: ActiveStatus.Active,
      });
      const savedUser = await this.userRepository.save(user);

      await queryRunner.manager.save(UserRole, {
        user_id: savedUser.id,
        role_id: data.role_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await queryRunner.commitTransaction();

      return await this.convertToDTO(savedUser);
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Error creating user');
    }
  }

  async rolePermissions(userId: string) {
    try {
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.user_roles', 'user_roles')
        .leftJoinAndSelect('user_roles.role', 'role')
        .leftJoinAndSelect('role.role_permissions', 'role_permissions')
        .leftJoinAndSelect('role_permissions.permission', 'permission')
        .where('user.id = :id', { id: userId });

      const user = await queryBuilder.getOne();

      if (!user || user.user_roles.length === 0) {
        throw new NotFoundException('No roles are assigned to the user');
      }

      const role = user.user_roles[0].role;

      const permissions = role.role_permissions.map(
        (rp) => rp.permission.title,
      );

      return {
        role: {
          id: role.id,
          title: role.title,
          description: role.description,
        },
        permissions,
        permissions_count: permissions.length,
      };
    } catch (error) {
      throw new Error('Failed to fetch role permissions: ' + error.message);
    }
  }

  async currentUserDetails(loggedInUserId: string): Promise<UserResponseDto> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.user_roles', 'user_roles')
      .leftJoinAndSelect('user_roles.role', 'role')
      .leftJoinAndSelect('user.attachedMedia', 'attachedMedia')
      .leftJoinAndSelect('attachedMedia.blob', 'blob')
      .where('user.id = :id', { id: loggedInUserId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.convertToDTO(user);
  }

  async changeStatus(id: string, data: ChangeStatusDTO) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    Object.assign(user, {
      support_availability_status: data.support_availability_status,
    });
    await this.userRepository.save(user);
    return {
      messsage: `Successfully changed to ${SupportAvailabilityStatus[data.support_availability_status]}`,
    };
  }

  async updatePersonalDetails(data: UpdateUserDTO): Promise<any> {
    const {
      id,
      first_name,
      last_name,
      mobile_number,
      identification_code,
      image,
      username,
    } = data;
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (username) {
      const usernameCheck = await this.userRepository.findOne({
        where: {
          username: data.username.toLowerCase(),
          id: Not(user.id), // Exclude the current user
        },
      });

      if (usernameCheck) {
        throw new BadRequestException(`Username should be unique`);
      }
    }

    if (image) {
      await this.mediaService.deleteRecordMedia(user.id, 'User');
      await this.mediaService.saveMedia(image, {
        media_title: first_name,
        media_type: 'image',
        name: 'image',
        record_id: user.id,
        record_type: 'User',
      });
    }
    user.first_name = first_name;
    user.last_name = last_name;
    if (username) {
      user.username = username;
    }
    user.mobile_number = mobile_number;
    user.identification_code = identification_code;
    delete user.attachedMedia;
    delete user.user_roles;

    const newData = await this.userRepository.save(user);
    return {
      user_id: id,
      Message: 'Successfully Updated the User',
      user: {
        ...newData,
        full_name: `${newData.first_name} ${newData.last_name}`,
      } as any,
    };
  }

  async updateRole(id: string, data: UpdateRoleDTO) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(UserRole, {
        user_id: id,
      });
      await queryRunner.manager.save(UserRole, {
        user_id: id,
        role_id: data.role_id,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await queryRunner.manager.update(
        User,
        {
          id,
        },
        {
          permissions_upadted_at: new Date(),
        },
      );

      await queryRunner.commitTransaction();

      return {
        messsage: `Successfully updated the role`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  async updatePassword(data: UpdatePasswordDTO) {
    if (data.password !== data.password_confirmation) {
      throw new BadRequestException(
        `password and confirmation password not matching`,
      );
    }
    const user = await this.userRepository.findOne({
      where: { id: data.id },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    user.encrypted_password = hashedPassword;
    user.password_updated_at = new Date();

    await this.userRepository.save(user);
    return { message: 'Successfully updated the password' };
  }

  async currentUserUpdatePassword(
    id: string,
    data: CurrentUserUpdatePasswordDTO,
  ) {
    if (data.password !== data.password_confirmation) {
      throw new BadRequestException(
        `password and confirmation password not matching`,
      );
    }
    const user = await this.userRepository.findOne({
      where: { id: id },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      data.current_password,
      user.encrypted_password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('User current password is not matching');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    user.encrypted_password = hashedPassword;
    user.password_updated_at = new Date();

    await this.userRepository.save(user);
    return { message: 'Successfully updated the password' };
  }

  async deleteUser(user_id: string) {
    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: [
        'user_roles',
        'user_groups',
        'device_tokens',
        'otps',
        'notifications',
        // 'jobs',
        // 'asset_notes',
        // 'workOrders',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with user_id ${user_id} not found`);
    }

    await this.userRepository.remove(user);
    return { message: 'User Deleted Successfully' };
  }
}
