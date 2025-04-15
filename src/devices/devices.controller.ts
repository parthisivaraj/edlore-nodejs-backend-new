import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeviceService } from './devices.service';
import {
  ChangeStatusDeviceDto,
  CreateDeviceDto,
  UpdateDeviceDto,
} from './dto/devices';
import { DeviceSearchParams } from './dto/seach';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';

@Controller('device')
@ApiTags('device')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @Get('')
  async get(@Query() query: DeviceSearchParams) {
    return await this.deviceService.get(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.deviceService.getById(id);
  }

  @Post('')
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body() data: CreateDeviceDto,
    @UploadedFiles() files: Express.Multer.File[], // This will contain uploaded files, including the image
  ) {
    const image = (files || []).find((file) => file.fieldname === 'image'); // Extract the image file

    return await this.deviceService.create(data, image);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() data: UpdateDeviceDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    try {
      const updatedDevice = await this.deviceService.update(id, data, image);
      return {
        message: 'Device Updated Successfully',
        device: updatedDevice,
      };
    } catch (error) {
      // Handle any errors, e.g., validation issues
      throw new HttpException(
        {
          message: 'Failed to update',
          errors: error.response || error.message,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  @Put(':id')
  async changeStatus(
    @Param('id') id: string,
    @Body() data: ChangeStatusDeviceDto,
  ) {
    return await this.deviceService.changeStatus(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.deviceService.remove(id);
  }
}
