import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchParamsDTO } from '@app/schema/dto';
import { DeskProcedureService } from './desk-procedure.service';

@Controller('procedure')
@ApiTags('desk-procedure')
export class DeskProcedureController {
  constructor(private procedureService: DeskProcedureService) {}

  @Get('')
  async get(@Query() query: SearchParamsDTO) {
    return await this.procedureService.get(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.procedureService.getById(id);
  }
}
