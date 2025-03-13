import { DBSchemas } from '@app/schema';
import { Module } from '@nestjs/common';
import { GroupController } from './groups.controller';
import { GroupService } from './groups.service';

@Module({
  imports: [DBSchemas.group, DBSchemas.user, DBSchemas.userGroup],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
