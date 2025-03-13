import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddStepDTO } from './dto/add-edit';
import { StepService } from './step.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('step')
@ApiTags('step')
export class StepController {
  constructor(private stepService: StepService) {}

  @Post('')
  @HttpCode(201)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'medias[]', maxCount: 10 }, // Accept up to 10 files in 'medias[]'
    ]),
  )
  async create(
    @Body() data: AddStepDTO,
    @Req() req: any,
    @UploadedFiles()
    files: { [fieldname: string]: Express.Multer.File[] },
  ) {
    return await this.stepService.create(data, files, req.user.org_id);
  }
}
