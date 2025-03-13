import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@ApiTags('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('')
  async get() {
    return await this.dashboardService.get();
  }
}
