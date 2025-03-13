import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { Public } from '@app/common-utils';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('')
  @Public()
  async ping() {
    return await this.healthService.ping();
  }
}
