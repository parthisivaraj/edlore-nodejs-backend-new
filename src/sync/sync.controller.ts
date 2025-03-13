import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@app/common-utils';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  @Public()
  async pullData(
    @Query('lastSyncAt') lastSyncAt: string,
    @Res() res: Response,
  ) {
    const lastSyncDate = lastSyncAt ? new Date(lastSyncAt) : null;
    const zipBuffer = await this.syncService.pullData(lastSyncDate);

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="files_with_metadata.zip"`,
      'Content-Length': zipBuffer.length,
    });

    res.send(zipBuffer);
  }

  @Post('push')
  @Public()
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File): Promise<any> {
    try {
      console.log('🚀 ~ SyncController ~ upload ~ file:', file);

      const fileType = file.mimetype;
      if (fileType !== 'application/zip') {
        throw new HttpException(
          'Only ZIP files are allowed',
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }
      await this.syncService.extractZipData(file.buffer);

      return {
        message: 'ZIP file uploaded and processed successfully',
      };
    } catch (error) {
      console.error('Error processing ZIP:', error);
      throw new HttpException(
        'Failed to process ZIP file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
