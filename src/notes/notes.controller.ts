import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NoteService } from './notes.service';
import { AddEditNoteDTO } from './dto/notes';
import { SearchParamsDTO } from '@app/schema/dto';

@Controller('notes')
@ApiTags('notes')
export class NotesController {
  constructor(private notesService: NoteService) {}

  @Get('')
  async get(@Query() query: SearchParamsDTO, @Request() req) {
    return await this.notesService.get(query, req.user);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const note = await this.notesService.getById(id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  @Post('')
  async create(@Body() data: AddEditNoteDTO, @Request() req) {
    return await this.notesService.create(data, req.user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: AddEditNoteDTO) {
    return await this.notesService.update(id, data);
  }

  @Patch(':id')
  async patch(@Param('id') id: string, @Body() data: AddEditNoteDTO) {
    return await this.notesService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.notesService.remove(id);
  }
}
