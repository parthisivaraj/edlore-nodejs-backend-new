// sketch.controller.ts
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
import { SketchService } from './sketch.service';
import { SearchParamsDTO } from '@app/schema/dto';
import { ApiTags } from '@nestjs/swagger';
import { AddEditRequestDTO } from './dto/add-edit';
import { SketchSearchParams } from './dto/sketch';
import { Public } from '@app/common-utils';

@Controller('model/:modelId')
@ApiTags('sketches')
export class SketchController {
  constructor(private sketchService: SketchService) {}

  @Get('/sketches/:type(1|2|3)')
  async get(
    @Param('modelId') modelId: string,
    @Param('type') type: number,
    @Query() query: SketchSearchParams,
  ) {
    return await this.sketchService.get(modelId, type, query);
  }

  @Public()
  @Get('/section/:sectionId/sketches')
  async getBySection(
    @Param('modelId') modelId: string,
    @Param('sectionId') sectionId: string,
    @Query() query: SketchSearchParams,
  ) {
    return await this.sketchService.getBySection(
      modelId,
      sectionId,
      (query as any).type,
      query,
    );
  }

  @Get('section/:sectionId/sketches/:id')
  async getById(
    @Param('sectionId') sectionId: string,
    @Param('id') id: string,
  ) {
    return await this.sketchService.getById(sectionId, id);
  }

  @Post('section/:sectionId/sketches')
  async create(
    @Param('modelId') modelId: string,
    @Param('sectionId') sectionId: string,
    @Body() data: AddEditRequestDTO,
  ) {
    return await this.sketchService.create(modelId, sectionId, data);
  }

  @Put('section/:sectionId/sketches/:id')
  async update(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() data: AddEditRequestDTO,
  ) {
    return await this.sketchService.update(id, sectionId, data);
  }

  @Delete('section/:sectionId/sketches/:id')
  async remove(@Param('id') id: string) {
    return await this.sketchService.destroy(id);
  }
}
