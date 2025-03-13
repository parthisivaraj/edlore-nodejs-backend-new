import { Controller, Post, Body, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeviceTokenService } from './device.service';
import { CreateDeviceTokenDTO } from './dto/device-token';
import { DeviceToken } from '@app/schema';

@Controller('device_token')
@ApiTags('device-token')
export class DeviceTokenController {
  constructor(private readonly deviceTokenService: DeviceTokenService) {}

  @Post()
  async create(
    @Body() body: CreateDeviceTokenDTO,
    @Request() req,
  ): Promise<DeviceToken> {
    return this.deviceTokenService.createDeviceToken(body, req.user);
  }
}
