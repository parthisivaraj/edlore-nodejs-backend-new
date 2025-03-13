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
import { TaskTypeService } from './task-type.service';
import { SearchParamsDTO } from '@app/schema/dto';

@Controller('task_type')
@ApiTags('task_type')
export class TaskTypeController {
  constructor(private taskTypeService: TaskTypeService) {}

  @Get('')
  async get(@Query() query: SearchParamsDTO) {
    return await this.taskTypeService.get(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.taskTypeService.getById(id);
  }

  // @Post('')
  // async create(@Body() data) {
  //   return await this.taskTypeService.create(data);
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() data) {
  //   return await this.taskTypeService.update(id, data);
  // }

  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return await this.taskTypeService.remove(id);
  // }
}
