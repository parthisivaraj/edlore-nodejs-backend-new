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
import { AssetNotesService } from './asset-notes.service';
import { SearchDTO } from './dto/list';
import { AddEditNoteDTO } from './dto/asset-notes';

@Controller('asset_notes')
@ApiTags('asset_notes')
export class AssetNotesController {
  constructor(private notesService: AssetNotesService) {}

  @Get('')
  async get(@Query() query: SearchDTO) {
    return await this.notesService.get(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.notesService.getById(id);
  }

  @Post('')
  async create(@Body() data: AddEditNoteDTO) {
    return await this.notesService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: AddEditNoteDTO) {
    return await this.notesService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.notesService.remove(id);
  }
}
