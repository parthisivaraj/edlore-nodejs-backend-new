import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { WorkOrderService } from './work-order.service';
import { ApiTags } from '@nestjs/swagger';
import { SearchParamsDTO } from '@app/schema/dto';

@Controller('work-orders')
@ApiTags('work-orders')
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
}
