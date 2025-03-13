import { Controller, Get, Query, Param, Post, Body, Put } from '@nestjs/common';
import { UserRoleService } from './user-role.service';
import { ApiTags } from '@nestjs/swagger';
import {
  UserRoleResponseDto,
  UserRoleResponse,
  UserRoleSearchParams,
  CreateUserRoleDto,
} from './dto/user-role';

@Controller('roles')
@ApiTags('user-role')
export class UserRoleController {
  constructor(private userRoleService: UserRoleService) {}

  @Get('')
  async get(@Query() params: UserRoleSearchParams): Promise<UserRoleResponse> {
    return await this.userRoleService.get(params);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<UserRoleResponseDto> {
    return await this.userRoleService.getById(id);
  }

  @Post()
  async create(
    @Body() createUserRoleDto: CreateUserRoleDto,
  ): Promise<UserRoleResponseDto> {
    return this.userRoleService.create(createUserRoleDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserRoleDto: CreateUserRoleDto,
  ): Promise<UserRoleResponseDto> {
    return this.userRoleService.update(id, updateUserRoleDto);
  }
}
