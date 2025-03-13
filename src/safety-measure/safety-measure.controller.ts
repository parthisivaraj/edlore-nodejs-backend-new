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
import { SafetyMeasureService } from './safety-measure.service';
import { ApiTags } from '@nestjs/swagger';
import { SafetyMeasureSearchParams } from './dto/safety-measure';
import { AddEditRequestDTO } from './dto/add-edit';

@Controller('model/:modelId/safety_measure')
@ApiTags('safety_measure')
export class SafetyMeasureController {
  constructor(private safetyMeasureService: SafetyMeasureService) {}

  @Get('enabled_safety_measures')
  async enabled_safety_measures(
    @Param('modelId') modelId: string,
    @Query() query: SafetyMeasureSearchParams,
  ) {
    return await this.safetyMeasureService.enabled_safety_measures(
      modelId,
      query,
    );
  }

  @Get('')
  async get(
    @Param('modelId') modelId: string,
    @Query() query: SafetyMeasureSearchParams,
  ) {
    return await this.safetyMeasureService.get(modelId, query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.safetyMeasureService.getById(id);
  }

  @Post('')
  async create(
    @Param('modelId') modelId: string,
    @Body() data: AddEditRequestDTO,
  ) {
    return await this.safetyMeasureService.create(modelId, data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: AddEditRequestDTO) {
    return await this.safetyMeasureService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.safetyMeasureService.destroy(id);
  }
}
