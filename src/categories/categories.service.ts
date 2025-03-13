import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Category,
  Device,
  DeviceStatus,
  Model,
  WhichCategory,
} from '@app/schema';
import { Brackets, DataSource, In, QueryRunner, Repository } from 'typeorm';
import {
  CategoryResponse,
  CategoryResponseDto,
  CategorySearchParams,
  CategorySubDto,
  SubCategoryResponse,
  TabDeviceDto,
} from './dto/categories';
import { DateUtilsService } from '@app/common-utils';
import { AddEditCategoryDTO, EditCategoryDTO } from './dto/add-edit';
import { ModelResponseDto } from 'src/model/dto/model';
import { MediaService } from 'src/media';

@Injectable()
export class CategoriesService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(Model)
    private modelRepository: Repository<Model>,
    private mediaService: MediaService,
  ) {}

  private calculateModelCount(category: Category): number {
    let count = (category.models || []).length;
    count += (category.sub_categories || []).reduce(
      (acc, subCategory) => acc + (subCategory.models || []).length,
      0,
    );
    return count;
  }

  private getSubCategories(category: Category): CategorySubDto[] {
    return (category.sub_categories || []).map((subCategory) => {
      const subDto = new CategorySubDto();
      subDto.id = subCategory.id;
      subDto.name = subCategory.name;
      subDto.model_count = (subCategory.models || []).length;
      return subDto;
    });
  }

  private convertToDTO(categories: Category[]) {
    const categoryDtos: CategoryResponseDto[] = categories.map((category) => {
      const dto = new CategoryResponseDto();
      dto.id = category.id;
      dto.name = category.name;
      dto.model_count = this.calculateModelCount(category);
      dto.created_at = DateUtilsService.dateToString(category.created_at);
      dto.sub_categories = this.getSubCategories(category);
      return dto;
    });
    return categoryDtos;
  }

  private convertToBaseDTO(categories: Category[]) {
    const categoryDtos: CategoryResponseDto[] = categories.map((category) => {
      const dto = new CategoryResponseDto();
      dto.id = category.id;
      dto.name = category.name;
      return dto;
    });
    return categoryDtos;
  }

  async getAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository
      .createQueryBuilder('category')
      .andWhere({ is_deleted: false })
      .getMany();

    return await this.convertToBaseDTO(categories);
  }

  private async convertDeviceDTO(device: Device): Promise<TabDeviceDto> {
    let image = '';
    if (device.attachedMedia && device.attachedMedia.length > 0) {
      image = await this.mediaService.getThumbnailUrl(
        'image',
        device.attachedMedia[0].blob,
      );
    }

    return {
      depth: device.depth,
      device_id: device.device_id,
      generated_qr: '',
      id: device.id,
      image: image,
      last_repair_date: (device.last_repair_date || '').toString(),
      length: device.length,
      location: device.device_location,
      manufactured_by: device.manufactured_by,
      manufactured_date: (device.manufactured_date || '').toString(),
      model: {
        id: device.model_id.id,
        title: device.model_id.title,
      },
      serial_number: device.serial_number,
      name: device.name || 'Unnamed Device',
      status: DeviceStatus[device.status],
      category: device.model_id?.category_id?.name || null,
      warranty_till: (device.warranty_till || '').toString(),
      width: device.width,
    };
  }

  async tab(categoryId: string): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['sub_categories'], // Assuming `subCategories` is a relation in the `Category` entity.
    });
    const subCategoryIds = category.sub_categories.map((sub) => sub.id);
    const categoryIds = [...subCategoryIds, categoryId];

    const [devices, total] = await this.deviceRepository.findAndCount({
      where: { is_deleted: false, model_id: { category_id: In(categoryIds) } }, // Assuming the relation exists.
      relations: ['model_id', 'attachedMedia', 'attachedMedia.blob'],
    });
    const newDevices = await Promise.all(
      devices.map((device) => this.convertDeviceDTO(device)),
    );
    return {
      pagination: {
        total,
        page: 1,
        limit: 100,
      },
      devices: newDevices,
    };
  }

  async getPrimary(params: CategorySearchParams): Promise<CategoryResponse> {
    let queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.status = :status', { status: true })
      .andWhere({ is_deleted: false })
      .andWhere('category.parent_id IS NULL');

    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `category.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('category.updated_at', 'DESC');
    }

    if (params.search) {
      const escapedKeyword = params.search.replace(
        /[!@#$%\^&*()\[\]{}|;:,./<>?\\']/g,
        '\\$&',
      );

      queryBuilder = queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("category.name ILIKE :search ESCAPE '\\'", {
            search: `%${escapedKeyword}%`,
          })
            .orWhere("category.id::text ILIKE :search ESCAPE '\\'", {
              search: `%${escapedKeyword}%`,
            })
            .orWhere("subCategory.name ILIKE :search ESCAPE '\\'", {
              search: `%${escapedKeyword}%`,
            });
        }),
      );
    }

    if (params.primary_only) {
      const categories = await queryBuilder.getMany();
      return {
        message: 'Success',
        categories: this.convertToBaseDTO(categories),
      };
    }

    queryBuilder = queryBuilder
      .leftJoinAndSelect(
        'category.models',
        'model',
        'model.is_deleted = :is_deleted',
        { is_deleted: false },
      ) // Fetch related models
      .leftJoinAndSelect(
        'category.sub_categories',
        'subCategory',
        'subCategory.is_deleted = :is_deleted',
        { is_deleted: false },
      )
      .leftJoinAndSelect(
        'subCategory.models',
        'subCategoryModel',
        'subCategoryModel.is_deleted = :is_deleted',
        { is_deleted: false },
      );

    // Handle pagination
    const take = !params.limit ? undefined : 10; // Set your desired pagination limit
    const skip = (params.page - 1) * take;
    const [categories, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      categories: this.convertToDTO(categories),
      pagination: {
        current_page: params.page,
        offset: skip,
        per_page: take,
        total_entries: total,
      },
      message: 'Success',
    };
  }

  async getSecondary(
    params: CategorySearchParams,
  ): Promise<SubCategoryResponse> {
    let queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where({ parent_id: params.parent_id })
      .andWhere({ is_deleted: false });

    if (params.sort_column && params.sort_order) {
      queryBuilder = queryBuilder.orderBy(
        `category.${params.sort_column}`,
        params.sort_order,
      );
    } else {
      queryBuilder = queryBuilder.orderBy('category.updated_at', 'DESC');
    }

    const categories = await queryBuilder.getMany(); // Adjust skip based on your pagination logic

    return {
      secondary_categories: this.convertToBaseDTO(categories),
    };
  }

  private convertToModelDTO(model: Model) {
    const response = new ModelResponseDto();
    response.model_id = model.model_id;
    response.title = model.title;
    response.id = model.id;
    response.linked_devices = model.devices.length;
    response.which_category = WhichCategory[model.which_category];
    response.created_at = DateUtilsService.dateToString(model.created_at);
    return response;
  }

  async getById(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['sub_categories'], // Assuming subCategories is a relation on the Category entity
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const categoryIds = category.sub_categories
      .filter((x) => !x.is_deleted)
      .map((sub) => sub.id);
    categoryIds.push(category.id);

    const models = await this.modelRepository.find({
      where: { is_deleted: false, category_id: In(categoryIds) },
      relations: ['devices'],
    });

    return {
      models: {
        id: category.id,
        name: category.name,
        models: models.map((model) => this.convertToModelDTO(model)),
      },
    };
  }

  async getAllModels(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['sub_categories'], // Assuming subCategories is a relation on the Category entity
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    const categoryIds = category.sub_categories
      .filter((x) => !x.is_deleted)
      .map((sub) => sub.id);
    categoryIds.push(category.id);

    const models = await this.modelRepository.find({
      where: { is_deleted: false, category_id: In(categoryIds) }, // Adjusted to use category relation
    });

    return {
      models: models.map((item) => ({
        id: item.id,
        title: item.title,
      })),
    };
  }

  async create(createCategoryDto: AddEditCategoryDTO) {
    const { name, sub_categories_attributes, org_id } = createCategoryDto;

    // Check for unique sub-category names
    const errors = this.subCategoryUniqueValidation(
      sub_categories_attributes,
      name,
    );
    if (errors.length > 0) {
      throw new BadRequestException({ errors });
    }

    const category = this.categoryRepository.create({
      name,
      org_id: org_id as any,
      sub_categories: sub_categories_attributes,
    });
    try {
      await this.categoryRepository.save(category);
      return {
        message: 'Successfully Saved the Category',
        name: category.name,
        category_id: category.id,
      };
    } catch {
      throw new BadRequestException({
        errors: [{ message: 'There was an error saving the category' }],
      });
    }
  }

  private subCategoryUniqueValidation(
    sub_categories_attributes: any[],
    primaryName: string,
  ) {
    const categoryNames = sub_categories_attributes.map((category, index) => ({
      name: category.name,
      index,
    }));

    const uniqueObjs = {};
    const nonUniqueIndexes = [];
    const errors = [];

    // Iterate over each sub-category
    categoryNames.forEach((obj, idx) => {
      const val = obj.name;

      if (!uniqueObjs[val]) {
        uniqueObjs[val] = [idx];
      } else {
        uniqueObjs[val].push(idx);
      }
    });

    // Filter non-unique objects
    const nonUniqueObjs = categoryNames.filter(
      (obj) => uniqueObjs[obj.name].length > 1,
    );
    nonUniqueObjs.forEach((_, index) => {
      nonUniqueIndexes.push(index);
    });

    // Add validation errors for non-unique sub-categories
    nonUniqueIndexes.forEach((nonUniqueIndex) => {
      errors.push({
        message: 'Name should be unique',
        index: nonUniqueIndex,
        value: sub_categories_attributes[nonUniqueIndex].name,
        name: 'secondary_category_name',
      });
    });

    // Check if sub-category name matches primary category name
    sub_categories_attributes.forEach((subCategory, index) => {
      if (subCategory.name === primaryName) {
        errors.push({
          message: 'Name should be unique',
          value: subCategory.name,
          name: 'primary_category_name',
        });
        errors.push({
          message: 'Same as primary name',
          index,
          value: subCategory.name,
          name: 'secondary_category_name',
        });
      }
    });

    return errors;
  }

  async update(id: string, data: EditCategoryDTO) {
    const category = await this.categoryRepository.findOne({
      where: { id, is_deleted: false },
      relations: ['sub_categories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    try {
      // Update the category entity with the new values
      // Object.assign(category, {
      //   name: data.name || category.name,
      //   org_id: data.org_id,
      //   sub_categories: data.sub_categories_attributes,
      // });
      
      category.name = data.name || category.name;
      category.sub_categories = category.sub_categories || [];
  

      if (data.sub_categories_attributes) {
        for (const subCategoryData of data.sub_categories_attributes) {
          if (subCategoryData.id) {
            let subCategory = category.sub_categories.find(
              (sub) => sub.id === subCategoryData.id
            );
  
            if (subCategory) {
              subCategory.name = subCategoryData.name || subCategory.name;
            } else {
              subCategory = this.categoryRepository.create({
                name: subCategoryData.name,
                parent_id: category,
              });
              category.sub_categories.push(subCategory);
            }
          } else {
            const newSubCategory = this.categoryRepository.create({
              name: subCategoryData.name,
              parent_id: category,
            });
            category.sub_categories.push(newSubCategory);
          }
        }
      }
      
      await this.categoryRepository.save(category);

      return {
        message: 'Category Updated Successfully',
        category,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ errors: 'Something went wrong', error });
    }
  }

  async destroyCategory(id: string, newCategoryId?: string) {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const category = await queryRunner.manager.findOne(Category, {
        where: { id },
        relations: ['models', 'sub_categories', 'sub_categories.models'],
      });

      if (!category) {
        throw new NotFoundException(`Category with id ${id} not found`);
      }

      const modelsCount = category.models.length;
      const secondaryCategoryCount = category.sub_categories.length;

      let message = 'Successfully deleted';

      if (modelsCount > 0 || secondaryCategoryCount > 0) {
        if (newCategoryId) {
          const newCategory = await queryRunner.manager.findOne(Category, {
            where: { id: newCategoryId },
          });

          if (!newCategory) {
            throw new NotFoundException(
              `New Category with id ${newCategoryId} not found`,
            );
          }

          // Move models to the new category
          if (newCategory.parent_id) {
            await queryRunner.manager.update(
              Model,
              { category_id: category },
              {
                category_id: newCategory,
                which_category: WhichCategory.secondary,
              },
            );
          } else {
            await queryRunner.manager.update(
              Model,
              { category_id: category },
              {
                category_id: newCategory,
                which_category: WhichCategory.primary,
              },
            );
          }

          // Update sub-categories' parent_id
          if (!newCategory.parent_id) {
            await queryRunner.manager.update(
              Category,
              { parent_id: category.id },
              { parent_id: { id: newCategory.id } },
            );
          } else {
            await queryRunner.manager.update(
              Category,
              { parent_id: category.id },
              { parent_id: newCategory.parent_id },
            );
          }

          // Delete the category
          await this.destroyCategoryAndRespond(queryRunner, category);
          message = `Successfully deleted and moved all models to ${newCategory.name}`;
        } else {
          // Cannot delete since models are associated, return conflict response
          throw new ConflictException({
            message:
              'Failed to delete category, since models are associated with it',
            models_count: modelsCount,
            category_name: category.name,
            primary_category: category.parent_id === null,
            secondary_category_count: secondaryCategoryCount,
            secondary_categories: category.sub_categories.map((item) => ({
              id: item.id,
              model_count: item.models.length,
              name: item.name,
            })),
          });
        }
      } else {
        // No models or sub-categories, delete the category
        await this.destroyCategoryAndRespond(queryRunner, category);
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      return { message, title: category.name };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner when done
      await queryRunner.release();
    }
  }

  private async destroyCategoryAndRespond(
    queryRunner: QueryRunner,
    category: Category,
  ) {
    try {
      await queryRunner.manager.update(
        Category,
        { id: category.id },
        {
          is_deleted: true,
        },
      );
    } catch (error) {
      console.log('here', error);
      throw new BadRequestException(error);
    }
  }
}
