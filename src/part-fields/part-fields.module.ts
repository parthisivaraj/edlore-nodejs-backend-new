import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartFieldsController } from './part-fields.controller';
import { PartFieldsService } from './part-fields.service';
import { PartFields } from '@app/schema';

@Module({
  imports: [TypeOrmModule.forFeature([PartFields])],
  controllers: [PartFieldsController],
  providers: [PartFieldsService],
})
export class PartFieldsModule {}
