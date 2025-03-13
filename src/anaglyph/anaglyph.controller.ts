import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  HttpStatus,
  BadRequestException,
  UseInterceptors,
  Headers,
} from '@nestjs/common';
import { AnaglyphService } from './anaglyph.service';
import { ApiTags } from '@nestjs/swagger';
import { SearchParamsDTO } from '@app/schema/dto';
import {
  AddEditRequestDTO,
  UpdateRequestDTO,
  UpdateThumbUrlDTO,
} from './dto/add-edit';
import {
  AddEditPartNoteRequestDTO,
  AddEditPartRequestDTO,
} from './dto/add-edit-part';
import { MediaService } from 'src/media/media.service';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { SetAdmin } from '@app/common-utils';
import { UpdateMediaDTO } from 'src/media/dto/response';

@Controller('model/:modelId')
@ApiTags('anaglyph')
export class AnaglyphController {
  constructor(
    private readonly anaglyphService: AnaglyphService,
    private mediaService: MediaService,
  ) {}

  @Get('/display_all_anaglyph')
  async get(
    @Param('modelId') modelId: string,
    @Headers('Admin') admin: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.anaglyphService.get(modelId, query, !!admin);
  }

  @Get('/anaglyph/:id')
  async getById(@Param('id') id: string) {
    return await this.anaglyphService.getById(id);
  }

  @Get('/anaglyph/:id/parts')
  async getPartsById(@Param('id') id: string, @Query() query: SearchParamsDTO) {
    return await this.anaglyphService.getPartsById(id, query);
  }

  @Get('anaglyph/:id/parts/:part_id/notes')
  @SetAdmin()
  async getPartNote(
    @Param('model_id') modelId: string,
    @Param('part_id') partId: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.anaglyphService.getPartNote(modelId, partId, query);
  }

  @Get('anaglyph/:id/parts/:part_id/medias')
  @SetAdmin()
  async getPartMedia(
    @Param('part_id') partId: string,
    @Query() query: SearchParamsDTO,
  ) {
    return await this.anaglyphService.getPartMedia(partId, query);
  }

  @Delete('anaglyph/:id/parts/:part_id/medias/:media_id')
  @SetAdmin()
  async deletePartMedia(
    @Param('model_id') modelId: string,

    @Param('part_id') partId: string,
    @Param('media_id') mediaId: string,
  ) {
    return await this.anaglyphService.deletePartMedia(modelId, partId, mediaId);
  }

  @Put('anaglyph/:id/parts/:part_id/medias/:media_id')
  @SetAdmin()
  async updateMedia(
    @Param('media_id') id: string,
    @Body() updateMediaDTO: UpdateMediaDTO,
  ) {
    return await this.mediaService.updateByMedia(id, updateMediaDTO);
  }

  @Get('anaglyph/:id/parts/:part_id/notes/:note_id')
  async getPartNoteById(
    @Param('model_id') modelId: string,
    @Param('part_id') partId: string,
    @Param('note_id') noteId: string,
  ) {
    return await this.anaglyphService.getPartNoteById(modelId, partId, noteId);
  }

  @Get('/anaglyph/:id/parts/:partId')
  async getByPartId(@Param('partId') partId: string) {
    return await this.anaglyphService.getByPartId(partId);
  }

  @Post('anaglyph')
  async create(
    @Param('modelId') modelId: string,
    @Body() data: AddEditRequestDTO,
  ) {
    return await this.anaglyphService.create(modelId, data);
  }

  @Patch('anaglyph/:id')
  async update(@Param('id') id: string, @Body() data: UpdateRequestDTO) {
    return await this.anaglyphService.update(id, data);
  }

  @Put('anaglyph/:id/update_thumb_url')
  async update_thumb_url(
    @Param('id') id: string,
    @Body() data: UpdateThumbUrlDTO,
  ) {
    return await this.anaglyphService.update_thumb_url(id, data);
  }

  @Delete('anaglyph/:id')
  async delete(@Param('id') id: string) {
    return await this.anaglyphService.destroy(id);
  }

  @Post('anaglyph/:id/parts')
  async createPart(
    @Param('id') anaglyphId: string,
    @Body() data: AddEditPartRequestDTO,
  ) {
    return await this.anaglyphService.createPart(anaglyphId, data);
  }

  @Post('anaglyph/:id/parts/:part_id/notes')
  async createPartNote(
    @Param('model_id') modelId: string,
    @Param('part_id') partId: string,
    @Body() data: AddEditPartNoteRequestDTO,
  ) {
    return await this.anaglyphService.createPartNote(modelId, partId, data);
  }

  @Put('anaglyph/:id/parts/:part_id/notes/:note_id')
  async updatePartNote(
    @Param('model_id') modelId: string,
    @Param('part_id') partId: string,
    @Param('note_id') noteId: string,

    @Body() data: AddEditPartNoteRequestDTO,
  ) {
    return await this.anaglyphService.updatePartNote(
      modelId,
      partId,
      noteId,
      data,
    );
  }

  @Put('anaglyph/:id/parts/:partId')
  async updatePart(
    @Param('partId') partId: string,
    @Body() data: AddEditPartRequestDTO,
  ) {
    return await this.anaglyphService.updatePart(partId, data);
  }

  @Delete('anaglyph/:id/parts/clear_all_parts')
  async clear_all_parts(@Param('id') id: string) {
    return await this.anaglyphService.clearAllParts(id);
  }

  @Delete('anaglyph/:id/parts/:part_id/notes/:note_id')
  async deleteNote(
    @Param('model_id') modelId: string,
    @Param('part_id') partId: string,
    @Param('note_id') noteId: string,
  ) {
    return await this.anaglyphService.deleteNote(modelId, partId, noteId);
  }

  @Delete('anaglyph/:id/parts/:partId')
  async deletePart(@Param('partId') partId: string) {
    return await this.anaglyphService.destroyPart(partId);
  }

  @Post('anaglyph/:anaglyphId/parts/csv_upload')
  @UseInterceptors(FileInterceptor('csv_file'))
  async csvUpload(
    @Param('modelId') modelId: string,
    @Param('anaglyphId') anaglyphId: string,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let response = {
      message: 'Csv file or link required',
      status: HttpStatus.NOT_FOUND,
    };

    if (body.attached_csv_id) {
      const csvFile = await this.mediaService.getRecordById(
        body.attached_csv_id,
      );

      if (!csvFile) {
        throw new BadRequestException('File not found');
      }

      if (csvFile.content_type !== 'text/csv') {
        throw new BadRequestException('File is not csv format');
      }

      response = await this.anaglyphService.startUploading(
        anaglyphId,
        csvFile.url,
      );
    }

    // Handling uploaded file directly
    if (file) {
      if (file.mimetype !== 'text/csv') {
        throw new BadRequestException('File is not csv format');
      }

      response = await this.anaglyphService.startUploading(
        anaglyphId,
        file.path,
      );
    }

    // Handling external CSV link
    if (body.csv_link) {
      let tmpFilePath;
      try {
        tmpFilePath = await this.mediaService.downloadCSVFromURL(body.csv_link);

        response = await this.anaglyphService.startUploading(
          anaglyphId,
          tmpFilePath,
        );
      } catch (error) {
        throw new BadRequestException(
          error + 'Unable to download file or file is not CSV format',
        );
      } finally {
        console.log('Deleting tmp file' + tmpFilePath);
        fs.unlinkSync(tmpFilePath);
      }
    }

    return {
      message: response.message,
      status: response.status,
    };
  }
}
