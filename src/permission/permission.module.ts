import { DBSchemas } from '@app/schema';
import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

@Module({
  imports: [DBSchemas.permission],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionsModule {}
