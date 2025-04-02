import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { PartFieldsService } from './part-fields.service';
import { PartFieldsDTO } from './dto/part-fields';
import { CreateUpdatePartFieldsDTO } from './dto/add-edit';
import { ApiTags } from '@nestjs/swagger';

@Controller('part_fields')
@ApiTags('part_fields')
export class PartFieldsController {
  constructor(private readonly partFieldsService: PartFieldsService) {}

  @Get()
  async get(): Promise<PartFieldsDTO[]> {
    return this.partFieldsService.get();
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<PartFieldsDTO> {
    return this.partFieldsService.getById(id);
  }

  @Post()
  async create(
    @Body() createPartFieldsDto: CreateUpdatePartFieldsDTO,
  ): Promise<PartFieldsDTO> {
    return this.partFieldsService.create(createPartFieldsDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePartFieldsDto: CreateUpdatePartFieldsDTO,
  ): Promise<PartFieldsDTO> {
    return this.partFieldsService.update(id, updatePartFieldsDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.partFieldsService.remove(id);
  }
}
