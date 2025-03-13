import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategorySearchParams } from './dto/categories';
import {
  AddEditCategoryDTO,
  DestoryDTO,
  EditCategoryDTO,
} from './dto/add-edit';

@Controller('category')
@ApiTags('category')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get('')
  async getAll() {
    return await this.categoriesService.getAll();
  }

  @Get('tab/:id')
  async tab(@Param('id') id: string) {
    return await this.categoriesService.tab(id);
  }

  @Get('primary')
  async primary(@Query() query: CategorySearchParams) {
    return await this.categoriesService.getPrimary(query);
  }

  @Get('secondary')
  async secondary(@Query() query: CategorySearchParams) {
    return await this.categoriesService.getSecondary(query);
  }

  @Get(':id/get_all_models')
  async getAllModels(@Param('id') id: string) {
    return await this.categoriesService.getAllModels(id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return await this.categoriesService.getById(id);
  }

  @Post('')
  async create(@Body() data: AddEditCategoryDTO) {
    return await this.categoriesService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: EditCategoryDTO) {
    return await this.categoriesService.update(id, data);
  }

  @Post(':id/destroy')
  async remove(@Param('id') id: string, @Body() data: DestoryDTO) {
    return await this.categoriesService.destroyCategory(
      id,
      data.new_category_id,
    );
  }
}
