import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
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
  async create(@Body() data: CreateDeviceDto) {
    return await this.deviceService.create(data);
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
    const result = await this.deviceService.remove(id);
    if (!result.affected) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return { message: 'Device deleted successfully' };
  }
}
