import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RealiseNoteService } from './realise-note.service';
import { GetRealiseNoteDto } from './dto/realise-note';
import { AddEditRealiseNoteDto } from './dto/add-edit';

@Controller('realise_note')
@ApiTags('realise_note')
export class RealiseNoteController {
  constructor(private realiseNoteService: RealiseNoteService) {}
  @Get()
  async get(): Promise<GetRealiseNoteDto[]> {
    return this.realiseNoteService.get();
  }

  @Post('')
  async save(@Body() data: AddEditRealiseNoteDto) {
    return await this.realiseNoteService.save(data);
  }
}
