import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchParamsDTO } from '@app/schema/dto';
import { SectionService } from './section.service';
import { AddEditSectionDTORequest } from './dto/add-edit';

@Controller('model/:modelId/section')
@ApiTags('section')
export class SectionController {
  constructor(private sectionService: SectionService) {}

  @Get('')
  async get(
    @Param('modelId') modelId: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.sectionService.get(modelId, query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.sectionService.getById(id);
  }

  @Post('')
  async create(
    @Param('modelId') modelId: string,
    @Body() data: AddEditSectionDTORequest,
  ) {
    return await this.sectionService.create(modelId, data);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Param('modelId') modelId: string,
    @Body() data: AddEditSectionDTORequest,
  ) {
    return await this.sectionService.update(id, modelId, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.sectionService.remove(id);
  }
}
