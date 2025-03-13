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
import { WrittenIssueService } from './written-issue.service';
import { ApiTags } from '@nestjs/swagger';
import { WrittenIssueSearchParams } from './dto/written-issue';
import { AddRequestDTO, UpdateRequestDTO } from './dto/add-edit';

@Controller('model/:modelId')
@ApiTags('written_issues')
export class WrittenIssueController {
  constructor(private writtenIssueService: WrittenIssueService) {}

  @Get('/written_issues')
  async get(
    @Param('modelId') modelId: string,
    @Query() query: WrittenIssueSearchParams,
  ) {
    return await this.writtenIssueService.get(modelId, query);
  }

  @Get('section/:sectionId/written_issues')
  async getBySection(
    @Param('sectionId') sectionId: string,
    @Param('modelId') modelId: string,
    @Query() query: WrittenIssueSearchParams,
  ) {
    return await this.writtenIssueService.getBySection(
      modelId,
      sectionId,
      query,
    );
  }

  @Get('section/:sectionId/written_issues/:id')
  async getById(
    @Param('sectionId') sectionId: string,
    @Param('id') id: string,
  ) {
    return await this.writtenIssueService.getById(sectionId, id);
  }

  @Post('section/:sectionId/written_issues')
  async create(
    @Param('sectionId') sectionId: string,
    @Body() data: AddRequestDTO,
  ) {
    return await this.writtenIssueService.create(sectionId, data);
  }

  @Put('section/:sectionId/written_issues/:id')
  async update(@Param('id') id: string, @Body() data: UpdateRequestDTO) {
    return await this.writtenIssueService.update(id, data);
  }

  @Delete('section/:sectionId/written_issues/:id')
  async delete(@Param('id') id: string) {
    return await this.writtenIssueService.destroy(id);
  }
}
