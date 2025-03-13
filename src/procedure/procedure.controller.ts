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
import { ProcedureService } from './procedure.service';
import { SearchParamsDTO } from '@app/schema/dto';
import {
  AddProcedureDTORequest,
  EditProcedureDTORequest,
} from './dto/add-edit';
import { SetAdmin } from '@app/common-utils';

@Controller('model/:modelId/procedure')
@ApiTags('procedure')
export class ProcedureController {
  constructor(private procedureService: ProcedureService) {}

  @Get('')
  async get(
    @Param('modelId') modelId: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.procedureService.get(modelId, query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.procedureService.getById(id);
  }

  @Post('')
  @HttpCode(201)
  @SetAdmin()
  async create(
    @Param('modelId') modelId: string,
    @Body() data: AddProcedureDTORequest,
  ) {
    return await this.procedureService.create(modelId, data);
  }

  @Put(':id')
  @SetAdmin()
  async update(@Param('id') id: string, @Body() data: EditProcedureDTORequest) {
    return await this.procedureService.update(id, data);
  }
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.procedureService.destroy(id);
  }
}
