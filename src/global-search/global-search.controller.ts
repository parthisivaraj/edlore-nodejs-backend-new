import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GlobalSearchService } from './global-search.service';
import { GlobalSearchParams } from './dto/search';

@Controller('global_search')
@ApiTags('global_search')
export class GlobalSearchController {
  constructor(private globalSearchService: GlobalSearchService) {}

  @Get('')
  async get(@Query() query: GlobalSearchParams) {
    return await this.globalSearchService.get(query);
  }
}
