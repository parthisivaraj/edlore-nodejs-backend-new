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
import { TroubleshootService } from './troubleshoot.service';
import {
  AddEditTroubleshootDto,
  ApprovalStatusTroubleshootDto,
} from './dto/troubleshoot';
import { SearchParamsDTO } from '@app/schema/dto';

@Controller('model/:modelId/troubleshoot')
@ApiTags('troubleshoot')
export class TroubleshootController {
  constructor(private troubleshootService: TroubleshootService) {}

  @Get('')
  async get(
    @Param('modelId') modelId: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.troubleshootService.get(modelId, query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.troubleshootService.getById(id);
  }

  @Post('')
  async create(
    @Param('modelId') modelId: string,
    @Body() data: AddEditTroubleshootDto,
  ) {
    return await this.troubleshootService.create(modelId, data);
  }

  @Post(':id/approval_status_update')
  async approval_status_update(
    @Param('id') id: string,
    @Body() data: ApprovalStatusTroubleshootDto,
  ) {
    return await this.troubleshootService.approvalStatusUpdate(id, data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: AddEditTroubleshootDto) {
    return await this.troubleshootService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.troubleshootService.destroy(id);
  }
}
