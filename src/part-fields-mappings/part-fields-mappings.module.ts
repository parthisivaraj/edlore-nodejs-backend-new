import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartFieldsMappingsController } from './part-fields-mappings.controller';
import { PartFieldsMappingsService } from './part-fields-mappings.service';
import { PartFieldsMappings } from '@app/schema';

@Module({
  imports: [TypeOrmModule.forFeature([PartFieldsMappings])],
  controllers: [PartFieldsMappingsController],
  providers: [PartFieldsMappingsService],
})
export class PartFieldsMappingsModule {}
