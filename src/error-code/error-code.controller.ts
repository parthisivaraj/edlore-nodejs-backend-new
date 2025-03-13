import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ErrorCodeService } from './error-code.service';
import { SearchParamsDTO } from '@app/schema/dto';
import { ApiTags } from '@nestjs/swagger';
import {
  AddEditErrorCodeDTO,
  LinkProceduresRequest,
  LinkTroubleshootsRequest,
} from './dto/add-edit';
import { ListLinkingParamDTO } from './dto/error-code';

@Controller('model/:modelId')
@ApiTags('error_codes')
export class ErrorCodeController {
  constructor(private errorCodeService: ErrorCodeService) {}

  @Get('/error_codes/:type(1|2|3)')
  async getErrorCodes(
    @Param('modelId') modelId: string,
    @Param('type') type: number,
    @Query() query: SearchParamsDTO,
    @Req() request: { user: { id: string } },
  ) {
    const currentUser = request.user?.id || '';
    const message = 'Success';

    return await this.errorCodeService.get(
      modelId,
      type,
      query,
      currentUser,
      message,
    );
  }

  // Linking
  @Get('/error_code/:id/linked_troubleshoots')
  async linked_troubleshoots(
    @Param('id') id: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.errorCodeService.linked_troubleshoots(id, query);
  }

  @Get('/error_code/:id/linked_procedures')
  async linked_procedures(
    @Param('id') id: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.errorCodeService.linked_procedures(id, query);
  }

  @Get('/error_code/:id/all_procedures')
  async all_procedures(
    @Param('id') id: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.errorCodeService.all_procedures(id, query);
  }

  @Get('/error_code/:id/all_troubleshoots')
  async all_troubleshoots(
    @Param('id') id: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.errorCodeService.all_troubleshoots(id, query);
  }

  @Get('/error_code/:id/list_linking')
  async getListLinking(
    @Param('id') id: string,
    @Query() query: ListLinkingParamDTO,
  ) {
    return await this.errorCodeService.getListLinking(id, query);
  }

  @Get('/error_code/:id')
  async getById(@Param('id') id: string) {
    return await this.errorCodeService.getById(id);
  }

  @Post('/error_code')
  async create(
    @Param('modelId') modelId: string,
    @Body() data: AddEditErrorCodeDTO,
  ) {
    return await this.errorCodeService.create(modelId, data);
  }

  @Post('/error_code/:id/link_procedures')
  async link_procedures(
    @Param('id') id: string,
    @Body() body: LinkProceduresRequest,
  ) {
    return await this.errorCodeService.link_procedures(id, body);
  }

  @Post('/error_code/:id/link_troubleshoots')
  async link_troubleshoots(
    @Param('id') id: string,
    @Body() body: LinkTroubleshootsRequest,
  ) {
    return await this.errorCodeService.link_troubleshoots(id, body);
  }

  @Patch('/error_code/:id')
  async update(@Param('id') id: string, @Body() data: AddEditErrorCodeDTO) {
    return await this.errorCodeService.update(id, data);
  }

  @Delete('error_code/:id')
  async remove(@Param('id') id: string) {
    return await this.errorCodeService.destroy(id);
  }
}
