import { DBSchemas } from '@app/schema';
import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { APIService } from './api.service';

@Module({
  imports: [DBSchemas.database],
  controllers: [DatabaseController],
  providers: [APIService, DatabaseService],
  exports: [],
})
export class DatabaseModule {}
