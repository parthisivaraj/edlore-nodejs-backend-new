import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { Public } from '@app/common-utils';

@Controller('organization')
@ApiTags('organization')
export class OrganizationController {
  constructor(private organizationService: OrganizationService) {}

  @Get('details')
  @Public()
  async ping() {
    return await this.organizationService.logo();
  }
}
