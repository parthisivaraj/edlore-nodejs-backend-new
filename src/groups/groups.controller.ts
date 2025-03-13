import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  UserGroupResponse,
  GroupSearchParams,
  GetUserSearchParams,
} from './dto/groups';
import { ApiTags } from '@nestjs/swagger';
import { GroupService } from './groups.service';
import { AddEditRequestDTO } from './dto/add-edit';

@Controller('group')
@ApiTags('group')
export class GroupController {
  constructor(private userGroupService: GroupService) {}

  @Get('')
  async get(@Query() params: GroupSearchParams): Promise<UserGroupResponse> {
    return await this.userGroupService.get(params);
  }

  @Get(':id/get_users')
  async getUsers(
    @Param('id') id: string,
    @Query() params: GetUserSearchParams,
  ) {
    return await this.userGroupService.getAllUser(id, params);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.userGroupService.getById(id);
  }

  @Post('')
  async create(@Body() data: AddEditRequestDTO) {
    return await this.userGroupService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: AddEditRequestDTO) {
    return await this.userGroupService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.userGroupService.destroy(id);
  }
}
