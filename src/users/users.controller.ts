import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './users.service';
import {
  ChangeStatusDTO,
  CreateUserDTO,
  CurrentUserUpdatePasswordDTO,
  UpdatePasswordDTO,
  UpdateRoleDTO,
  UpdateUserDTO,
  UpdateUserResponse,
  UserSearchParams,
} from './dto/user';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { SearchParamsDTO } from '@app/schema/dto';

@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private userService: UserService) {}

  @Get('')
  async get(@Query() params: UserSearchParams) {
    return await this.userService.get(params);
  }

  @Get('all_except_logged_in')
  async getExceptLoggedIn(@Request() req, @Query() params: UserSearchParams) {
    const loggedInUserId = req.user.id;
    return this.userService.get(params, loggedInUserId);
  }

  @Get('role_permissions')
  async rolePermissions(@Req() req: any) {
    const loggedInUserId = req.user.id;
    return await this.userService.rolePermissions(loggedInUserId);
  }

  @Get('current_user_details')
  @UseGuards(JwtAuthGuard)
  async currentUserDetails(@Req() req: any) {
    const loggedInUserId = req.user.id;
    return await this.userService.getById(loggedInUserId);
  }

  @Get('support_availability_status')
  async support_availability_status(
    @Query() params: SearchParamsDTO,
    @Req() req: any,
  ) {
    const loggedInUserId = req.user.id;
    return await this.userService.support_availability_status(
      loggedInUserId,
      params,
    );
  }

  @Get('current_user_status')
  async current_user_status(@Req() req: any) {
    const loggedInUserId = req.user.id;
    return await this.userService.getCurrentUserStatus(loggedInUserId);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.userService.getById(id);
  }

  @Post('')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() data: CreateUserDTO,
    @UploadedFiles() files: Express.Multer.File[], // This will contain uploaded files, including the image
  ) {
    const image = (files || []).find((file) => file.fieldname === 'image'); // Extract the image file
    return await this.userService.create(data, image);
  }

  @Post('change_status')
  async changeStatus(@Req() req: any, @Body() data: ChangeStatusDTO) {
    const loggedInUserId = req.user.id;
    return await this.userService.changeStatus(loggedInUserId, data);
  }

  @Post(':id/change_status')
  async userChangeStatus(@Param('id') id: string, @Body() data) {
    return await this.userService.changeStatus(id, data);
  }

  @Patch('update_personal_details')
  @UseInterceptors(AnyFilesInterceptor())
  async updatePersonalDetails(
    @Body() data: UpdateUserDTO,
    @Req() req: any,
    @UploadedFiles() files: Express.Multer.File[], // This will contain uploaded files, including the image
  ): Promise<UpdateUserResponse> {
    const loggedInUserId = data.id || req.user.id;

    const image = (files || []).find((file) => file.fieldname === 'image'); // Extract the image file

    return await this.userService.updatePersonalDetails({
      ...data,
      image,
      id: loggedInUserId,
    });
  }

  @Patch(':id/update_role')
  async updateRole(@Param('id') id: string, @Body() data: UpdateRoleDTO) {
    return await this.userService.updateRole(id, data);
  }

  @Patch('update_password')
  async updatePassword(@Body() data: UpdatePasswordDTO) {
    return await this.userService.updatePassword(data);
  }

  @Patch('current_user_update_password')
  async current_user_update_password(
    @Req() req: any,
    @Body() data: CurrentUserUpdatePasswordDTO,
  ) {
    const loggedInUserId = req.user.id;

    return await this.userService.currentUserUpdatePassword(
      loggedInUserId,
      data,
    );
  }

  @Delete(':user_id')
  async deleteUser(@Param('user_id') user_id: string): Promise<void> {
    await this.userService.deleteUser(user_id);
  }
}
