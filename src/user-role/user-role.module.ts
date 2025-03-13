import { Module } from '@nestjs/common';
import { UserRoleController } from './user-role.controller';
import { UserRoleService } from './user-role.service';
import { DBSchemas } from '@app/schema';

@Module({
  imports: [
    DBSchemas.userRole,
    DBSchemas.user,
    DBSchemas.role,
    DBSchemas.permission,
  ],
  controllers: [UserRoleController],
  providers: [UserRoleService],
  exports: [UserRoleService],
})
export class UserRoleModule {}
