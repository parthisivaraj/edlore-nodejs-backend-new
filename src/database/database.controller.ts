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
import { DatabaseService } from './database.service';
import {
  CreateDatabaseDTO,
  DocumentContentDTO,
  RemoveDatabaseDocumentDTO,
} from './dto/database1';

@Controller('database')
@ApiTags('database')
export class DatabaseController {
  constructor(private databaseService: DatabaseService) {}

  @Get('')
  async get() {
    return this.databaseService.get();
  }

  @Get('up')
  async up() {
    return this.databaseService.up();
  }

  @Get('search/:id')
  searchQuery(@Param('id') id: string, @Query('query') query: string) {
    return this.databaseService.searchQuery(id, query);
  }

  @Post('remove-document')
  deleteDocument(@Body() data: RemoveDatabaseDocumentDTO) {
    return this.databaseService.deleteDocument(data);
  }

  @Post('')
  async post(@Body() data: CreateDatabaseDTO) {
    return this.databaseService.create(data);
  }

  @Put(':id')
  uploadTextContent(@Param('id') id: string, @Body() body: DocumentContentDTO) {
    return this.databaseService.update(id, body);
  }

  @Delete(':database_id')
  async deleteDatabase(
    @Param('database_id') database_id: string,
  ): Promise<void> {
    await this.databaseService.deleteDatabase(database_id);
  }
}
