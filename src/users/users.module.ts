import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserService } from './users.service';
import { DBSchemas } from '@app/schema';
import { MediaModule } from 'src/media';
@Module({
  imports: [
    DBSchemas.user,
    DBSchemas.role,
    DBSchemas.userRole,
    DBSchemas.rolePermissions,
    MediaModule,
  ],
  controllers: [UsersController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
