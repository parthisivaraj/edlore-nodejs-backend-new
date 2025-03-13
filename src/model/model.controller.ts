import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ModelService } from './model.service';
import { SearchParamsDTO } from '@app/schema/dto';
import { AddModelDTORequest, EditModelDTORequest } from './dto/add-edit';
import { DeviceSearchParams } from 'src/devices/dto/seach';

@Controller('model')
@ApiTags('model')
export class ModelController {
  constructor(private modelService: ModelService) {}

  @Get('')
  async get(@Query() query: SearchParamsDTO) {
    return await this.modelService.get(query);
  }

  @Get(':id/device')
  async getByDevice(
    @Param('id') id: string,
    @Query() query: DeviceSearchParams,
  ) {
    const devices = await this.modelService.getByDevice(id, query);
    return devices;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.modelService.getById(id);
  }

  @Post('')
  @HttpCode(201)
  async create(@Body() data: AddModelDTORequest) {
    return await this.modelService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: EditModelDTORequest) {
    return await this.modelService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.modelService.remove(id);
  }
}
