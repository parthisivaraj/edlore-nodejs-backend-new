import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TabletVersionsService } from './tablet-versions.service';
import { TabletVersions } from '@app/schema';

@Controller('tablet_versions')
@ApiTags('tablet_versions')
export class TabletVersionsController {
  constructor(private tableVersionService: TabletVersionsService) {}

  @Get('')
  async get() {
    return await this.tableVersionService.get();
  }

  @Post('')
  async create(@Body() data: TabletVersions) {
    return await this.tableVersionService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: TabletVersions) {
    return await this.tableVersionService.update(id, data);
  }
}
