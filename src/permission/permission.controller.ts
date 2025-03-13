import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionService } from './permission.service';
import { PermissionSearchParams } from './dto/permission';

@Controller('permission')
@ApiTags('permission')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get()
  async getPermissions(@Query() params: PermissionSearchParams) {
    return await this.permissionService.getPermissions(params);
  }
}
