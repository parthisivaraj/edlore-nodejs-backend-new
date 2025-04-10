import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { PartFieldsMappingsService } from './part-fields-mappings.service';
import { PartFieldsMappingsDTO } from './dto/part-fields-mappings';
import { CreateUpdatePartFieldsMappingsDTO } from './dto/add-edit';
import { ApiTags } from '@nestjs/swagger';

@Controller('part_fields_mappings')
@ApiTags('part_fields_mappings')
export class PartFieldsMappingsController {
  constructor(private readonly partFieldsMappingsService: PartFieldsMappingsService) {}

  @Get(':part_id')
  async getByPartId(@Param('part_id') part_id: string): Promise<PartFieldsMappingsDTO[]> {
    return this.partFieldsMappingsService.getByPartId(part_id);
  }

  @Post()
  async create(
    @Body() createPartFieldsMappingsDto: CreateUpdatePartFieldsMappingsDTO,
  ): Promise<PartFieldsMappingsDTO> {
    return this.partFieldsMappingsService.create(createPartFieldsMappingsDto);
  }
}
