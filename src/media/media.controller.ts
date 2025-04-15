import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaService } from './media.service';
import { MediaSearchParams } from './dto/search';
import { MediaDTO, UpdateMediaDTO } from './dto/response';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  CreateAWSMediaDTO,
  CreateMediaDTO,
  CreateUnityAWSMediaDTO,
  UploadFileParams,
} from './dto/upload';

@Controller('media')
@ApiTags('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('')
  async get(@Query() query: MediaSearchParams) {
    return await this.mediaService.get(query);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.uploadFile(file);
  }

  @Post('create_media')
  @UseInterceptors(FileInterceptor('media'))
  async createMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateMediaDTO,
    @Req() req: any,
  ) {
    return await this.mediaService.createMedia(file, body, req.user.org_id);
  }

  @Post('create_aws_media')
  async createAWSMedia(@Body() body: CreateAWSMediaDTO, @Req() req: any) {
    return await this.mediaService.createAWSMedia(body, req.user.org_id);
  }

  @Post('create_unity_aws_media')
  async createUnityAWSMedia(
    @Body() body: CreateUnityAWSMediaDTO,
    @Req() req: any,
  ) {
    return await this.mediaService.createAWSMediaUnity(body, req.user.org_id);
  }

  @Post('chunk')
  @UseInterceptors(FileInterceptor('file'))
  async receiveInChunk(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.receiveInChunk(file);
  }

  @Post('complete')
  async complete(@Body() body: any, @Query() query: UploadFileParams) {
    return this.mediaService.complete(body, query);
  }

  @Post('clear_tmp_files')
  async clearTmpFiles(@Body() json: string[]) {
    return this.mediaService.clearTmpFiles(json);
  }

  @Put(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body() updateMediaDTO: UpdateMediaDTO,
  ): Promise<MediaDTO> {
    return await this.mediaService.update(id, updateMediaDTO);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.mediaService.delete(id);
  }
}
