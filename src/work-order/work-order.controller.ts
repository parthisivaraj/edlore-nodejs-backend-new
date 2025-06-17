import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  NotFoundException,
  Query,
  UploadedFiles,
  UseInterceptors,
  Request
} from '@nestjs/common';
// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Patch,
//   Post,
//   Query,
//   Req,
//   Request,
//   UploadedFiles,
//   UseGuards,
//   UseInterceptors,
// } from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { ApiTags } from '@nestjs/swagger';
import { SearchParamsDTO } from '@app/schema/dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

import {
  CreateWorkOrderDto, UpdateWorkOrderDto
} from './dto/work-order';

@Controller('work_order')
@ApiTags('work_order')
export class WorkOrderController {
  constructor(private readonly workOrderService: WorkOrderService) {}

  @Get('')
  async get(@Query() query: SearchParamsDTO) {
    return await this.workOrderService.get(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const workOrder = await this.workOrderService.getById(id);
    if (!workOrder) {
      throw new NotFoundException(`WorkOrder with ID ${id} not found`);
    }
    return workOrder;
  }

  @Post('')
  async create(@Body() data: CreateWorkOrderDto, @Request() req) {
    return await this.workOrderService.create(data, req.user);
  }

  @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateWorkOrderDto) {
      return await this.workOrderService.update(id, data);
    }
}
